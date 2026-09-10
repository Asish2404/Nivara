from datetime import datetime, timezone, timedelta
from typing import Optional
import zoneinfo


def get_kolkata_tz():
    """Return Asia/Kolkata (IST, UTC+05:30) timezone object."""
    try:
        return zoneinfo.ZoneInfo("Asia/Kolkata")
    except Exception:
        return timezone(timedelta(hours=5, minutes=30))


def get_current_time() -> datetime:
    """Return the current time in Kolkata / IST timezone (UTC+05:30)."""
    return datetime.now(get_kolkata_tz())


def ensure_kolkata_tz(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure a datetime has the Asia/Kolkata timezone attached.

    If naive, attaches Kolkata timezone directly (since SQLite stores local time).
    If already aware, converts to Kolkata timezone.
    """
    if dt is None:
        return None
    tz = get_kolkata_tz()
    if dt.tzinfo is None:
        return dt.replace(tzinfo=tz)
    return dt.astimezone(tz)


def format_12hr_time(dt: Optional[datetime]) -> str:
    """Format datetime into 12-hour time with AM/PM (e.g., '07:15 PM')."""
    if dt is None:
        return ""
    dt_tz = ensure_kolkata_tz(dt)
    return dt_tz.strftime("%I:%M %p")


def format_12hr_datetime(dt: Optional[datetime]) -> str:
    """Format datetime into human-readable date + 12-hour time (e.g., 'Sep 10, 2026, 07:15 PM')."""
    if dt is None:
        return ""
    dt_tz = ensure_kolkata_tz(dt)
    return dt_tz.strftime("%b %d, %Y, %I:%M %p")
