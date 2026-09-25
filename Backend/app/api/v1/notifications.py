from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user_or_default
from app.schemas.notification import NotificationResponse, NotificationUpdate
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get(
    "/notifications",
    response_model=List[NotificationResponse],
    summary="Fetch all notifications for the authenticated user",
)
async def get_my_notifications(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    location: Optional[str] = None,
    current_user: User = Depends(get_current_user_or_default),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve notifications stored in database for the current user.
    Regular citizens strictly receive only their report submission/status messages
    and a single 24h weather/flood forecast for their CURRENT device location.
    Municipal admins receive city-wide telemetry and incident notices.
    """
    is_admin = (
        getattr(current_user, "portal", "") == "admin"
        or "admin" in (getattr(current_user, "role", "") or "").lower()
        or "officer" in (getattr(current_user, "role", "") or "").lower()
    )
    notifs = await NotificationService.get_user_notifications(
        db=db,
        user_id=str(current_user.id),
        is_admin=is_admin,
        current_lat=lat,
        current_lon=lon,
        current_location=location,
    )
    return [NotificationResponse.model_validate(n) for n in notifs]


@router.patch(
    "/notifications/mark-all-read",
    summary="Mark all notifications as read for current user",
)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user_or_default),
    db: AsyncSession = Depends(get_db),
):
    """Marks every notification for current user as read."""
    count = await NotificationService.mark_all_as_read(db, str(current_user.id))
    return {"success": True, "updated_count": count}


@router.delete(
    "/notifications/clear-read",
    summary="Delete all read notifications for current user",
)
async def clear_read_notifications(
    current_user: User = Depends(get_current_user_or_default),
    db: AsyncSession = Depends(get_db),
):
    """Deletes all read notifications belonging to the current user."""
    count = await NotificationService.clear_read_notifications(db, str(current_user.id))
    return {"success": True, "deleted_count": count}


@router.patch(
    "/notifications/{notification_id}/read",
    summary="Mark a specific notification as read",
)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user_or_default),
    db: AsyncSession = Depends(get_db),
):
    """Marks a single notification as read if owned by the user."""
    success = await NotificationService.mark_as_read(
        db, str(current_user.id), notification_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied.",
        )
    return {"success": True, "notification_id": notification_id}


@router.delete(
    "/notifications/{notification_id}",
    summary="Delete a single notification",
)
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user_or_default),
    db: AsyncSession = Depends(get_db),
):
    """Deletes a single notification owned by current user."""
    is_admin = (
        getattr(current_user, "portal", "") == "admin"
        or "admin" in (getattr(current_user, "role", "") or "").lower()
        or "officer" in (getattr(current_user, "role", "") or "").lower()
    )
    success = await NotificationService.delete_notification(
        db, str(current_user.id), notification_id, is_admin=is_admin
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied.",
        )
    return {"success": True, "notification_id": notification_id}


@router.post(
    "/notifications/cleanup-expired",
    summary="Purge notifications older than 7 days strictly for citizen users",
)
async def cleanup_expired_notifications(
    current_user: User = Depends(get_current_user_or_default),
    db: AsyncSession = Depends(get_db),
):
    """Purges notifications older than 7 days strictly for citizen users.
    Admins are never pruned by this rule.
    """
    is_admin = (
        getattr(current_user, "portal", "") == "admin"
        or "admin" in (getattr(current_user, "role", "") or "").lower()
        or "officer" in (getattr(current_user, "role", "") or "").lower()
    )
    if is_admin:
        # Admins can trigger system-wide citizen cleanup
        deleted = await NotificationService.cleanup_expired_user_notifications(db, user_id=None)
    else:
        # Regular user triggers their own expired cleanup
        deleted = await NotificationService.cleanup_expired_user_notifications(db, user_id=str(current_user.id))

    return {"success": True, "deleted_count": deleted}

