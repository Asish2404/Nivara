import secrets
import time
from typing import Optional, Dict, Any


class OtpService:
    """
    In-memory OTP store for administrative 2FA authentication.
    Supports OTP generation, dispatch simulation, expiry tracking, and validation.
    """
    # Key: "{email}:{purpose}" -> { "otp": str, "expires_at": float, "verified": bool }
    _store: Dict[str, Dict[str, Any]] = {}

    DEFAULT_EXPIRY_SECONDS = 300  # 5 minutes

    @classmethod
    def _make_key(cls, email: str, purpose: str = "login") -> str:
        return f"{email.strip().lower()}:{purpose.strip().lower()}"

    @classmethod
    def generate_otp(
        cls, email: str, purpose: str = "login", phone: Optional[str] = None
    ) -> str:
        """Generate a cryptographically secure 6-digit OTP code and store it with TTL."""
        # 6-digit numeric OTP: 100000 - 999999
        otp = f"{secrets.randbelow(900000) + 100000}"
        expires_at = time.time() + cls.DEFAULT_EXPIRY_SECONDS

        key = cls._make_key(email, purpose)
        cls._store[key] = {
            "otp": otp,
            "expires_at": expires_at,
            "verified": False,
            "phone": phone,
        }
        return otp

    @classmethod
    def verify_otp(cls, email: str, otp: str, purpose: str = "login") -> bool:
        """Verify the OTP against the stored code."""
        key = cls._make_key(email, purpose)
        entry = cls._store.get(key)
        if not entry:
            return False

        if time.time() > entry["expires_at"]:
            cls._store.pop(key, None)
            return False

        if entry["otp"] == otp.strip():
            entry["verified"] = True
            return True

        return False

    @classmethod
    def is_verified(cls, email: str, purpose: str = "login", consume: bool = True) -> bool:
        """Check if an OTP was previously verified for this session/email."""
        key = cls._make_key(email, purpose)
        entry = cls._store.get(key)
        if not entry:
            return False

        if time.time() > entry["expires_at"]:
            cls._store.pop(key, None)
            return False

        if entry.get("verified", False):
            if consume:
                cls._store.pop(key, None)
            return True

        return False

    @classmethod
    def consume_otp(cls, email: str, otp: str, purpose: str = "login") -> bool:
        """Directly verify and consume the OTP in one atomic step."""
        key = cls._make_key(email, purpose)
        entry = cls._store.get(key)
        if not entry:
            return False

        if time.time() > entry["expires_at"]:
            cls._store.pop(key, None)
            return False

        if entry["otp"] == otp.strip():
            cls._store.pop(key, None)
            return True

        return False
