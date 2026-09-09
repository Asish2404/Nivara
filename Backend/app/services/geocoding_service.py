import logging
from typing import Optional, Dict, Any
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderServiceError, GeocoderTimedOut

logger = logging.getLogger(__name__)


class GeocodingService:
    """Service for forward geocoding manual addresses to latitude/longitude coordinates."""

    _geolocator = Nominatim(
        user_agent="smart_drainage_intelligence_wb",
        timeout=8
    )

    @classmethod
    def forward_geocode(cls, address: str) -> Optional[Dict[str, Any]]:
        """Convert a street or locality address into GPS coordinates.

        Returns:
            dict with 'latitude', 'longitude', and 'formatted_address', or None if not found/failed.
        """
        if not address or not address.strip():
            return None

        clean_address = address.strip()

        # Attempt 1: Direct query
        try:
            location = cls._geolocator.geocode(clean_address)
            if location:
                return {
                    "latitude": float(location.latitude),
                    "longitude": float(location.longitude),
                    "formatted_address": location.address,
                }
        except (GeocoderServiceError, GeocoderTimedOut, Exception) as err:
            logger.warning(f"Geocoding error for '{clean_address}': {err}")

        # Attempt 2: Regional context fallback if West Bengal / India not in address
        address_lower = clean_address.lower()
        if "west bengal" not in address_lower and "kolkata" not in address_lower:
            fallback_query = f"{clean_address}, West Bengal, India"
            try:
                location = cls._geolocator.geocode(fallback_query)
                if location:
                    return {
                        "latitude": float(location.latitude),
                        "longitude": float(location.longitude),
                        "formatted_address": location.address,
                    }
            except (GeocoderServiceError, GeocoderTimedOut, Exception) as err:
                logger.warning(f"Fallback geocoding error for '{fallback_query}': {err}")

        return None
