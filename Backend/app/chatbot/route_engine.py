"""Route calculation and waterlogging corridor analysis engine for Ask Kolkata.

Identifies origin & destination, fetches/interpolates route geometry,
calculates spatial proximity corridor to municipal prediction zones,
and extracts affected localities strictly along the path.
"""

import math
import json
import logging
import urllib.request
from typing import Dict, List, Optional, Tuple, Any

from app.chatbot.locality_extractor import LocalityExtractor, LocalityInfo

logger = logging.getLogger(__name__)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance between two coordinates in kilometers."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def distance_point_to_segment_km(
    p_lat: float, p_lon: float,
    a_lat: float, a_lon: float,
    b_lat: float, b_lon: float,
) -> float:
    """Shortest distance from point P to line segment AB on the Earth's surface (km)."""
    # Flat approximation for short urban segments
    # Convert lat/lon differences to km
    mid_lat = (a_lat + b_lat) / 2.0
    deg_lat_km = 110.574
    deg_lon_km = 111.320 * math.cos(math.radians(mid_lat))

    ax = a_lon * deg_lon_km
    ay = a_lat * deg_lat_km
    bx = b_lon * deg_lon_km
    by = b_lat * deg_lat_km
    px = p_lon * deg_lon_km
    py = p_lat * deg_lat_km

    dx = bx - ax
    dy = by - ay

    seg_len_sq = dx * dx + dy * dy
    if seg_len_sq == 0.0:
        return math.hypot(px - ax, py - ay)

    # Projection parameter t
    t = ((px - ax) * dx + (py - ay) * dy) / seg_len_sq
    t = max(0.0, min(1.0, t))

    proj_x = ax + t * dx
    proj_y = ay + t * dy

    return math.hypot(px - proj_x, py - proj_y)


class RouteEngine:
    """Orchestrates route planning and waterlogging corridor intersection."""

    @classmethod
    def resolve_endpoint(cls, endpoint_name: str) -> Optional[Dict[str, Any]]:
        """Resolve an origin or destination name into coordinates and canonical display."""
        if not endpoint_name or not endpoint_name.strip():
            return None

        # 1. Check LocalityExtractor
        loc, _, _ = LocalityExtractor.extract_locality(endpoint_name)
        if loc:
            return {
                "name": loc.display_name,
                "canonical_name": loc.canonical_name,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "ward": loc.ward,
                "ulb_name": loc.ulb_name,
            }

        # 2. Forward Geocode fallback
        from app.services.geocoding_service import GeocodingService
        geocoded = GeocodingService.forward_geocode(endpoint_name)
        if geocoded:
            nearest = LocalityExtractor.find_nearest_locality(
                geocoded["latitude"], geocoded["longitude"]
            )
            canonical = nearest.canonical_name if nearest else endpoint_name
            return {
                "name": endpoint_name.title(),
                "canonical_name": canonical,
                "latitude": geocoded["latitude"],
                "longitude": geocoded["longitude"],
                "ward": nearest.ward if nearest else "",
                "ulb_name": nearest.ulb_name if nearest else "",
            }

        return None

    @classmethod
    def fetch_route_geometry(
        cls,
        lat1: float, lon1: float,
        lat2: float, lon2: float,
    ) -> Tuple[List[List[float]], float]:
        """Fetch driving route geometry from OSRM or fallback to geodesic interpolation.

        Returns:
            (coordinates_list [[lon, lat], ...], total_distance_km)
        """
        # Try OSRM with short timeout
        osrm_url = (
            f"http://router.project-osrm.org/route/v1/driving/"
            f"{lon1:.6f},{lat1:.6f};{lon2:.6f},{lat2:.6f}"
            f"?overview=full&geometries=geojson"
        )
        try:
            req = urllib.request.Request(osrm_url, headers={"User-Agent": "KWI-Chatbot/1.0"})
            with urllib.request.urlopen(req, timeout=2.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    coords = route["geometry"]["coordinates"]  # [[lon, lat], ...]
                    dist_km = float(route.get("distance", 0.0)) / 1000.0

                    # Explicitly anchor the route geometry to start at (lon1, lat1) and end at (lon2, lat2)
                    origin_pt = [round(lon1, 6), round(lat1, 6)]
                    dest_pt = [round(lon2, 6), round(lat2, 6)]
                    if coords:
                        if abs(coords[0][0] - origin_pt[0]) > 1e-5 or abs(coords[0][1] - origin_pt[1]) > 1e-5:
                            coords.insert(0, origin_pt)
                        if abs(coords[-1][0] - dest_pt[0]) > 1e-5 or abs(coords[-1][1] - dest_pt[1]) > 1e-5:
                            coords.append(dest_pt)

                    return coords, round(dist_km, 2)
        except Exception as exc:
            logger.info("OSRM direct query failed (%s); using geodesic interpolation", exc)

        # Geodesic fallback interpolation (30 waypoints)
        num_points = 30
        coords = []
        for i in range(num_points + 1):
            fraction = i / float(num_points)
            lat = lat1 + fraction * (lat2 - lat1)
            lon = lon1 + fraction * (lon2 - lon1)
            coords.append([round(lon, 6), round(lat, 6)])

        dist_km = haversine_km(lat1, lon1, lat2, lon2) * 1.25  # ~1.25 urban winding factor
        return coords, round(dist_km, 2)

    @classmethod
    def analyze_route_waterlogging(
        cls,
        origin_info: Dict[str, Any],
        destination_info: Dict[str, Any],
        predictions: List[Dict[str, Any]],
        reports: List[Any],
        corridor_radius_km: float = 1.2,
    ) -> Dict[str, Any]:
        """Intersect route geometry with waterlogging predictions & citizen reports.

        Returns strictly affected locations along the route, ordered from origin to destination.
        """
        lat1, lon1 = origin_info["latitude"], origin_info["longitude"]
        lat2, lon2 = destination_info["latitude"], destination_info["longitude"]

        route_coords, total_dist_km = cls.fetch_route_geometry(lat1, lon1, lat2, lon2)

        # Guarantee origin and destination coordinates match the route geometry endpoints
        origin_info["longitude"] = route_coords[0][0]
        origin_info["latitude"] = route_coords[0][1]
        destination_info["longitude"] = route_coords[-1][0]
        destination_info["latitude"] = route_coords[-1][1]

        # Index reports by location / ward / proximity for report counts
        report_counts_by_loc: Dict[str, int] = {}
        for r in reports:
            loc_str = str(getattr(r, "location", "") or "").lower()
            ulb_str = str(getattr(r, "assigned_ulb_name", "") or "").lower()
            ward_str = str(getattr(r, "ward", "") or "").strip()
            for key in [loc_str, ulb_str, ward_str]:
                if key:
                    report_counts_by_loc[key] = report_counts_by_loc.get(key, 0) + 1

        # Check each prediction location against route segments
        affected_localities = []

        for pred in predictions:
            p_lat = pred.get("latitude")
            p_lon = pred.get("longitude")
            if p_lat is None or p_lon is None:
                continue

            # Minimum distance from this locality to the polyline
            min_dist = float("inf")
            best_segment_idx = 0

            for i in range(len(route_coords) - 1):
                seg_a_lon, seg_a_lat = route_coords[i]
                seg_b_lon, seg_b_lat = route_coords[i + 1]

                d = distance_point_to_segment_km(
                    p_lat, p_lon,
                    seg_a_lat, seg_a_lon,
                    seg_b_lat, seg_b_lon,
                )
                if d < min_dist:
                    min_dist = d
                    best_segment_idx = i

            if min_dist <= corridor_radius_km:
                loc_name = pred.get("locality", "")
                ward = str(pred.get("ward", "") or "")
                ulb = str(pred.get("ulb_name", "") or "")

                # Calculate report count in this locality
                rpt_count = 0
                for k in [loc_name.lower(), ulb.lower(), ward.lower()]:
                    if k in report_counts_by_loc:
                        rpt_count += report_counts_by_loc[k]

                prob = float(pred.get("waterlogging_probability", 0.0) or 0.0)
                sev = float(pred.get("severity_score", 0.0) or 0.0)
                prio = float(pred.get("priority_score", 0.0) or 0.0)
                risk = pred.get("risk_level", "LOW")

                affected_localities.append({
                    "id": pred.get("id"),
                    "segment_index": best_segment_idx,
                    "distance_to_route_km": round(min_dist, 2),
                    "locality": loc_name,
                    "name": loc_name,
                    "location": f"{loc_name}{f' (Ward {ward})' if ward else ''}",
                    "ward": ward,
                    "ulb_name": ulb,
                    "district": pred.get("district", ""),
                    "latitude": p_lat,
                    "longitude": p_lon,
                    "waterlogging_probability": round(prob, 3),
                    "waterlogging_probability_pct": f"{round(prob * 100)}%",
                    "severity_score": round(sev, 3),
                    "severity_score_pct": f"{round(sev * 100)}%",
                    "priority_score": round(prio, 3),
                    "priority_score_pct": f"{round(prio * 100)}%",
                    "risk_level": risk,
                    "forecast_rain_24h_mm": pred.get("forecast_rain_24h_mm", 0.0),
                    "citizen_reports_count": rpt_count,
                    "status": pred.get("status", "ACTIVE"),
                })

        # Sort affected localities strictly along travel direction (segment_index)
        affected_localities.sort(key=lambda x: (x["segment_index"], x["distance_to_route_km"]))

        # Aggregate route risk
        high_risk_count = sum(1 for a in affected_localities if a["risk_level"] == "HIGH")
        medium_risk_count = sum(1 for a in affected_localities if a["risk_level"] == "MEDIUM")
        low_risk_count = sum(1 for a in affected_localities if a["risk_level"] == "LOW")

        max_risk = "LOW"
        if high_risk_count > 0:
            max_risk = "HIGH"
        elif medium_risk_count > 0:
            max_risk = "MEDIUM"

        avg_prob = (
            sum(a["waterlogging_probability"] for a in affected_localities) / len(affected_localities)
            if affected_localities
            else 0.0
        )

        return {
            "origin": origin_info,
            "destination": destination_info,
            "total_distance_km": total_dist_km,
            "corridor_radius_km": corridor_radius_km,
            "route_coordinates": route_coords,
            "affected_locations_count": len(affected_localities),
            "affected_locations": affected_localities,
            "max_risk_level": max_risk,
            "average_probability_pct": f"{round(avg_prob * 100)}%",
            "risk_breakdown": {
                "high": high_risk_count,
                "medium": medium_risk_count,
                "low": low_risk_count,
            },
        }
