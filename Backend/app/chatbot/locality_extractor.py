"""Locality and entity extraction engine for Ask Kolkata.

Deterministic multi-stage matcher:
1. Exact match against canonical database localities (141 KMC Wards + 25 ULBs)
2. Ward number pattern extraction ("ward 63", "ward #93")
3. Curated alias dictionary for Kolkata metropolitan landmarks & neighborhoods
4. Normalized substring and partial match
5. Safe fuzzy / token overlap match
6. Disambiguation handler for ambiguous references
7. Spatial geocoding fallback for uncataloged addresses/landmarks
"""

import os
import re
import math
from typing import Dict, List, Optional, Tuple, Any
import pandas as pd

from app.services.geocoding_service import GeocodingService


class LocalityInfo:
    def __init__(
        self,
        canonical_name: str,
        display_name: str,
        latitude: float,
        longitude: float,
        ward: str = "",
        ulb_name: str = "",
        district: str = "",
        aliases: Optional[List[str]] = None,
    ):
        self.canonical_name = canonical_name
        self.display_name = display_name
        self.latitude = latitude
        self.longitude = longitude
        self.ward = ward
        self.ulb_name = ulb_name
        self.district = district
        self.aliases = aliases or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "canonical_name": self.canonical_name,
            "display_name": self.display_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "ward": self.ward,
            "ulb_name": self.ulb_name,
            "district": self.district,
        }


class LocalityExtractor:
    """Multi-stage locality extraction and normalization engine."""

    _initialized: bool = False
    _localities_by_canonical: Dict[str, LocalityInfo] = {}
    _alias_to_canonical: Dict[str, str] = {}
    _ward_to_canonical: Dict[str, str] = {}
    _canonical_list: List[LocalityInfo] = []

    @classmethod
    def initialize(cls) -> None:
        """Load canonical dataset and build high-speed lookup indices."""
        if cls._initialized:
            return

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        csv_path = os.path.join(base_dir, "data", "waterlogging", "localities.csv")

        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            for _, row in df.iterrows():
                loc_name = str(row.get("locality", "")).strip()
                if not loc_name:
                    continue
                lat = float(pd.to_numeric(row.get("lat"), errors="coerce") or 22.57)
                lon = float(pd.to_numeric(row.get("lon"), errors="coerce") or 88.36)
                ward = str(row.get("ward", "") or "").replace(".0", "").strip()
                if ward == "nan":
                    ward = ""
                ulb = str(row.get("ulb_name", "") or "").strip()
                if ulb == "nan":
                    ulb = ""
                dist = str(row.get("district", "") or "").strip()
                if dist == "nan":
                    dist = ""

                info = LocalityInfo(
                    canonical_name=loc_name,
                    display_name=loc_name,
                    latitude=lat,
                    longitude=lon,
                    ward=ward,
                    ulb_name=ulb,
                    district=dist,
                )
                cls._localities_by_canonical[loc_name.lower()] = info
                cls._canonical_list.append(info)

                if ward:
                    cls._ward_to_canonical[ward] = loc_name
                    cls._ward_to_canonical[f"ward {ward}"] = loc_name
                    cls._ward_to_canonical[f"ward {int(ward):02d}"] = loc_name if ward.isdigit() else loc_name

        # Populate Curated Kolkata Aliases & Landmarks
        cls._build_curated_aliases()
        cls._initialized = True

    @classmethod
    def _build_curated_aliases(cls) -> None:
        """Map popular Kolkata neighborhoods and landmarks to canonical localities."""
        alias_definitions = [
            # Sector V / Salt Lake Sector V -> NDITA
            (
                "Nabadiganta Industrial Township Authority",
                "Salt Lake Sector V",
                [
                    "sector v",
                    "sector 5",
                    "salt lake sector v",
                    "salt lake sector 5",
                    "saltlake sector v",
                    "saltlake sector 5",
                    "sector five",
                    "nabadiganta",
                    "ndita",
                    "college more",
                    "webel bhavan",
                    "karunamoyee bus terminus",
                    "godrej waterside",
                    "rdb cinema",
                    "ecospace",
                    "wipro circle",
                    "technopolis",
                ],
            ),
            # Salt Lake / Bidhannagar
            (
                "Bidhannagar",
                "Salt Lake / Bidhannagar",
                [
                    "salt lake",
                    "saltlake",
                    "bidhannagar",
                    "city centre 1",
                    "cc1",
                    "central park",
                    "karunamoyee",
                    "salt lake stadium",
                    "yuva bharati",
                    "saltlake city",
                    "bidhannagar municipal corporation",
                ],
            ),
            # Rajpur-Sonarpur & Dakshin Jagaddal
            (
                "Rajpur-Sonarpur",
                "Dakshin Jagaddal / Rajpur-Sonarpur",
                [
                    "dakshin jagaddal",
                    "jagaddal",
                    "sonarpur",
                    "rajpur",
                    "rajpur sonarpur",
                    "rajpur-sonarpur",
                    "narendrapur",
                    "kamalgazi",
                    "kavi nazrul",
                    "subhasgram",
                    "mahamayatala",
                    "garia station",
                ],
            ),
            # New Town
            (
                "New Town",
                "New Town, Rajarhat",
                [
                    "new town",
                    "newtown",
                    "rajarhat",
                    "action area 1",
                    "action area 2",
                    "action area 3",
                    "action area i",
                    "action area ii",
                    "action area iii",
                    "biswa bangla gate",
                    "chinar park",
                    "ecopark",
                    "eco park",
                ],
            ),
            # Ward 108 (EM Bypass / Ruby / Anandapur)
            (
                "Kolkata Ward 108",
                "Ruby / EM Bypass (Ward 108)",
                [
                    "ruby",
                    "ruby hospital",
                    "ruby more",
                    "ruby rotary",
                    "anandapur",
                    "em bypass ruby",
                    "madurdaha",
                    "nonadanga",
                ],
            ),
            # Ward 63 (Park Street / Camac Street)
            (
                "Kolkata Ward 63",
                "Park Street / Camac Street (Ward 63)",
                [
                    "park street",
                    "camac street",
                    "the maidan",
                    "maidan",
                    "russell street",
                    "park street area",
                ],
            ),
            # Ward 45 / 46 (Esplanade / BBD Bagh / Dalhousie)
            (
                "Kolkata Ward 45",
                "Esplanade / BBD Bagh (Ward 45)",
                [
                    "esplanade",
                    "bbd bagh",
                    "b.b.d. bagh",
                    "dalhousie",
                    "dharmatala",
                    "chandni chowk",
                    "curzon park",
                ],
            ),
            # Ward 28 / 16 (Maniktala)
            (
                "Kolkata Ward 28",
                "Maniktala (Ward 28)",
                [
                    "maniktala",
                    "maniktala more",
                    "maniktalla",
                    "maniktala crossing",
                ],
            ),
            # Ward 30 / 14 (Bagmari)
            (
                "Kolkata Ward 30",
                "Bagmari Road / Maniktala (Ward 30)",
                [
                    "bagmari",
                    "bagmari road",
                    "kankurgachi",
                    "phoolbagan",
                ],
            ),
            # Ward 44 (College Street)
            (
                "Kolkata Ward 44",
                "College Street / Bowbazar (Ward 44)",
                [
                    "college street",
                    "calcutta university",
                    "presidency",
                    "bowbazar",
                    "bow bazar",
                ],
            ),
            # Ward 38 (Thanthania)
            (
                "Kolkata Ward 38",
                "Thanthania / College Street (Ward 38)",
                [
                    "thanthania",
                    "thanthania kalibari",
                    "amherst street",
                ],
            ),
            # Ward 68 / 85 (Ballygunge / Gariahat)
            (
                "Kolkata Ward 68",
                "Ballygunge (Ward 68)",
                [
                    "ballygunge",
                    "ballygunge phari",
                    "ballygunge circular road",
                ],
            ),
            (
                "Kolkata Ward 85",
                "Gariahat (Ward 85)",
                [
                    "gariahat",
                    "gariahat more",
                    "gariahat crossing",
                    "golpark",
                ],
            ),
            # Ward 96 / 102 (Jadavpur / Sukanta Setu)
            (
                "Kolkata Ward 96",
                "Jadavpur (Ward 96)",
                [
                    "jadavpur",
                    "jadavpur 8b",
                    "jadavpur university",
                    "sukanta setu",
                ],
            ),
            # Ward 89 / 97 (Tollygunge)
            (
                "Kolkata Ward 89",
                "Tollygunge (Ward 89)",
                [
                    "tollygunge",
                    "tollygunge phari",
                    "mahanayak uttam kumar",
                    "charu market",
                    "ranikuthi",
                ],
            ),
            # Ward 120 / 121 / 130 (Behala)
            (
                "Kolkata Ward 120",
                "Behala (Ward 120)",
                [
                    "behala",
                    "behala chowrasta",
                    "behala tram depot",
                    "taratala",
                    "taratola",
                    "diamond harbour road",
                ],
            ),
            # Ward 74 (Alipore)
            (
                "Kolkata Ward 74",
                "Alipore (Ward 74)",
                [
                    "alipore",
                    "alipore zoo",
                    "national library",
                ],
            ),
            # Dum Dum
            (
                "Dum Dum",
                "Dum Dum",
                [
                    "dum dum",
                    "dumdum",
                    "dum dum station",
                    "dum dum junction",
                ],
            ),
            # South Dum Dum
            (
                "South Dum Dum",
                "South Dum Dum / Lake Town",
                [
                    "south dum dum",
                    "lake town",
                    "laketown",
                    "bangur",
                    "bangur avenue",
                    "kalindi",
                ],
            ),
            # North Dum Dum
            (
                "North Dum Dum",
                "North Dum Dum / Birati",
                [
                    "north dum dum",
                    "birati",
                    "durganagar",
                ],
            ),
            # Howrah
            (
                "Howrah",
                "Howrah",
                [
                    "howrah",
                    "howrah station",
                    "howrah bridge",
                    "salkia",
                    "shibpur",
                ],
            ),
        ]

        for canon, display, aliases in alias_definitions:
            canon_lower = canon.lower()
            if canon_lower in cls._localities_by_canonical:
                cls._localities_by_canonical[canon_lower].display_name = display
                cls._localities_by_canonical[canon_lower].aliases.extend(aliases)
            for alias in aliases:
                cls._alias_to_canonical[alias.lower()] = canon

    @staticmethod
    def _normalize(text: str) -> str:
        t = re.sub(r"[^\w\s]", " ", text.lower())
        return " ".join(t.split())

    @classmethod
    def extract_locality(cls, query_text: str) -> Tuple[Optional[LocalityInfo], str, List[str]]:
        """Extract primary locality from user query.

        Returns:
            (LocalityInfo or None, match_type, list_of_ambiguous_matches)
        """
        cls.initialize()
        text = query_text.strip()
        norm_text = cls._normalize(text)
        if not norm_text:
            return None, "empty", []

        # Step 1: Explicit Ward Pattern Match ("ward 63", "ward no 93", "ward #108")
        ward_match = re.search(r"\bward\s*(?:no\.?|number|#)?\s*(\d{1,3})\b", norm_text)
        if ward_match:
            ward_num = str(int(ward_match.group(1)))
            canon = cls._ward_to_canonical.get(ward_num) or cls._ward_to_canonical.get(f"ward {ward_num}")
            if canon and canon.lower() in cls._localities_by_canonical:
                return cls._localities_by_canonical[canon.lower()], "ward_match", []

        # Step 2: Curated Aliases (longest match first to prioritize "salt lake sector v" over "salt lake")
        sorted_aliases = sorted(cls._alias_to_canonical.keys(), key=len, reverse=True)
        for alias in sorted_aliases:
            # Word boundary regex for alias
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, norm_text):
                canon = cls._alias_to_canonical[alias]
                if canon.lower() in cls._localities_by_canonical:
                    return cls._localities_by_canonical[canon.lower()], "alias_match", []

        # Step 3: Exact / Substring match against canonical localities (longest first)
        sorted_canon = sorted(cls._canonical_list, key=lambda x: len(x.canonical_name), reverse=True)
        for loc in sorted_canon:
            loc_norm = cls._normalize(loc.canonical_name)
            pattern = r"\b" + re.escape(loc_norm) + r"\b"
            if re.search(pattern, norm_text):
                return loc, "exact_canonical", []

        # Step 4: Disambiguation Check for generic words ("sector", "ward", "lake")
        if re.search(r"\bsector\b", norm_text) and not re.search(r"\bsector\s*(?:v|5|1|2|3|4)\b", norm_text):
            return None, "ambiguous", ["Sector V (IT Hub)", "Sector 1 (Salt Lake)", "Sector 2 (Salt Lake)", "Sector 3 (Salt Lake)"]
        if norm_text.strip() in ["ward", "kolkata ward", "in ward"]:
            return None, "ambiguous", ["Ward 63 (Park St)", "Ward 93 (Garia)", "Ward 108 (Ruby)", "Ward 28 (Maniktala)"]

        # Step 5: Partial token matching
        tokens = [w for w in norm_text.split() if len(w) > 3 and w not in ["what", "waterlogging", "probability", "severity", "condition", "complaint", "complaints", "report", "reports", "many", "there", "show"]]
        candidates = []
        for loc in cls._canonical_list:
            loc_norm = cls._normalize(loc.canonical_name)
            for tok in tokens:
                if tok in loc_norm:
                    candidates.append(loc)
                    break

        if len(candidates) == 1:
            return candidates[0], "partial_match", []
        elif len(candidates) > 1 and len(candidates) <= 4:
            return None, "ambiguous", [c.display_name for c in candidates]

        # Step 6: Safe Geocoding Fallback for specific addresses / uncataloged landmarks
        # Only geocode if the query contains a substantive place name
        candidate_places = cls._extract_candidate_phrases(norm_text)
        for phrase in candidate_places:
            geocoded = GeocodingService.forward_geocode(phrase)
            if geocoded:
                lat = geocoded["latitude"]
                lon = geocoded["longitude"]
                nearest = cls.find_nearest_locality(lat, lon)
                if nearest:
                    return nearest, "geocoded_nearest", []

        return None, "not_found", []

    @staticmethod
    def _extract_candidate_phrases(norm_text: str) -> List[str]:
        """Isolate potential location phrases from natural language noise."""
        phrases = []
        # Remove common query prefixes
        cleaned = re.sub(
            r"\b(?:what is the|what's the|how is the|waterlogging in|probability in|condition in|complaints in|reports in|show me|tell me about|how many complaints in|how many reports in)\b",
            "",
            norm_text,
        ).strip()
        if cleaned and len(cleaned) >= 3:
            phrases.append(cleaned)
        return phrases

    @classmethod
    def find_nearest_locality(cls, lat: float, lon: float, max_dist_km: float = 8.0) -> Optional[LocalityInfo]:
        """Find the closest canonical locality in our dataset to given coordinates."""
        cls.initialize()
        best_loc = None
        best_dist = float("inf")

        for loc in cls._canonical_list:
            d = cls.haversine_distance(lat, lon, loc.latitude, loc.longitude)
            if d < best_dist:
                best_dist = d
                best_loc = loc

        if best_loc and best_dist <= max_dist_km:
            return best_loc
        return best_loc

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine distance between two coordinates in kilometers."""
        R = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @classmethod
    def extract_route_endpoints(cls, query_text: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract origin and destination strings from a journey query.

        Examples:
        - "travelling from Dakshin Jagaddal to Sector V" -> ("Dakshin Jagaddal", "Sector V")
        - "from Sonarpur to Salt Lake" -> ("Sonarpur", "Salt Lake")
        - "between Behala and Park Street" -> ("Behala", "Park Street")
        """
        text = query_text.strip()

        # Pattern 1: travelling/going/driving from X to Y
        m = re.search(r"\b(?:travell?ing|going|driving|commuting|walking|journey|route|trip|heading)\s+from\s+(.+?)\s+to\s+(.+?)(?:\.|\?|$|\s+what|\s+show|\s+will|\s+facing)", text, re.IGNORECASE)
        if m:
            return m.group(1).strip(), m.group(2).strip()

        # Pattern 2: from X to Y
        m = re.search(r"\bfrom\s+(.+?)\s+to\s+(.+?)(?:\.|\?|$|\s+what|\s+show|\s+will|\s+facing|\s+which)", text, re.IGNORECASE)
        if m:
            return m.group(1).strip(), m.group(2).strip()

        # Pattern 3: between X and Y
        m = re.search(r"\bbetween\s+(.+?)\s+and\s+(.+?)(?:\.|\?|$|\s+what|\s+show|\s+will)", text, re.IGNORECASE)
        if m:
            return m.group(1).strip(), m.group(2).strip()

        # Pattern 4: route X to Y
        m = re.search(r"\broute\s+(?:from\s+)?(.+?)\s+to\s+(.+?)(?:\.|\?|$)", text, re.IGNORECASE)
        if m:
            return m.group(1).strip(), m.group(2).strip()

        return None, None
