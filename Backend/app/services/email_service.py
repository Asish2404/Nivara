import os
import smtplib
import asyncio
import logging
import html as html_lib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate
from typing import Optional

from dotenv import dotenv_values
from app.core.config import settings

logger = logging.getLogger("kwi.email_service")


class EmailService:
    """
    Centralized email dispatch service for Kolkata Water Intelligence.
    Handles:
      1. Signup & 2FA OTP emails
      2. First-time Welcome emails
      3. Successful Login Security Notification emails
    Reuses Gmail SMTP credentials configured in Backend/.env.
    """

    @classmethod
    def _get_smtp_credentials(cls):
        env_vals = dotenv_values(".env")
        raw_user = (
            env_vals.get("SMTP_USER", "")
            or getattr(settings, "SMTP_USER", "")
            or os.getenv("SMTP_USER", "")
        )
        raw_pass = (
            env_vals.get("SMTP_PASSWORD", "")
            or getattr(settings, "SMTP_PASSWORD", "")
            or os.getenv("SMTP_PASSWORD", "")
        )
        smtp_user = raw_user.strip() if raw_user else ""
        smtp_pass = raw_pass.replace(" ", "").strip() if raw_pass else ""
        smtp_host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(getattr(settings, "SMTP_PORT", 587))
        return smtp_user, smtp_pass, smtp_host, smtp_port

    @classmethod
    async def _send_smtp_email(cls, to_email: str, subject: str, html_content: str, text_content: str) -> bool:
        """Helper to send dual-part MIME email via authenticated SMTP in an async worker thread."""
        if not to_email or "@" not in to_email:
            logger.warning(f"Invalid email recipient: {to_email}")
            return False

        smtp_user, smtp_pass, smtp_host, smtp_port = cls._get_smtp_credentials()
        if not smtp_user or not smtp_pass:
            logger.warning("SMTP credentials not configured in Backend/.env. Skipping email dispatch.")
            print(f"\n[EMAIL NOTICE] No SMTP credentials configured. Email to {to_email} skipped.\n", flush=True)
            return False

        def _sync_send():
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"Kolkata Water Intelligence <{smtp_user}>"
            msg["To"] = to_email
            msg["Date"] = formatdate(localtime=True)
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [to_email], msg.as_string())

        try:
            await asyncio.to_thread(_sync_send)
            logger.info(f"Email successfully dispatched to {to_email} (Subject: {subject})")
            print(f"\n>>> [EMAIL SUCCESS] Dispatched to {to_email} | Subject: {subject}\n", flush=True)
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch email to {to_email}: {e}")
            print(f"\n>>> [EMAIL ERROR] Could not dispatch to {to_email}: {e}\n", flush=True)
            return False

    @classmethod
    def dispatch_background(cls, coro):
        """Dispatches an async email coroutine in the background without blocking caller."""
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(coro)
        except RuntimeError:
            asyncio.run(coro)

    # =========================================================================
    # 1. SIGNUP & 2FA OTP EMAIL
    # =========================================================================
    @classmethod
    async def send_signup_otp_email(
        cls,
        to_email: str,
        otp: str,
        user_name: Optional[str] = None,
        purpose: str = "signup",
    ) -> bool:
        """Sends clean, low-spam 6-digit verification code email."""
        clean_name = (user_name or "").strip()
        if clean_name:
            escaped_name = html_lib.escape(clean_name)
            greeting_html = f"Hello <strong style=\"color: #0369a1;\">{escaped_name}</strong>,"
            greeting_text = f"Hello {clean_name},"
        else:
            greeting_html = "Hello,"
            greeting_text = "Hello,"

        subject = "Your Kolkata Water Intelligence verification code"
        action_text = "account registration" if purpose in ["signup", "create"] else "sign in"

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 540px; margin: 36px auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #0b2545; padding: 28px 32px; text-align: left;">
      <div style="font-size: 12px; font-weight: 700; letter-spacing: 1.5px; color: #38bdf8; margin-bottom: 8px;">
        KOLKATA WATER INTELLIGENCE
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #ffffff;">
        Security Verification
      </h1>
    </div>

    <div style="padding: 32px;">
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #334155;">
        {greeting_html}
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #334155;">
        Please use the following verification code to complete your {action_text}:
      </p>

      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 24px;">
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0369a1; font-family: monospace;">
          {otp}
        </div>
      </div>

      <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.5; color: #64748b;">
        This code expires in <strong>5 minutes</strong>. For your security, do not share this code with anyone.
      </p>
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #94a3b8;">
        If you did not request this verification code, you can safely ignore this email.
      </p>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
      <strong style="color: #475569;">Kolkata Water Intelligence</strong><br>
      Municipal Water & Drainage Intelligence System<br>
      This is an automated notification.
    </div>
  </div>
</body>
</html>"""

        text_content = (
            f"{greeting_text}\n\n"
            f"Your verification code for Kolkata Water Intelligence is:\n\n"
            f"    {otp}\n\n"
            f"This code will expire in 5 minutes. For your security, please do not share this code with anyone.\n\n"
            f"If you did not request this code, you can safely ignore this email.\n\n"
            f"Kolkata Water Intelligence\n"
            f"Municipal Water & Drainage Intelligence System\n"
        )

        return await cls._send_smtp_email(to_email, subject, html_content, text_content)

    # =========================================================================
    # 2. WELCOME EMAIL (TRIGGERED ONCE UPON FIRST ACCOUNT ACTIVATION)
    # =========================================================================
    @classmethod
    async def send_welcome_email(
        cls,
        to_email: str,
        user_name: Optional[str] = None,
        role: Optional[str] = None,
    ) -> bool:
        """
        Sends an official Welcome Email upon first successful account creation & verification.
        Should only be sent ONCE per user account.
        """
        clean_name = (user_name or "Valued Officer / Citizen").strip()
        escaped_name = html_lib.escape(clean_name)
        display_role = (role or "Officer").strip()
        escaped_role = html_lib.escape(display_role)

        subject = "Welcome to Kolkata Water Intelligence"

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Kolkata Water Intelligence</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 560px; margin: 36px auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0b2545, #133a6b); padding: 32px; text-align: left;">
      <div style="font-size: 12px; font-weight: 700; letter-spacing: 1.5px; color: #38bdf8; margin-bottom: 8px;">
        KOLKATA WATER INTELLIGENCE
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
        Welcome to the Platform
      </h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #93c5fd;">
        Municipal Water & Drainage Intelligence Network
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.6; color: #1e293b;">
        Hello <strong style="color: #0369a1;">{escaped_name}</strong>,
      </p>

      <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.65; color: #334155;">
        Your account has been successfully created and verified. You now have authorized access to 
        <strong>Kolkata Water Intelligence</strong> — the next-generation municipal platform for AI-driven 
        drainage monitoring, flood telemetry, and urban water infrastructure management across Kolkata.
      </p>

      <!-- Account Summary Badge -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 22px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #64748b; text-transform: uppercase; margin-bottom: 10px;">
          Account Profile Summary
        </div>
        <div style="font-size: 13.5px; color: #334155; margin-bottom: 6px;">
          <strong>Account Name:</strong> {escaped_name}
        </div>
        <div style="font-size: 13.5px; color: #334155; margin-bottom: 6px;">
          <strong>Registered Email:</strong> {to_email}
        </div>
        <div style="font-size: 13.5px; color: #334155;">
          <strong>Assigned Role:</strong> <span style="background-color: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;">{escaped_role}</span>
        </div>
      </div>

      <!-- System Highlights -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 600; color: #0b2545; margin-bottom: 8px;">
          Key Platform Capabilities:
        </div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.7;">
          <li>Real-time telemetry and waterlogging sensor feeds across all Boroughs</li>
          <li>AI-powered drainage blockage detection and preventive mitigation alerts</li>
          <li>Geographic GIS incident mapping and automated municipal task routing</li>
        </ul>
      </div>

      <!-- Security Notice -->
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 4px;">
          Security & Access Notice
        </div>
        <div style="font-size: 12.5px; line-height: 1.5; color: #78350f;">
          Never share your administrative password or two-factor verification codes with anyone. 
          All actions are audited under Kolkata Municipal Corporation cyber regulations.
        </div>
      </div>

      <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
        If you have any questions or require administrative assistance, please contact the KWI Directorate Helpdesk.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
      <strong style="color: #475569;">Kolkata Water Intelligence</strong><br>
      Kolkata Municipal Corporation (KMC)<br>
      Official Urban Drainage & Smart Water Operations
    </div>

  </div>
</body>
</html>"""

        text_content = (
            f"Hello {clean_name},\n\n"
            f"Welcome to Kolkata Water Intelligence!\n\n"
            f"Your account has been successfully created and verified.\n"
            f"Assigned Role: {display_role}\n"
            f"Registered Email: {to_email}\n\n"
            f"About Kolkata Water Intelligence:\n"
            f"KWI is the official municipal intelligence platform for AI-powered drainage monitoring,\n"
            f"flood risk prevention, and urban water infrastructure management across Kolkata.\n\n"
            f"Security Notice:\n"
            f"Never share your account credentials or security passcodes. All sessions are monitored.\n\n"
            f"Kolkata Municipal Corporation (KMC)\n"
            f"Municipal Water & Drainage Intelligence Directorate\n"
        )

        return await cls._send_smtp_email(to_email, subject, html_content, text_content)

    # =========================================================================
    # 3. LOGIN SECURITY NOTIFICATION EMAIL
    # =========================================================================
    @classmethod
    async def send_login_notification_email(
        cls,
        to_email: str,
        user_name: Optional[str] = None,
        role: Optional[str] = None,
        login_time: Optional[datetime] = None,
        ip_address: Optional[str] = None,
    ) -> bool:
        """
        Sends a security notification email whenever a user successfully logs into their account
        AFTER credentials and 2FA OTP verification succeed.
        """
        clean_name = (user_name or "Authorized User").strip()
        escaped_name = html_lib.escape(clean_name)
        display_role = (role or "Officer").strip()
        escaped_role = html_lib.escape(display_role)

        # Format date & time in IST (Kolkata)
        time_obj = login_time or datetime.now()
        date_str = time_obj.strftime("%d %B %Y")
        time_str = time_obj.strftime("%I:%M %p IST")
        formatted_datetime = f"{date_str} at {time_str}"

        subject = "New Login Detected | Kolkata Water Intelligence"

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Login Detected</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 540px; margin: 36px auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background-color: #0b2545; padding: 28px 32px; text-align: left;">
      <div style="font-size: 12px; font-weight: 700; letter-spacing: 1.5px; color: #38bdf8; margin-bottom: 8px;">
        KOLKATA WATER INTELLIGENCE
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #ffffff;">
        Security Notice: Successful Login
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
        Hello <strong style="color: #0369a1;">{escaped_name}</strong>,
      </p>

      <p style="margin: 0 0 22px; font-size: 14.5px; line-height: 1.65; color: #334155;">
        We detected a successful login to your <strong>Kolkata Water Intelligence</strong> account.
      </p>

      <!-- Details Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 22px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #64748b; text-transform: uppercase; margin-bottom: 12px;">
          Authentication Session Details
        </div>
        <div style="font-size: 13px; color: #334155; margin-bottom: 6px;">
          <strong>Account Email:</strong> {to_email}
        </div>
        <div style="font-size: 13px; color: #334155; margin-bottom: 6px;">
          <strong>User Role:</strong> <span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 7px; border-radius: 5px; font-weight: 600; font-size: 12px;">{escaped_role}</span>
        </div>
        <div style="font-size: 13px; color: #334155; margin-bottom: 6px;">
          <strong>Date & Time:</strong> {formatted_datetime}
        </div>
        <div style="font-size: 13px; color: #334155;">
          <strong>Status:</strong> <span style="color: #16a34a; font-weight: 600;">2FA Verification Passed</span>
        </div>
      </div>

      <!-- Action notice if not you -->
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: #991b1b; margin-bottom: 4px;">
          Did not recognize this login?
        </div>
        <div style="font-size: 12.5px; line-height: 1.5; color: #7f1d1d;">
          If this was not you, please contact the system administrator immediately and change your account password.
        </div>
      </div>

      <p style="margin: 0; font-size: 12.5px; color: #94a3b8; line-height: 1.5;">
        This automated security notification was sent to help protect your official account.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
      <strong style="color: #475569;">Kolkata Water Intelligence</strong><br>
      Municipal Intelligence & Water Management System<br>
      Automated Security Notification
    </div>

  </div>
</body>
</html>"""

        text_content = (
            f"Hello {clean_name},\n\n"
            f"We detected a successful login to your Kolkata Water Intelligence account.\n\n"
            f"Account: {to_email}\n"
            f"Role: {display_role}\n"
            f"Date & Time: {formatted_datetime}\n"
            f"Status: 2FA Verification Passed\n\n"
            f"If this was not you, please contact the system administrator immediately.\n\n"
            f"Kolkata Water Intelligence\n"
            f"Municipal Water & Drainage Intelligence System\n"
        )

        return await cls._send_smtp_email(to_email, subject, html_content, text_content)
