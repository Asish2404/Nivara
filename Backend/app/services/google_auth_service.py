import logging
from typing import Dict, Any
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger("app.google_auth")


class GoogleAuthService:
    """
    Official Google Authentication Service for NIVARA.
    Cryptographically verifies Google ID Tokens against Google's public key infrastructure.
    """

    @staticmethod
    def verify_credential(credential: str) -> Dict[str, Any]:
        """
        Cryptographically verifies a Google ID Token (JWT).
        Validates:
          1. Cryptographic signature using Google's public certificates.
          2. Audience (aud) strictly matches the configured GOOGLE_CLIENT_ID.
          3. Token issuer (iss) is accounts.google.com or https://accounts.google.com.
          4. Token has not expired (exp).
          5. Email is verified by Google (email_verified == True).

        Returns verified Google user identity details.
        """
        if not credential or not isinstance(credential, str) or not credential.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Google authentication credential token.",
            )

        clean_token = credential.strip()

        try:
            request = google_requests.Request()
            # verify_oauth2_token verifies signature, audience, and expiration
            id_info = id_token.verify_oauth2_token(
                clean_token,
                request,
                audience=settings.GOOGLE_CLIENT_ID,
            )

            # Validate issuer
            issuer = id_info.get("iss")
            if issuer not in ["accounts.google.com", "https://accounts.google.com"]:
                logger.warning("Rejected token with invalid Google issuer: %s", issuer)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid Google token issuer: {issuer}",
                )

            # Validate email presence and verification status
            email = id_info.get("email")
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google identity token does not contain an email address.",
                )

            email_verified = id_info.get("email_verified", False)
            if not email_verified:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google account email address is not verified by Google.",
                )

            google_id = id_info.get("sub")
            if not google_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google identity token does not contain a valid subject ID.",
                )

            verified_data = {
                "google_id": str(google_id),
                "email": email.lower().strip(),
                "name": id_info.get("name") or email.split("@")[0],
                "picture": id_info.get("picture"),
                "given_name": id_info.get("given_name"),
                "family_name": id_info.get("family_name"),
                "email_verified": bool(email_verified),
            }
            logger.info("Successfully verified Google identity for: %s", verified_data["email"])
            return verified_data

        except ValueError as exc:
            logger.warning("Google token verification ValueError: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google token verification failed: {str(exc)}",
            )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Unexpected error during Google token verification: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred while verifying Google identity: {str(exc)}",
            )
