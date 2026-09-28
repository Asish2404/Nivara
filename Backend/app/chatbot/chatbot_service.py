"""Core Ask Kolkata Chatbot Service.

Deterministic, fast, platform-specific AI interface for the Kolkata Water Intelligence system.
Independent of external LLMs or third-party APIs.
Directly interfaces with:
- WaterloggingService (Random Forest prediction snapshots & telemetry)
- ReportService & IncidentQueueService (citizen complaints and verified water levels)
- RouteEngine (spatial proximity & route corridors)
- LocalityExtractor (canonical Kolkata localities & aliases)
- IntentDetector (fast rule and pattern detection)
"""

import time
import logging
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.chatbot.schemas import (
    ChatbotQueryRequest,
    ChatbotQueryResponse,
    ChatbotAction,
)
from app.chatbot.intents import (
    IntentDetector,
    INTENT_WATERLOGGING_QUERY,
    INTENT_REPORT_QUERY,
    INTENT_AREA_QUERY,
    INTENT_ROUTE_QUERY,
    INTENT_NAVIGATION,
    INTENT_HELP,
    INTENT_GREETING,
    INTENT_UNKNOWN,
)
from app.chatbot.locality_extractor import LocalityExtractor, LocalityInfo
from app.chatbot.route_engine import RouteEngine
from app.services.waterlogging_service import WaterloggingService
from app.services.report_service import ReportService
from app.models.report import Report
from app.models.incident_queue import IncidentQueue
from app.models.historical_place import HistoricalPlace

logger = logging.getLogger(__name__)


class ChatbotService:
    """Orchestrates natural language understanding, database queries, and structured frontend actions."""

    @classmethod
    async def process_query(
        cls,
        request: ChatbotQueryRequest,
        db: AsyncSession,
        current_user: Optional[Any] = None,
    ) -> ChatbotQueryResponse:
        """Process a user message deterministically with timing instrumentation."""
        t_start = time.perf_counter()
        raw_msg = (request.message or "").strip()
        timing: Dict[str, float] = {}

        # 0. Handle empty message
        if not raw_msg:
            return ChatbotQueryResponse(
                message="Hello! I am Ask Kolkata, your municipal water intelligence assistant. Ask me about waterlogging probabilities, citizen complaints, area flood situations, navigation, or travel routes.",
                intent=INTENT_UNKNOWN,
                timing_ms={"total_response_ms": round((time.perf_counter() - t_start) * 1000, 2)},
            )

        # 1. Intent Detection
        t_intent = time.perf_counter()
        detected_intent, confidence, all_scores = IntentDetector.detect_intent(raw_msg)
        timing["intent_detection_ms"] = round((time.perf_counter() - t_intent) * 1000, 2)

        # 2. Locality Extraction (for single-locality queries)
        t_loc = time.perf_counter()
        loc_info = None
        match_type = ""
        ambiguous_options: List[str] = []

        if detected_intent != INTENT_ROUTE_QUERY:
            loc_info, match_type, ambiguous_options = LocalityExtractor.extract_locality(raw_msg)
        timing["locality_extraction_ms"] = round((time.perf_counter() - t_loc) * 1000, 2)

        # 3. Route Query Processing
        if detected_intent == INTENT_ROUTE_QUERY:
            t_route = time.perf_counter()
            response = await cls._handle_route_query(raw_msg, db)
            timing["route_processing_ms"] = round((time.perf_counter() - t_route) * 1000, 2)
            timing["total_response_ms"] = round((time.perf_counter() - t_start) * 1000, 2)
            response.timing_ms = timing
            return response

        # 4. Handle Ambiguous Locality
        if match_type == "ambiguous" and ambiguous_options:
            opts_str = ", ".join(f"'{opt}'" for opt in ambiguous_options)
            timing["total_response_ms"] = round((time.perf_counter() - t_start) * 1000, 2)
            return ChatbotQueryResponse(
                message=f"I found multiple locations that match your query. Which one do you mean? {opts_str}.",
                intent=detected_intent,
                locality=None,
                data={"ambiguous_matches": ambiguous_options},
                timing_ms=timing,
            )

        # 5. Dispatch Intent Handler
        t_data = time.perf_counter()
        if detected_intent == INTENT_NAVIGATION:
            response = cls._handle_navigation(raw_msg)
        elif detected_intent == INTENT_HELP:
            response = cls._handle_help(raw_msg)
        elif detected_intent == INTENT_GREETING:
            response = cls._handle_greeting()
        elif detected_intent == INTENT_REPORT_QUERY:
            response = await cls._handle_report_query(loc_info, raw_msg, db)
        elif detected_intent == INTENT_AREA_QUERY:
            response = await cls._handle_area_query(loc_info, raw_msg, db)
        elif detected_intent == INTENT_WATERLOGGING_QUERY:
            response = await cls._handle_waterlogging_query(loc_info, raw_msg, db)
        else:
            response = cls._handle_unknown(raw_msg)

        timing["data_query_ms"] = round((time.perf_counter() - t_data) * 1000, 2)
        timing["total_response_ms"] = round((time.perf_counter() - t_start) * 1000, 2)
        response.timing_ms = timing
        return response

    @classmethod
    async def _handle_waterlogging_query(
        cls,
        loc: Optional[LocalityInfo],
        raw_msg: str,
        db: AsyncSession,
    ) -> ChatbotQueryResponse:
        """Fetch actual waterlogging predictions for locality without calculating new predictions."""
        if not loc:
            return ChatbotQueryResponse(
                message="I could not identify a specific Kolkata locality in your question. Please specify a ward or neighborhood (e.g. 'Sector V', 'Salt Lake', 'Ward 63', or 'Behala').",
                intent=INTENT_WATERLOGGING_QUERY,
            )

        # Query existing prediction source of truth
        pred_data = await WaterloggingService.get_latest_predictions(db)
        predictions = pred_data.get("predictions", [])

        # Match prediction record
        target_pred = None
        for p in predictions:
            p_loc = str(p.get("locality", "")).strip().lower()
            if (
                p_loc == loc.canonical_name.lower()
                or (loc.ward and str(p.get("ward", "")).strip() == loc.ward)
                or (loc.ulb_name and loc.ulb_name.lower() in p_loc)
            ):
                target_pred = p
                break

        if not target_pred:
            # Fallback to nearest prediction if coordinate matches
            nearest = LocalityExtractor.find_nearest_locality(loc.latitude, loc.longitude)
            if nearest:
                for p in predictions:
                    if str(p.get("locality", "")).strip().lower() == nearest.canonical_name.lower():
                        target_pred = p
                        break

        # Query citizen reports in locality for context
        report_count, active_count, resolved_count, max_depth = await cls._get_locality_report_stats(loc, db)

        if not target_pred:
            return ChatbotQueryResponse(
                message=f"Waterlogging telemetry for {loc.display_name} is currently synchronizing with the municipal command grid.",
                intent=INTENT_WATERLOGGING_QUERY,
                locality=loc.display_name,
            )

        prob = float(target_pred.get("waterlogging_probability", 0.0))
        sev = float(target_pred.get("severity_score", 0.0))
        risk = target_pred.get("risk_level", "LOW")
        rain_24h = target_pred.get("forecast_rain_24h_mm", 0.0)

        prob_pct = f"{round(prob * 100)}%"
        sev_pct = f"{round(sev * 100)}%"

        msg = f"Waterlogging risk in {loc.display_name} is currently {risk} with {prob_pct} probability."

        action = ChatbotAction(
            type="HIGHLIGHT_AREA",
            payload={
                "locality": loc.display_name,
                "canonical_name": loc.canonical_name,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "zoom": 14.5,
                "probability": prob_pct,
                "severity": sev_pct,
                "risk_level": risk,
                "forecast_rain_24h_mm": rain_24h,
                "active_reports": active_count,
                "resolved_reports": resolved_count,
                "total_reports": report_count,
            },
        )

        return ChatbotQueryResponse(
            message=msg,
            intent=INTENT_WATERLOGGING_QUERY,
            locality=loc.display_name,
            data={
                "locality": loc.to_dict(),
                "waterlogging_probability": prob,
                "waterlogging_probability_pct": prob_pct,
                "severity_score": sev,
                "severity_score_pct": sev_pct,
                "risk_level": risk,
                "forecast_rain_24h_mm": rain_24h,
                "active_reports_count": active_count,
                "total_reports_count": report_count,
                "max_recorded_depth_cm": max_depth,
            },
            action=action,
        )

    @classmethod
    async def _handle_report_query(
        cls,
        loc: Optional[LocalityInfo],
        raw_msg: str,
        db: AsyncSession,
    ) -> ChatbotQueryResponse:
        """Query citizen report and complaint data without exposing private citizen information."""
        if not loc:
            # City-wide report summary
            total_stmt = select(func.count(Report.id))
            total = (await db.execute(total_stmt)).scalar() or 0

            return ChatbotQueryResponse(
                message=f"There are currently {total} citizen complaints registered across Kolkata. Ask about a specific locality like Sector V or Salt Lake to view local records.",
                intent=INTENT_REPORT_QUERY,
                data={"total_citywide_reports": total},
            )

        report_count, active_count, resolved_count, max_depth = await cls._get_locality_report_stats(loc, db)

        if report_count == 0:
            msg = f"No citizen complaints are currently recorded for {loc.display_name}."
        else:
            msg = f"Citizen complaint records for {loc.display_name} show {active_count} active and {resolved_count} resolved reports."

        action = ChatbotAction(
            type="HIGHLIGHT_LOCATIONS",
            payload={
                "locality": loc.display_name,
                "canonical_name": loc.canonical_name,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "zoom": 14.5,
                "total_reports": report_count,
                "active_reports": active_count,
                "resolved_reports": resolved_count,
                "max_depth_cm": max_depth,
            },
        )

        return ChatbotQueryResponse(
            message=msg,
            intent=INTENT_REPORT_QUERY,
            locality=loc.display_name,
            data={
                "locality": loc.to_dict(),
                "total_reports": report_count,
                "active_reports": active_count,
                "resolved_reports": resolved_count,
                "max_recorded_depth_cm": max_depth,
            },
            action=action,
        )

    @classmethod
    async def _handle_area_query(
        cls,
        loc: Optional[LocalityInfo],
        raw_msg: str,
        db: AsyncSession,
    ) -> ChatbotQueryResponse:
        """Provide comprehensive area situation and return frontend map highlighting action."""
        if not loc:
            return ChatbotQueryResponse(
                message="Which area or locality would you like to inspect? (e.g. 'Show me the waterlogging condition in Salt Lake' or 'Inspect Sector V').",
                intent=INTENT_AREA_QUERY,
            )

        pred_data = await WaterloggingService.get_latest_predictions(db)
        predictions = pred_data.get("predictions", [])

        target_pred = next(
            (p for p in predictions if p.get("locality", "").lower() == loc.canonical_name.lower()),
            None,
        )
        report_count, active_count, resolved_count, max_depth = await cls._get_locality_report_stats(loc, db)

        prob_pct = f"{round(float(target_pred.get('waterlogging_probability', 0.0)) * 100)}%" if target_pred else "N/A"
        risk_level = target_pred.get("risk_level", "LOW") if target_pred else "MONITORING"
        rain_24h = target_pred.get("forecast_rain_24h_mm", 0.0) if target_pred else 0.0

        msg = f"Live waterlogging overview for {loc.display_name}. Map view has been centered on this area."

        action = ChatbotAction(
            type="HIGHLIGHT_AREA",
            payload={
                "locality": loc.display_name,
                "canonical_name": loc.canonical_name,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "zoom": 14.5,
                "probability": prob_pct,
                "risk_level": risk_level,
                "forecast_rain_24h_mm": rain_24h,
                "active_reports": active_count,
                "resolved_reports": resolved_count,
                "total_reports": report_count,
            },
        )

        return ChatbotQueryResponse(
            message=msg,
            intent=INTENT_AREA_QUERY,
            locality=loc.display_name,
            data={
                "locality": loc.to_dict(),
                "risk_level": risk_level,
                "waterlogging_probability_pct": prob_pct,
                "forecast_rain_24h_mm": rain_24h,
                "active_reports": active_count,
                "resolved_reports": resolved_count,
            },
            action=action,
        )

    @classmethod
    async def _handle_route_query(
        cls,
        raw_msg: str,
        db: AsyncSession,
    ) -> ChatbotQueryResponse:
        """Route-specific corridor waterlogging analysis."""
        orig_text, dest_text = LocalityExtractor.extract_route_endpoints(raw_msg)

        if not orig_text or not dest_text:
            return ChatbotQueryResponse(
                message="To check waterlogging along your route, please provide both an origin and destination (for example: travelling from Dakshin Jagaddal to Sector V).",
                intent=INTENT_ROUTE_QUERY,
            )

        orig_info = RouteEngine.resolve_endpoint(orig_text)
        dest_info = RouteEngine.resolve_endpoint(dest_text)

        if not orig_info:
            return ChatbotQueryResponse(
                message=f"I could not locate your origin: '{orig_text}'. Please try a known neighborhood, ward, or landmark.",
                intent=INTENT_ROUTE_QUERY,
            )
        if not dest_info:
            return ChatbotQueryResponse(
                message=f"I could not locate your destination: '{dest_text}'. Please try a known neighborhood, ward, or landmark.",
                intent=INTENT_ROUTE_QUERY,
            )

        # Retrieve prediction data and citizen reports
        pred_res = await WaterloggingService.get_latest_predictions(db)
        predictions = pred_res.get("predictions", [])
        reports = await ReportService.get_all_reports(db)

        # Execute corridor intersection
        analysis = RouteEngine.analyze_route_waterlogging(
            origin_info=orig_info,
            destination_info=dest_info,
            predictions=predictions,
            reports=reports,
            corridor_radius_km=1.2,
        )

        affected = analysis["affected_locations"]
        total_dist = analysis["total_distance_km"]
        max_risk = analysis["max_risk_level"]
        avg_prob = analysis["average_probability_pct"]

        # Formulate concise human-readable response
        if not affected:
            msg = (
                f"Your route from {orig_info['name']} to {dest_info['name']} spans {total_dist:.1f} km with normal drainage flow along the corridor."
            )
        else:
            msg = (
                f"Route analysis from {orig_info['name']} to {dest_info['name']} covers {total_dist:.1f} km with peak corridor risk at {max_risk} across {len(affected)} monitored sectors."
            )

        # Structured frontend action: ONLY the requested route and relevant affected locations
        action = ChatbotAction(
            type="HIGHLIGHT_ROUTE",
            payload={
                "origin": orig_info,
                "destination": dest_info,
                "total_distance_km": total_dist,
                "route_coordinates": analysis["route_coordinates"],
                "affected_locations": affected,
                "max_risk_level": max_risk,
                "average_probability_pct": avg_prob,
            },
        )

        return ChatbotQueryResponse(
            message=msg,
            intent=INTENT_ROUTE_QUERY,
            locality=f"{orig_info['name']} -> {dest_info['name']}",
            data=analysis,
            action=action,
        )

    @classmethod
    def _handle_navigation(cls, raw_msg: str) -> ChatbotQueryResponse:
        """Map user request to appropriate application page."""
        text = raw_msg.lower()

        if any(w in text for w in ["my report", "my reports", "my complaint", "my complaints", "track report", "track my report", "submitted report", "submitted reports", "past report", "past reports"]):
            path = "/my-reports"
            title = "My Reports"
            msg = "Opening My Reports to track your submitted complaints and verification status."
        elif any(w in text for w in ["complaint", "report", "reporting", "lodge", "file"]):
            path = "/reports"
            title = "Citizen Report Desk"
            msg = "Opening Citizen Report Desk to lodge a waterlogging report."
        elif any(w in text for w in ["map", "live city", "gis", "waterlogging map"]):
            path = "/live-city"
            title = "Live City GIS Map"
            msg = "Opening the Live City GIS Map to view drainage networks and flood hotspots."
        elif any(w in text for w in ["dashboard", "admin dashboard", "command"]):
            path = "/admin-dashboard"
            title = "Administrative Command Center"
            msg = "Opening the Administrative Command Center."
        elif any(w in text for w in ["action center", "respond", "work order"]):
            path = "/action-center"
            title = "Action Center"
            msg = "Navigating to the Action Center for incident response."
        elif any(w in text for w in ["simulate", "simulation", "scenario"]):
            path = "/simulate"
            title = "Hydraulic Scenario Simulation"
            msg = "Opening Hydraulic Scenario Simulation."
        elif any(w in text for w in ["profile", "my profile", "account"]):
            path = "/profile"
            title = "Profile"
            msg = "Opening your Profile."
        elif any(w in text for w in ["notification", "alert", "notifications"]):
            path = "/notifications"
            title = "Notifications & Alerts"
            msg = "Opening Notifications & Alerts."
        else:
            path = "/live-city"
            title = "Live City GIS Map"
            msg = "Opening the Live City GIS Map."

        action = ChatbotAction(
            type="NAVIGATE",
            payload={"path": path, "title": title},
        )

        return ChatbotQueryResponse(
            message=msg,
            intent=INTENT_NAVIGATION,
            data={"target_path": path, "target_title": title},
            action=action,
        )

    @classmethod
    def _handle_help(cls, raw_msg: str) -> ChatbotQueryResponse:
        """Provide concise platform-specific guidance."""
        text = raw_msg.lower()

        if any(w in text for w in ["submit", "complaint", "report", "lodge", "file"]):
            msg = (
                "To report waterlogging, click Report Waterlogging, upload a photo, confirm your location, and specify the water depth. The municipal response team will be alerted automatically."
            )
            action = ChatbotAction(type="NAVIGATE", payload={"path": "/report", "title": "Report Waterlogging"})
            return ChatbotQueryResponse(message=msg, intent=INTENT_HELP, action=action)

        msg = (
            "I am Ask Kolkata, your municipal water drainage assistant. "
            "You can ask about waterlogging risk in any area, check citizen complaints, analyze travel routes, or navigate to key services."
        )
        return ChatbotQueryResponse(message=msg, intent=INTENT_HELP)

    @classmethod
    def _handle_greeting(cls) -> ChatbotQueryResponse:
        return ChatbotQueryResponse(
            message="Hello! I am Ask Kolkata, your Smart Drainage & Water Intelligence assistant. How can I help you today?",
            intent=INTENT_GREETING,
        )

    @classmethod
    def _handle_unknown(cls, raw_msg: str) -> ChatbotQueryResponse:
        return ChatbotQueryResponse(
            message=(
                "I specialize in Kolkata municipal water drainage intelligence. "
                "You can ask for waterlogging risks in an area, check citizen complaints, or analyze safe travel routes."
            ),
            intent=INTENT_UNKNOWN,
        )

    @classmethod
    async def _get_locality_report_stats(
        cls,
        loc: LocalityInfo,
        db: AsyncSession,
    ) -> Tuple[int, int, int, float]:
        """Return (total_count, active_count, resolved_count, max_depth) for a locality."""
        # 1. Query reports table
        # Match by location string, ward, or assigned_ulb_name
        loc_str = loc.canonical_name.lower()
        disp_str = loc.display_name.lower()

        conditions = [
            func.lower(Report.location).like(f"%{loc_str}%"),
            func.lower(Report.assigned_ulb_name).like(f"%{loc_str}%"),
        ]
        if loc.ward:
            conditions.append(Report.ward == loc.ward)

        for alias in loc.aliases:
            conditions.append(func.lower(Report.location).like(f"%{alias.lower()}%"))

        stmt = select(Report).where(or_(*conditions))
        res = await db.execute(stmt)
        reports = res.scalars().all()

        total = len(reports)
        active = sum(1 for r in reports if str(r.status).lower() not in ["resolved", "closed"])
        resolved = total - active
        max_depth = max([float(r.water_depth or 0.0) for r in reports], default=0.0)

        # 2. Check historical_place for any resolved entries
        hp_stmt = select(HistoricalPlace).where(
            or_(
                func.lower(HistoricalPlace.location).like(f"%{loc_str}%"),
                func.lower(HistoricalPlace.assigned_ulb_name).like(f"%{loc_str}%"),
            )
        )
        hp_res = await db.execute(hp_stmt)
        hp_records = hp_res.scalars().all()
        if hp_records:
            resolved += len(hp_records)
            total += len(hp_records)
            hp_max = max([float(h.water_depth or 0.0) for h in hp_records], default=0.0)
            max_depth = max(max_depth, hp_max)

        return total, active, resolved, max_depth
