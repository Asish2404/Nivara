import os
import logging
from typing import Dict, Any, Optional
import geopandas as gpd
from shapely.geometry import Point

logger = logging.getLogger(__name__)

# Known municipal corporations in West Bengal
MUNICIPAL_CORPORATIONS = {
    "kolkata",
    "kmc",
    "bidhannagar",
    "howrah",
    "asansol",
    "durgapur",
    "siliguri",
    "chandannagar",
    "chandananagar",
}


class JurisdictionService:
    """Service for Point-in-Polygon spatial jurisdiction detection across

    West Bengal Municipalities, Corporations, and Development Authorities.
    """

    _initialized: bool = False
    _kmc_gdf: Optional[gpd.GeoDataFrame] = None
    _ulb_gdf: Optional[gpd.GeoDataFrame] = None

    @classmethod
    def _load_boundaries(cls) -> None:
        """Load and cache boundary datasets once in memory normalized to EPSG:4326."""
        if cls._initialized:
            return

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        kmc_path = os.path.join(base_dir, "data", "boundaries", "kolkata.geojson")
        ulb_path = os.path.join(base_dir, "data", "boundaries", "WB_AMRUT_ULBs.geojsonl")

        # 1. Load Kolkata Municipal Corporation boundary (141 wards)
        if os.path.exists(kmc_path):
            logger.info(f"Loading KMC boundaries from {kmc_path}...")
            gdf = gpd.read_file(kmc_path)
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            else:
                gdf = gdf.to_crs("EPSG:4326")
            cls._kmc_gdf = gdf
        else:
            logger.error(f"KMC boundary file not found at {kmc_path}")
            cls._kmc_gdf = gpd.GeoDataFrame(crs="EPSG:4326")

        # 2. Load WB AMRUT ULBs boundary dataset (57 ULBs)
        if os.path.exists(ulb_path):
            logger.info(f"Loading AMRUT ULB boundaries from {ulb_path}...")
            gdf = gpd.read_file(ulb_path)
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            else:
                gdf = gdf.to_crs("EPSG:4326")
            cls._ulb_gdf = gdf
        else:
            logger.error(f"AMRUT ULB boundary file not found at {ulb_path}")
            cls._ulb_gdf = gpd.GeoDataFrame(crs="EPSG:4326")

        cls._initialized = True
        logger.info("Boundary datasets loaded and indexed successfully.")

    @classmethod
    def _determine_jurisdiction_type(cls, ulb_name: str) -> str:
        """Determine whether the ULB is a Municipal Corporation, Township Authority, or Municipality."""
        name_lower = ulb_name.strip().lower()
        if name_lower in MUNICIPAL_CORPORATIONS:
            return "Municipal Corporation"
        if "authority" in name_lower or "township" in name_lower:
            return "Township Authority"
        if "corporation" in name_lower:
            return "Municipal Corporation"
        return "Municipality"

    @classmethod
    def validate_coordinates(cls, latitude: float, longitude: float) -> None:
        """Ensure coordinates fall within valid geographic bounds."""
        if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
            raise ValueError("Coordinates must be numeric floating point numbers.")
        if not (-90.0 <= latitude <= 90.0):
            raise ValueError(f"Invalid latitude {latitude}. Must be between -90.0 and 90.0.")
        if not (-180.0 <= longitude <= 180.0):
            raise ValueError(f"Invalid longitude {longitude}. Must be between -180.0 and 180.0.")
        if latitude == 0.0 and longitude == 0.0:
            raise ValueError("Null island coordinates (0.0, 0.0) are not valid location points.")

    @classmethod
    def find_jurisdiction(cls, latitude: float, longitude: float) -> Dict[str, Any]:
        """Perform Point-in-Polygon spatial query to identify the municipal jurisdiction.

        Returns:
            dict with:
                found: bool
                ulb_id: str (if found)
                ulb_name: str (if found)
                jurisdiction_type: str (if found)
                ward: str (optional, e.g. KMC ward number)
        """
        cls.validate_coordinates(latitude, longitude)
        cls._load_boundaries()

        point_geom = Point(float(longitude), float(latitude))
        point_gdf = gpd.GeoDataFrame(geometry=[point_geom], crs="EPSG:4326")

        # 1. Check Kolkata Municipal Corporation boundary first
        if cls._kmc_gdf is not None and not cls._kmc_gdf.empty:
            kmc_matches = gpd.sjoin(point_gdf, cls._kmc_gdf, how="inner", predicate="intersects")
            if not kmc_matches.empty:
                row = kmc_matches.iloc[0]
                ward_num = str(row.get("WARD", "")).strip()
                return {
                    "found": True,
                    "ulb_id": "KMC",
                    "ulb_name": "Kolkata Municipal Corporation",
                    "jurisdiction_type": "Municipal Corporation",
                    "ward": ward_num,
                }

        # 2. Check WB AMRUT ULBs boundary dataset
        if cls._ulb_gdf is not None and not cls._ulb_gdf.empty:
            ulb_matches = gpd.sjoin(point_gdf, cls._ulb_gdf, how="inner", predicate="intersects")
            if not ulb_matches.empty:
                row = ulb_matches.iloc[0]
                raw_name = str(row.get("Name", "")).strip()
                ulb_code = str(row.get("ULB_Code") or row.get("MUN_ID") or row.get("id", "")).strip()
                j_type = cls._determine_jurisdiction_type(raw_name)

                return {
                    "found": True,
                    "ulb_id": ulb_code,
                    "ulb_name": raw_name,
                    "jurisdiction_type": j_type,
                    "ward": "",
                }

        return {
            "found": False
        }
