import os
import secrets
import time
import re
import logging
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
import httpx

from app.core.config import settings

logger = logging.getLogger("kmc.otp")


def normalize_phone(phone: Optional[str]) -> str:
    if not phone:
        return ""
    digits = re.sub(r"[^\d]", "", str(phone))
    if len(digits) == 10:
        return f"91{digits}"
    return digits


def normalize_purpose(purpose: str) -> str:
    p = (purpose or "login").strip().lower()
    if p in ["signup", "create", "register"]:
        return "signup"
    return "login"


class OtpService:
    """
    Robust in-memory OTP store for administrative 2FA authentication.
    Indexes OTPs by phone number and email with canonical purpose normalization.
    """
    _store: Dict[str, Dict[str, Any]] = {}

    DEFAULT_EXPIRY_SECONDS = 300  # 5 minutes

    @classmethod
    def generate_otp(
        cls, email: Optional[str] = None, phone: Optional[str] = None, purpose: str = "login"
    ) -> str:
        """Generate a cryptographically secure 6-digit OTP code and store it with TTL."""
        canon_purpose = normalize_purpose(purpose)
        otp = f"{secrets.randbelow(900000) + 100000}"
        expires_at = time.time() + cls.DEFAULT_EXPIRY_SECONDS

        clean_email = (email or "").strip().lower()
        norm_phone = normalize_phone(phone)

        entry = {
            "otp": otp,
            "expires_at": expires_at,
            "verified": False,
            "email": clean_email,
            "phone": norm_phone,
            "purpose": canon_purpose,
        }

        # Store under both email and phone indexes
        if clean_email:
            cls._store[f"email:{clean_email}:{canon_purpose}"] = entry
        if norm_phone:
            cls._store[f"phone:{norm_phone}:{canon_purpose}"] = entry

        # Prominently log to terminal for local developer testing
        target_display = phone or email or "officer"
        print(f"\n=====================================================================================", flush=True)
        print(f" [AUTH 2FA SYSTEM] Generated Security OTP for: {target_display}", flush=True)
        print(f" OTP CODE: {otp} (Valid for 5 minutes)", flush=True)
        print(f" Purpose: {canon_purpose}", flush=True)
        print(f" Note: Sent to recipient's email via Gmail SMTP. Check Inbox & Spam/Junk folder.", flush=True)
        print(f"=====================================================================================\n", flush=True)

        return otp

    @classmethod
    async def dispatch_real_sms(cls, phone: Optional[str], otp: str) -> bool:
        """
        Dispatches a real SMS to the target phone number using Fast2SMS (Indian Gateway) or Twilio.
        If no API key is configured, prints an instruction banner to the server console.
        """
        if not phone:
            return False

        digits = re.sub(r"[^\d]", "", str(phone))
        phone_10 = digits[-10:] if len(digits) >= 10 else digits
        phone_e164 = f"+91{phone_10}" if len(digits) == 10 else f"+{digits}"

        # 1. Check Fast2SMS API Key
        fast2sms_key = getattr(settings, "FAST2SMS_API_KEY", "") or os.getenv("FAST2SMS_API_KEY", "")
        if fast2sms_key:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://www.fast2sms.com/dev/bulkV2",
                        headers={"authorization": fast2sms_key},
                        data={
                            "variables_values": otp,
                            "route": "otp",
                            "numbers": phone_10,
                        },
                    )
                    data = resp.json() if resp.status_code == 200 else {}
                    success = resp.status_code == 200 and data.get("return") is True
                    print(
                        f"\n>>> [FAST2SMS DISPATCH] Sent to {phone_10} | Success: {success} | Response: {resp.text}\n",
                        flush=True,
                    )
                    return success
            except Exception as e:
                logger.error(f"Fast2SMS dispatch failure: {e}")
                print(f" [FAST2SMS ERROR] {e}", flush=True)

        # 2. Check Twilio API Configuration
        twilio_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "") or os.getenv("TWILIO_ACCOUNT_SID", "")
        twilio_token = getattr(settings, "TWILIO_AUTH_TOKEN", "") or os.getenv("TWILIO_AUTH_TOKEN", "")
        twilio_from = getattr(settings, "TWILIO_PHONE_NUMBER", "") or os.getenv("TWILIO_PHONE_NUMBER", "")
        if twilio_sid and twilio_token and twilio_from:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json",
                        auth=(twilio_sid, twilio_token),
                        data={
                            "To": phone_e164,
                            "From": twilio_from,
                            "Body": f"Your Kolkata Municipal Corporation (KMC) Admin 2FA Code is: {otp}. Valid for 5 minutes.",
                        },
                    )
                    success = resp.status_code in [200, 201]
                    print(
                        f"\n>>> [TWILIO DISPATCH] Sent to {phone_e164} | Success: {success} | Response: {resp.text}\n",
                        flush=True,
                    )
                    return success
            except Exception as e:
                logger.error(f"Twilio dispatch failure: {e}")
                print(f" [TWILIO ERROR] {e}", flush=True)

        print(
            f" [SMS GATEWAY] No active SMS API key in .env. Dispatched locally. "
            f"Set FAST2SMS_API_KEY or TWILIO credentials in Backend/.env to send real SMS to {phone}.",
            flush=True,
        )
        return False

    @classmethod
    async def dispatch_email_otp(
        cls,
        to_email: Optional[str],
        otp: str,
        purpose: str = "login",
        user_name: Optional[str] = None,
    ) -> bool:
        """
        Dispatches official HTML 2FA email using Gmail SMTP via centralized EmailService.
        """
        if not to_email or "@" not in to_email:
            return False

        from app.services.email_service import EmailService
        return await EmailService.send_signup_otp_email(
            to_email=to_email,
            otp=otp,
            user_name=user_name,
            purpose=purpose,
        )

    @classmethod
    def verify_otp(
        cls, otp: str, email: Optional[str] = None, phone: Optional[str] = None, purpose: str = "login"
    ) -> bool:
        """Verify the OTP against the stored code using phone or email."""
        canon_purpose = normalize_purpose(purpose)
        clean_otp = (otp or "").strip()
        if not clean_otp:
            return False

        entry = None
        norm_phone = normalize_phone(phone)
        if norm_phone:
            entry = cls._store.get(f"phone:{norm_phone}:{canon_purpose}")
        if not entry and email:
            clean_email = email.strip().lower()
            entry = cls._store.get(f"email:{clean_email}:{canon_purpose}")

        if not entry:
            return False

        if time.time() > entry["expires_at"]:
            return False

        if entry["otp"] == clean_otp:
            entry["verified"] = True
            return True

        return False

    @classmethod
    def is_verified(
        cls, email: Optional[str] = None, phone: Optional[str] = None, purpose: str = "login"
    ) -> bool:
        """Check if an OTP was previously verified for this phone or email session."""
        canon_purpose = normalize_purpose(purpose)
        entry = None
        norm_phone = normalize_phone(phone)
        if norm_phone:
            entry = cls._store.get(f"phone:{norm_phone}:{canon_purpose}")
        if not entry and email:
            clean_email = email.strip().lower()
            entry = cls._store.get(f"email:{clean_email}:{canon_purpose}")

        if not entry:
            return False

        if time.time() > entry["expires_at"]:
            return False

        return bool(entry.get("verified", False))

    @classmethod
    def consume_otp(
        cls, otp: Optional[str] = None, email: Optional[str] = None, phone: Optional[str] = None, purpose: str = "login"
    ) -> bool:
        """Verify or confirm previous verification, then consume OTP."""
        canon_purpose = normalize_purpose(purpose)
        clean_otp = (otp or "").strip() if otp else None

        entry = None
        phone_key = None
        email_key = None

        norm_phone = normalize_phone(phone)
        if norm_phone:
            phone_key = f"phone:{norm_phone}:{canon_purpose}"
            entry = cls._store.get(phone_key)
        if not entry and email:
            clean_email = email.strip().lower()
            email_key = f"email:{clean_email}:{canon_purpose}"
            entry = cls._store.get(email_key)

        if not entry:
            return False

        if time.time() > entry["expires_at"]:
            if phone_key: cls._store.pop(phone_key, None)
            if email_key: cls._store.pop(email_key, None)
            return False

        # Either it was already marked verified on the OTP page OR matches the code
        matched = False
        if entry.get("verified", False):
            matched = True
        elif clean_otp and entry["otp"] == clean_otp:
            matched = True

        if matched:
            # Clean up keys after successful authentication
            if phone_key: cls._store.pop(phone_key, None)
            if email_key: cls._store.pop(email_key, None)
            if entry.get("phone"): cls._store.pop(f"phone:{entry['phone']}:{canon_purpose}", None)
            if entry.get("email"): cls._store.pop(f"email:{entry['email']}:{canon_purpose}", None)
            return True

        return False
