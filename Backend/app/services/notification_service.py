import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy import select, or_, and_, update, delete, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.notification import Notification
from ..models.report import Report
from ..models.user import User
from ..models.admin import Admin
from ..models.waterlogging import WaterloggingPrediction
from ..core.datetime_utils import get_current_time, ensure_kolkata_tz
from .incident_service import is_same_place, calculate_distance_km


class NotificationService:

    @classmethod
    async def create_notification(
        cls,
        db: AsyncSession,
        user_id: str,
        type: str,
        title: str,
        message: str,
        location: str = "",
        ward: str = "",
        report_id: str = "",
        work_id: str = "",
    ) -> Notification:
        """Persist a new notification directly to the database."""
        now = get_current_time()
        notif_id = f"NOTIF-{uuid.uuid4().hex[:10].upper()}"

        notif = Notification(
            notification_id=notif_id,
            user_id=str(user_id),
            type=type,
            title=title,
            message=message,
            location=location or "",
            ward=ward or "",
            is_read=False,
            report_id=report_id or "",
            work_id=work_id or "",
            created_at=now,
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        notif.created_at = ensure_kolkata_tz(notif.created_at)
        return notif

    @classmethod
    async def cleanup_expired_user_notifications(
        cls, db: AsyncSession, user_id: Optional[str] = None
    ) -> int:
        """Automatically delete notifications older than 7 days strictly for citizen users.
        Municipal admin alerts, broadcasts, and admin notifications are NEVER deleted.
        """
        now = get_current_time()
        # In SQLite, datetimes are stored without timezone info. Use naive datetime to avoid offset-naive vs offset-aware comparison errors.
        cutoff_dt = (now - timedelta(days=7)).replace(tzinfo=None)
        time_condition = Notification.created_at < cutoff_dt

        try:
            # Gather all admin identifiers to guarantee they are never touched
            admin_stmt = select(Admin.id)
            admin_res = await db.execute(admin_stmt)
            admin_ids = set(admin_res.scalars().all())
        except Exception:
            admin_ids = set()
        admin_ids.update(["ADMIN_BROADCAST", "SYSTEM"])

        if user_id:
            uid_str = str(user_id).strip()
            # If target is an admin, abort cleanup immediately - admin notifications are never purged after 7 days
            if uid_str in admin_ids or uid_str.startswith("ADM-"):
                return 0
            del_stmt = delete(Notification).where(
                Notification.user_id == uid_str,
                time_condition,
            ).execution_options(synchronize_session=False)
        else:
            # System-wide citizen cleanup: target only regular citizen notifications older than 7 days
            conditions = [
                time_condition,
                ~Notification.user_id.in_(admin_ids),
                ~Notification.user_id.startswith("ADM-"),
            ]
            del_stmt = delete(Notification).where(and_(*conditions)).execution_options(synchronize_session=False)

        result = await db.execute(del_stmt)
        await db.commit()
        deleted_count = result.rowcount or 0
        if deleted_count > 0:
            print(f"[KWI] Cleaned up {deleted_count} expired (> 7 days) notifications for regular user(s).")
        return deleted_count

    @classmethod
    async def get_user_notifications(
        cls,
        db: AsyncSession,
        user_id: str,
        is_admin: bool = False,
        current_lat: Optional[float] = None,
        current_lon: Optional[float] = None,
        current_location: Optional[str] = None,
    ) -> List[Notification]:
        """Fetch all notifications for the given user (newest first)."""
        if is_admin:
            # Admins see their notifications and municipal system alerts - NEVER pruned by 7-day rule
            stmt = select(Notification).where(
                or_(
                    Notification.user_id == str(user_id),
                    Notification.user_id == "ADMIN_BROADCAST",
                    Notification.user_id == "SYSTEM",
                )
            ).order_by(Notification.created_at.desc())
        else:
            # Automatically delete all notifications older than 7 days strictly for citizen users
            try:
                await cls.cleanup_expired_user_notifications(db, user_id=str(user_id))
            except Exception as c_err:
                print(f"[KWI] cleanup_expired_user_notifications notice: {c_err}")

            # Synchronize 24-hour flood & weather forecast for citizen user's CURRENT device location
            try:
                await cls.sync_user_location_forecasts(
                    db,
                    user_id,
                    current_lat=current_lat,
                    current_lon=current_lon,
                    current_location=current_location,
                )
            except Exception as f_err:
                print(f"[KWI] sync_user_location_forecasts notice: {f_err}")

            # Synchronize any missing report lifecycle notifications (In Progress or Resolved) for user's reports
            try:
                await cls.sync_user_lifecycle_notifications(db, user_id)
            except Exception as l_err:
                print(f"[KWI] sync_user_lifecycle_notifications notice: {l_err}")

            # Regular citizens strictly receive their report updates and current location forecast notification
            stmt = select(Notification).where(
                Notification.user_id == str(user_id)
            ).order_by(Notification.created_at.desc())

        result = await db.execute(stmt)
        notifications = list(result.scalars().all())
        for n in notifications:
            n.created_at = ensure_kolkata_tz(n.created_at)
        return notifications

    @classmethod
    async def mark_as_read(
        cls, db: AsyncSession, user_id: str, notification_id: str
    ) -> bool:
        """Mark a specific notification as read."""
        clean_id = str(notification_id).strip()
        stmt = select(Notification).where(
            or_(
                Notification.notification_id == clean_id,
                Notification.id == (int(clean_id) if clean_id.isdigit() else -1),
            ),
            or_(
                Notification.user_id == str(user_id),
                Notification.user_id == "ADMIN_BROADCAST",
            ),
        )
        result = await db.execute(stmt)
        notif = result.scalars().first()
        if not notif:
            return False

        notif.is_read = True
        await db.commit()
        return True

    @classmethod
    async def mark_all_as_read(cls, db: AsyncSession, user_id: str) -> int:
        """Mark all notifications as read for the user."""
        stmt = (
            update(Notification)
            .where(
                or_(
                    Notification.user_id == str(user_id),
                    Notification.user_id == "ADMIN_BROADCAST",
                )
            )
            .values(is_read=True)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount or 0

    @classmethod
    async def delete_notification(
        cls, db: AsyncSession, user_id: str, notification_id: str, is_admin: bool = False
    ) -> bool:
        """Delete a single notification owned by the user or any alert if admin."""
        clean_id = str(notification_id).strip()
        id_cond = or_(
            Notification.notification_id == clean_id,
            Notification.id == (int(clean_id) if clean_id.isdigit() else -1),
        )
        if is_admin:
            stmt = select(Notification).where(id_cond)
        else:
            stmt = select(Notification).where(
                id_cond,
                or_(
                    Notification.user_id == str(user_id),
                    Notification.user_id == "ADMIN_BROADCAST",
                    Notification.user_id == "SYSTEM",
                ),
            )
        result = await db.execute(stmt)
        notif = result.scalars().first()
        if not notif:
            return False

        await db.delete(notif)
        await db.commit()
        return True

    @classmethod
    async def clear_read_notifications(cls, db: AsyncSession, user_id: str) -> int:
        """Delete all read notifications for the user."""
        stmt = (
            delete(Notification)
            .where(
                Notification.user_id == str(user_id),
                Notification.is_read == True,
            )
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount or 0

    @classmethod
    async def notify_users_for_incident(
        cls,
        db: AsyncSession,
        location: str,
        ward: str = "",
        target_status: str = "",
        work_id: str = "",
        latitude: float = 0.0,
        longitude: float = 0.0,
    ) -> List[Notification]:
        """Trigger Type 2 ('In Progress') or Type 3 ('Resolved') notifications:
        Finds all citizen users who generated reports for this incident location,
        and saves a persistent notification for each distinct user in the database.
        """
        now = get_current_time()
        norm_status = (target_status or "").strip().lower()
        if norm_status not in ["in progress", "resolved"]:
            return []

        target_type = "incident_in_progress" if norm_status == "in progress" else "incident_resolved"
        loc_str = str(location or "").strip()
        if not loc_str:
            return []

        # 1. Fetch all reports to find matching user_ids
        rep_stmt = select(Report)
        rep_res = await db.execute(rep_stmt)
        all_reports = list(rep_res.scalars().all())

        matching_users = {}  # user_id -> report
        clean_target_loc = loc_str.lower()
        target_primary = clean_target_loc.split(",")[0].strip() if clean_target_loc else ""

        for r in all_reports:
            r_loc = str(r.location or "").strip().lower()
            if not r_loc or not r.user_id:
                continue

            r_primary = r_loc.split(",")[0].strip() if r_loc else ""
            is_match = False

            if clean_target_loc in r_loc or r_loc in clean_target_loc:
                is_match = True
            elif target_primary and r_primary and (target_primary in r_primary or r_primary in target_primary):
                is_match = True
            elif is_same_place(loc_str, r.location or "", latitude, longitude, float(r.latitude or 0), float(r.longitude or 0)):
                is_match = True
            elif ("salt lake" in clean_target_loc and "salt lake" in r_loc and "sector v" in clean_target_loc and "sector v" in r_loc):
                is_match = True
            elif ("college more" in clean_target_loc and "college more" in r_loc) or ("behala" in clean_target_loc and "behala" in r_loc) or ("park street" in clean_target_loc and "park street" in r_loc):
                is_match = True

            if is_match:
                # Keep earliest or most descriptive report for user
                if r.user_id not in matching_users:
                    matching_users[r.user_id] = r

        created_notifs = []
        for uid, matched_rep in matching_users.items():
            rep_loc = loc_str or matched_rep.location or "Reported Hotspot"

            # Check for existing duplicate notification of same type for this user and report / location
            existing_conditions = [
                Notification.location == loc_str,
                Notification.location == rep_loc,
            ]
            if matched_rep.report_id:
                existing_conditions.append(Notification.report_id == matched_rep.report_id)
            if work_id:
                existing_conditions.append(Notification.work_id == work_id)

            existing_stmt = select(Notification).where(
                Notification.user_id == str(uid),
                Notification.type == target_type,
                or_(*existing_conditions),
            )
            existing_res = await db.execute(existing_stmt)
            if existing_res.scalars().first():
                continue  # Skip duplicate

            rep_ward = ward or matched_rep.ward or ""
            rep_loc = loc_str or matched_rep.location or "Reported Hotspot"

            if norm_status == "in progress":
                title = "Response In Progress: Field Team Deployed"
                message = (
                    f"Municipal response crews and high-capacity drainage units have been deployed to {rep_loc} "
                    f"for your reported incident. Active clearing operations in progress for the report_id: {matched_rep.report_id}."
                )
            else:  # resolved
                title = "Incident Resolved: Water Cleared"
                message = (
                    f"Waterlogging incident at {rep_loc} has been successfully resolved and drained. "
                    f"Municipal crews have completed road clearance and reopened the corridor to normal traffic."
                )

            notif = Notification(
                notification_id=f"NOTIF-{uuid.uuid4().hex[:10].upper()}",
                user_id=str(uid),
                type=target_type,
                title=title,
                message=message,
                location=rep_loc,
                ward=f"Ward {rep_ward}" if rep_ward and "ward" not in str(rep_ward).lower() else str(rep_ward),
                is_read=False,
                report_id=matched_rep.report_id or "",
                work_id=work_id or "",
                created_at=now,
            )
            db.add(notif)
            created_notifs.append(notif)

        if created_notifs:
            await db.commit()
            for cn in created_notifs:
                await db.refresh(cn)
                cn.created_at = ensure_kolkata_tz(cn.created_at)

        return created_notifs

    @classmethod
    async def sync_user_lifecycle_notifications(
        cls, db: AsyncSession, user_id: str
    ) -> List[Notification]:
        """Ensures that any submitted report owned by the user that has transitioned
        to 'In Progress' or 'Resolved' has its corresponding notification created in the database.
        Guarantees that citizen users never miss an 'In Progress' or 'Resolved' alert.
        """
        now = get_current_time()
        rep_stmt = select(Report).where(Report.user_id == str(user_id))
        rep_res = await db.execute(rep_stmt)
        reports = list(rep_res.scalars().all())

        created = []
        for r in reports:
            r_status = (r.status or "").strip().lower()
            if r_status not in ["in progress", "resolved"]:
                continue

            target_type = "incident_in_progress" if r_status == "in progress" else "incident_resolved"
            rep_loc = str(r.location or "").strip() or "Reported Hotspot"
            rep_ward = str(r.ward or "").strip()

            # Check if user already has this notification for this report
            existing_stmt = select(Notification).where(
                Notification.user_id == str(user_id),
                Notification.type == target_type,
                or_(
                    Notification.report_id == str(r.report_id or ""),
                    Notification.location == rep_loc,
                ),
            )
            existing_res = await db.execute(existing_stmt)
            if existing_res.scalars().first():
                continue

            if r_status == "in progress":
                title = "Response In Progress: Field Team Deployed"
                message = (
                    f"Municipal response crews and high-capacity drainage units have been deployed to {rep_loc} "
                    f"for your reported incident. Active clearing operations in progress for report ID: #{r.report_id}."
                )
            else:
                title = "Incident Resolved: Water Cleared"
                message = (
                    f"Waterlogging incident at {rep_loc} has been successfully resolved and drained. "
                    f"Municipal crews have completed road clearance and reopened the corridor to normal traffic."
                )

            ward_label = f"Ward {rep_ward}" if rep_ward and "ward" not in rep_ward.lower() else rep_ward
            notif = Notification(
                notification_id=f"NOTIF-{uuid.uuid4().hex[:10].upper()}",
                user_id=str(user_id),
                type=target_type,
                title=title,
                message=message,
                location=rep_loc,
                ward=ward_label,
                is_read=False,
                report_id=str(r.report_id or ""),
                work_id="",
                created_at=now,
            )
            db.add(notif)
            created.append(notif)

        if created:
            await db.commit()
            for n in created:
                await db.refresh(n)
                n.created_at = ensure_kolkata_tz(n.created_at)

        return created

    @classmethod
    async def sync_user_location_forecasts(
        cls,
        db: AsyncSession,
        user_id: str,
        current_lat: Optional[float] = None,
        current_lon: Optional[float] = None,
        current_location: Optional[str] = None,
    ) -> List[Notification]:
        """Automatically checks latest meteorological and waterlogging predictions
        strictly for the citizen's CURRENT device location, creating or updating exactly ONE
        personalized forecast notification and removing any stale forecasts for other locations.
        """
        # 1. Fetch user profile
        u_stmt = select(User).where(User.id == str(user_id))
        u_res = await db.execute(u_stmt)
        user = u_res.scalars().first()

        # 2. Determine target current location coordinates and label
        target_lat = float(current_lat or 0.0)
        target_lon = float(current_lon or 0.0)
        target_loc = (current_location or "").strip()

        # If user passed valid location and profile location is unset, sync it
        if user and target_loc and not user.location:
            user.location = target_loc
            await db.commit()

        if not target_loc and user and user.location:
            target_loc = user.location.strip()

        if not target_loc:
            # Fall back to user's latest report location
            rep_stmt = (
                select(Report)
                .where(Report.user_id == str(user_id))
                .order_by(Report.created_at.desc())
                .limit(1)
            )
            rep_res = await db.execute(rep_stmt)
            latest_rep = rep_res.scalars().first()
            if latest_rep:
                target_loc = (latest_rep.location or "").strip()
                if target_lat == 0.0 and target_lon == 0.0:
                    target_lat = float(latest_rep.latitude or 0.0)
                    target_lon = float(latest_rep.longitude or 0.0)

        if not target_loc:
            target_loc = "Kolkata, West Bengal"
            if target_lat == 0.0 and target_lon == 0.0:
                target_lat, target_lon = 22.5726, 88.3639

        # 3. Fetch recent waterlogging predictions
        pred_stmt = (
            select(WaterloggingPrediction)
            .order_by(desc(WaterloggingPrediction.prediction_timestamp))
            .limit(300)
        )
        pred_res = await db.execute(pred_stmt)
        predictions = list(pred_res.scalars().all())
        if not predictions:
            return []

        # Find best matching prediction
        best_pred = None
        if target_lat != 0.0 and target_lon != 0.0:
            best_pred = min(
                predictions,
                key=lambda p: calculate_distance_km(target_lat, target_lon, p.latitude, p.longitude)
            )
        else:
            primary_word = target_loc.split(",")[0].strip().lower()
            for p in predictions:
                if primary_word in str(p.locality).lower():
                    best_pred = p
                    break
            if not best_pred:
                best_pred = predictions[0]

        rain = float(best_pred.forecast_rain_24h_mm or 0.0)
        prob_pct = int(float(best_pred.waterlogging_probability or 0.0) * 100)
        risk = str(best_pred.risk_level or "MEDIUM").upper()
        pred_ward = str(best_pred.ward or "").replace("nan", "").strip()
        ward_label = f"Ward {pred_ward}" if pred_ward and "ward" not in pred_ward.lower() else pred_ward

        primary_loc = target_loc.split(",")[0].strip()
        title = f"24h Weather Forecast: {primary_loc}"
        ward_clause = f" ({ward_label})" if ward_label else ""
        message = (
            f"24-Hour Hydrological Forecast for your current location ({target_loc}{ward_clause}): "
            f"{rain:.1f} mm rainfall predicted. Waterlogging risk: {risk} ({prob_pct}% probability). "
            f"Local stormwater drainage and pumping networks actively monitored."
        )

        now = get_current_time()

        # 4. Strictly ensure user ONLY has forecasting notifications for their current location:
        # Purge all location_forecast rows for this user that are not for target_loc
        del_stmt = delete(Notification).where(
            Notification.user_id == str(user_id),
            Notification.type == "location_forecast",
            Notification.location != target_loc,
        )
        await db.execute(del_stmt)

        # Check if an existing forecast notification for target_loc already exists
        existing_stmt = select(Notification).where(
            Notification.user_id == str(user_id),
            Notification.type == "location_forecast",
            Notification.location == target_loc,
        )
        existing_res = await db.execute(existing_stmt)
        existing_notif = existing_res.scalars().first()

        if existing_notif:
            existing_notif.title = title
            existing_notif.message = message
            existing_notif.ward = ward_label
            await db.commit()
            await db.refresh(existing_notif)
            existing_notif.created_at = ensure_kolkata_tz(existing_notif.created_at)
            return [existing_notif]
        else:
            notif = Notification(
                notification_id=f"NOTIF-FCST-{uuid.uuid4().hex[:10].upper()}",
                user_id=str(user_id),
                type="location_forecast",
                title=title,
                message=message,
                location=target_loc,
                ward=ward_label,
                is_read=False,
                report_id="",
                work_id="",
                created_at=now,
            )
            db.add(notif)
            await db.commit()
            await db.refresh(notif)
            notif.created_at = ensure_kolkata_tz(notif.created_at)
            return [notif]
