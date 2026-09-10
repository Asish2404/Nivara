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

        # Prominently log to terminal so developer/tester can see the simulated SMS
        target_display = phone or email or "officer"
        print(f"\n=======================================================", flush=True)
        print(f" [KMC SMS GATEWAY] Dispatching 2FA OTP to Mobile: {target_display}", flush=True)
        print(f" OTP CODE: {otp} (Valid for 5 minutes)", flush=True)
        print(f" Purpose: {canon_purpose}", flush=True)
        print(f"=======================================================\n", flush=True)

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
    async def dispatch_email_otp(cls, to_email: Optional[str], otp: str, purpose: str = "login") -> bool:
        """
        Dispatches a 100% free official HTML 2FA email using Gmail SMTP.
        If no credentials are in .env, prints a notice to console.
        """
        if not to_email or "@" not in to_email:
            return False

        smtp_user = getattr(settings, "SMTP_USER", "") or os.getenv("SMTP_USER", "")
        smtp_pass = getattr(settings, "SMTP_PASSWORD", "") or os.getenv("SMTP_PASSWORD", "")
        smtp_host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(getattr(settings, "SMTP_PORT", 587))

        if not smtp_user or not smtp_pass:
            print(
                f"\n=======================================================\n"
                f" [FREE EMAIL OTP] Dispatched to: {to_email}\n"
                f" CODE: [{otp}] (Valid for 5 minutes)\n"
                f" Set SMTP_USER and SMTP_PASSWORD in Backend/.env\n"
                f" to receive it directly in your real Gmail inbox for free!\n"
                f"=======================================================\n",
                flush=True,
            )
            return False

        subject = f"KMC Security 2FA Clearance Code: {otp}"
        action_name = "account registration" if purpose == "signup" else "administrative sign in"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #070e1c; color: #ffffff; padding: 24px;">
          <div style="max-width: 500px; margin: 0 auto; background: #0c1c38; border: 1px solid rgba(6,182,212,0.3); border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="display: inline-block; background: #0284c7; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px;">KMC Official Clearance</div>
            <h2 style="font-size: 20px; font-weight: bold; margin: 16px 0 8px 0; color: #ffffff;">Two-Factor Authentication Passcode</h2>
            <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.6;">You have requested administrative access for {action_name} on the Kolkata Water Intelligence Platform.</p>
            <div style="background: #061126; border: 2px solid #06b6d4; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; font-size: 34px; font-family: monospace; font-weight: 800; letter-spacing: 8px; color: #22d3ee;">{otp}</div>
            <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.5;">This passcode is confidential and expires in <strong>5 minutes</strong>. If you did not initiate this request, contact the municipal cyber cell immediately.</p>
            <div style="font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; text-align: center;">
              Kolkata Municipal Corporation · Water Directorate & Drainage Wing<br>
              Cleaner City · Safer Tomorrow
            </div>
          </div>
        </body>
        </html>
        """

        def _send_sync():
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"Kolkata Municipal Corporation <{smtp_user}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [to_email], msg.as_string())

        try:
            await asyncio.to_thread(_send_sync)
            print(f"\n>>> [REAL EMAIL DISPATCH SUCCESS] 2FA OTP sent to {to_email} via Gmail SMTP!\n", flush=True)
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch email OTP via SMTP: {e}")
            print(f"\n>>> [EMAIL SMTP ERROR] Could not dispatch to {to_email}: {e}\n", flush=True)
            return False

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
