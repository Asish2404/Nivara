import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy import select, or_, and_, update, delete, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.notification import Notification
from ..models.report import Report
from ..models.user import User
from ..models.admin import Admin
from ..models.work_order import WorkOrder
from ..models.incident_queue import IncidentQueue
from ..models.historical_place import HistoricalPlace
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
            # Synchronize municipal operational telemetry across the 4 active categories:
            # 1. Urgent Flooding (urgent)
            # 2. Drainage & Pumps (pumps)
            # 3. Citizen Report Clusters (reports)
            # 4. Operations Complete (resolved)
            try:
                await cls.sync_admin_operational_notifications(db)
            except Exception as a_err:
                print(f"[KWI] sync_admin_operational_notifications notice: {a_err}")

            stmt = select(Notification).where(
                or_(
                    Notification.user_id == str(user_id),
                    Notification.user_id == "ADMIN_BROADCAST",
                ),
                Notification.type != "system",
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

    @classmethod
    async def sync_admin_operational_notifications(
        cls, db: AsyncSession
    ) -> List[Notification]:
        """Synchronize municipal operational telemetry notifications strictly across 4 active categories,
        directly derived from live SQLite tables:
        1. 🔴 Urgent Flooding & Weather Alerts (from IncidentQueue high depth & WaterloggingPrediction)
        2. 🟠 Drainage, Pumps & Sluice Gates (from IncidentQueue active de-watering & lock-gates)
        3. 🔵 City-Wide Citizen Report Clusters (from Report table clusters & verified reports)
        4. 🟢 Operations Complete & Resolved Orders (from HistoricalPlace resolved interventions)

        Category 5 (type='system') is strictly excluded and purged.
        """
        now = get_current_time()

        # Purge legacy static/system notifications that don't match the live database
        try:
            old_dummy_titles = [
                "IMD Red Alert: Flash Flood Warning in Ultadanga & Sector V",
                "IMD Red Alert: Flash Flood Warning in Kolkata Ward 109",
                "Palmer Bazar PS-07: Turbines at Maximum Capacity",
                "Circular Canal Sluice Gate #3 Schedule Advisory",
                "Automated Sluice Gate Schedule: Circular Canal Lock-Gate #3",
                "Hotspot Cluster: Multi-Citizen Reports at College More",
                "Operations Complete: Park Street De-watering Resolved",
                "Operations Complete: Park Street Crossing, Kolkata De-watering Resolved",
                "Verified Citizen Report: Salt Lake, Sector V, Kolkata",
            ]
            purge_stmt = delete(Notification).where(
                Notification.user_id == "ADMIN_BROADCAST",
                or_(
                    Notification.type == "system",
                    Notification.title.in_(old_dummy_titles),
                    Notification.title.like("%Circular Canal Lock-Gate%"),
                    Notification.title.like("%Verified Citizen Report%"),
                ),
            ).execution_options(synchronize_session=False)
            await db.execute(purge_stmt)
            await db.commit()
        except Exception as p_err:
            print(f"[KWI] Purge old notifications notice: {p_err}")

        synced_notifications = []

        # -------------------------------------------------------------
        # Category 1: 🔴 Urgent Flooding & Weather Alerts (type='urgent')
        # Sourced directly from IncidentQueue high water depth & WaterloggingPrediction
        # -------------------------------------------------------------
        urgent_candidates = []
        try:
            # Check IncidentQueue for severe water accumulation (e.g. depth >= 30 cm)
            iq_stmt = (
                select(IncidentQueue)
                .where(IncidentQueue.water_depth >= 30.0)
                .order_by(desc(IncidentQueue.water_depth))
                .limit(1)
            )
            iq_res = await db.execute(iq_stmt)
            severe_inc = iq_res.scalars().first()

            if severe_inc:
                depth_cm = float(severe_inc.water_depth or 0.0)
                depth_in = depth_cm / 2.54
                loc = str(severe_inc.location or "Critical Zone")
                w_str = str(severe_inc.ward or "").replace("nan", "").strip()
                w_label = f"Ward {w_str}" if w_str and "ward" not in w_str.lower() else (w_str or "")
                urgent_candidates.append({
                    "title": f"Critical Inundation Alert: {loc} ({depth_cm:.0f} cm Depth)",
                    "message": (
                        f"Severe water accumulation of {depth_cm:.0f} cm (+{depth_in:.0f} in) recorded in {loc}. "
                        f"Operational safety threshold (+18 in) exceeded. Immediate traffic diversion and pump mobilization deployed."
                    ),
                    "location": loc,
                    "ward": w_label,
                    "type": "urgent",
                    "report_id": severe_inc.incident_id or "",
                })
        except Exception as iq_err:
            print(f"[KWI] IncidentQueue query for urgent notice: {iq_err}")

        try:
            # Query top waterlogging prediction from ML model ONLY when severe weather/risk is predicted
            high_pred_stmt = (
                select(WaterloggingPrediction)
                .order_by(desc(WaterloggingPrediction.priority_score))
                .limit(1)
            )
            pred_res = await db.execute(high_pred_stmt)
            top_pred = pred_res.scalars().first()

            if top_pred:
                rain_val = float(top_pred.forecast_rain_24h_mm or 0.0)
                prob_pct = int(float(top_pred.waterlogging_probability or 0.0) * 100)
                loc_clean = str(top_pred.locality or "Kolkata Low-Lying Zone")
                w_str = str(top_pred.ward or "").replace("nan", "").strip()
                w_label = f"Ward {w_str}" if w_str and "ward" not in w_str.lower() else (w_str or "")

                if rain_val >= 40.0:
                    urgent_candidates.append({
                        "title": f"IMD Heavy Rainfall Warning: {loc_clean} ({rain_val:.1f} mm Forecast)",
                        "message": (
                            f"High rainfall forecast of {rain_val:.1f} mm detected. Flooding probability at {prob_pct}%. "
                            f"Low-lying catchment areas placed on high municipal alert."
                        ),
                        "location": loc_clean,
                        "ward": w_label,
                        "type": "urgent",
                    })
                elif rain_val >= 25.0 and float(top_pred.waterlogging_probability or 0.0) >= 0.65:
                    urgent_candidates.append({
                        "title": f"High Inundation Risk Warning: {loc_clean}",
                        "message": (
                            f"Hydrological model flags elevated waterlogging vulnerability ({prob_pct}% probability, "
                            f"{rain_val:.1f} mm rain forecast) due to low drainage gradient and soil saturation."
                        ),
                        "location": loc_clean,
                        "ward": w_label,
                        "type": "urgent",
                    })
        except Exception as u_err:
            print(f"[KWI] Prediction query for admin urgent notice: {u_err}")

        # -------------------------------------------------------------
        # Category 2: 🟠 Drainage, Pumps & Sluice Gates (type='pumps')
        # Sourced directly from active IncidentQueue de-watering operations
        # -------------------------------------------------------------
        pumps_candidates = []
        try:
            pump_inc_stmt = (
                select(IncidentQueue)
                .where(IncidentQueue.water_depth >= 20.0)
                .order_by(desc(IncidentQueue.water_depth))
                .limit(1)
            )
            p_res = await db.execute(pump_inc_stmt)
            pump_inc = p_res.scalars().first()

            if pump_inc:
                p_loc = str(pump_inc.location or "Active Inundation Zone")
                p_depth = float(pump_inc.water_depth or 0.0)
                p_ward = str(pump_inc.ward or "").replace("nan", "").strip()
                p_wlabel = f"Ward {p_ward}" if p_ward and "ward" not in p_ward.lower() else (p_ward or "")
                pumps_candidates.append({
                    "title": f"High-Discharge Pump Activation: {p_loc}",
                    "message": (
                        f"Axial de-watering pumps and mobile auxiliary units deployed to address {p_depth:.0f} cm "
                        f"surface inundation along {p_loc}. Drainage discharge directed toward nearest municipal outfall canal."
                    ),
                    "location": p_loc,
                    "ward": p_wlabel,
                    "type": "pumps",
                    "work_id": f"PUMP-{pump_inc.incident_id}",
                })
        except Exception as p_err:
            print(f"[KWI] Pumps query notice: {p_err}")

        # -------------------------------------------------------------
        # Category 3: 🔵 City-Wide Citizen Report Clusters & Incoming Reports (type='reports')
        # Sourced directly from real citizen Report records in the database
        # -------------------------------------------------------------
        report_candidates = []
        try:
            rep_stmt = select(Report).order_by(desc(Report.submitted_at)).limit(100)
            rep_res = await db.execute(rep_stmt)
            all_reports = list(rep_res.scalars().all())

            # Group reports by ward or locality to find clusters
            ward_map: Dict[str, List[Report]] = {}
            for r in all_reports:
                w_key = str(r.ward or "").strip()
                loc_key = str(r.location or "").split(",")[0].strip()
                group_key = f"Ward {w_key}" if w_key else loc_key
                if group_key:
                    ward_map.setdefault(group_key, []).append(r)

            # 1. Multi-report clusters (>= 2 reports in same ward / locality)
            clusters = [(k, r_list) for k, r_list in ward_map.items() if len(r_list) >= 2]
            clusters.sort(key=lambda c: len(c[1]), reverse=True)

            clustered_report_ids = set()
            for c_key, c_reps in clusters[:2]:
                first_r = c_reps[0]
                rep_count = len(c_reps)
                for cr in c_reps:
                    if cr.report_id:
                        clustered_report_ids.add(cr.report_id)
                c_loc = first_r.location or c_key
                c_ward = str(first_r.ward or "").replace("nan", "").strip()
                w_lbl = f"Ward {c_ward}" if c_ward and "ward" not in c_ward.lower() else (c_ward or c_key)
                report_candidates.append({
                    "title": f"Hotspot Cluster: {rep_count} Citizen Reports in {w_lbl}",
                    "message": (
                        f"{rep_count} citizen waterlogging reports filed in {c_loc} ({w_lbl}). "
                        f"High report density detected; prioritized for emergency field response dispatch."
                    ),
                    "location": c_loc,
                    "ward": w_lbl,
                    "type": "reports",
                    "report_id": first_r.report_id or "",
                })

            # 2. Add individual recent citizen reports from database (if not already part of a cluster)
            for r in all_reports:
                if len(report_candidates) >= 2:
                    break
                if r.report_id in clustered_report_ids:
                    continue
                r_loc = str(r.location or "Reported Location").strip()
                r_ward = str(r.ward or "").replace("nan", "").strip()
                w_lbl = f"Ward {r_ward}" if r_ward and "ward" not in r_ward.lower() else (r_ward or "")
                depth_cm = float(r.water_depth or 0.0)
                depth_str = f" ({depth_cm:.0f} cm Depth)" if depth_cm > 0 else ""
                report_candidates.append({
                    "title": f"Citizen Waterlogging Report: {r_loc}{depth_str}",
                    "message": (
                        f"Citizen waterlogging report #{r.report_id} registered for {r_loc}"
                        + (f" ({w_lbl})" if w_lbl else "")
                        + f". Water depth: {depth_cm:.0f} cm. Queued for municipal review and response dispatch."
                    ),
                    "location": r_loc,
                    "ward": w_lbl,
                    "type": "reports",
                    "report_id": r.report_id or "",
                })
        except Exception as r_err:
            print(f"[KWI] Report query for admin cluster notice: {r_err}")

        # -------------------------------------------------------------
        # Category 4: 🟢 Operations Complete & Resolved Orders (type='incident_resolved')
        # Sourced directly from HistoricalPlace table
        # -------------------------------------------------------------
        resolved_candidates = []
        try:
            hp_stmt = select(HistoricalPlace).order_by(desc(HistoricalPlace.resolved_at)).limit(2)
            hp_res = await db.execute(hp_stmt)
            resolved_places = list(hp_res.scalars().all())

            for hp in resolved_places:
                loc = str(hp.location or "").strip()
                w_str = str(hp.ward or "").replace("nan", "").strip()
                w_label = f"Ward {w_str}" if w_str and "ward" not in w_str.lower() else (w_str or "")
                crew_str = f" ({hp.team_head_name})" if hp.team_head_name else ""
                work_disp = hp.work_id or "WO-RESOLVED"
                resolved_candidates.append({
                    "title": f"Operations Complete: {loc} De-watering Resolved",
                    "message": (
                        f"Field response crew{crew_str} completed de-watering operations for work order {work_disp}. "
                        f"{hp.reason or 'Stormwater drains confirmed clear and roadway reopened to regular traffic flow.'}"
                    ),
                    "location": loc,
                    "ward": w_label,
                    "type": "incident_resolved",
                    "work_id": work_disp,
                })
        except Exception as res_err:
            print(f"[KWI] Historical query for admin resolved notice: {res_err}")

        # Combine all candidates across the 4 active categories
        all_candidates = (
            urgent_candidates[:2]
            + pumps_candidates[:2]
            + report_candidates[:2]
            + resolved_candidates[:2]
        )

        # Prune any stale ADMIN_BROADCAST notifications that are not in all_candidates
        # and not live real-time cluster or resolution broadcasts
        valid_titles = {c["title"] for c in all_candidates}
        try:
            stale_stmt = select(Notification).where(
                Notification.user_id == "ADMIN_BROADCAST",
                ~Notification.notification_id.like("NOTIF-ADMIN-CLUST-%"),
                ~Notification.notification_id.like("NOTIF-ADMIN-REP-%"),
                ~Notification.notification_id.like("NOTIF-ADMIN-RES-%"),
            )
            stale_res = await db.execute(stale_stmt)
            for s in stale_res.scalars().all():
                if s.title not in valid_titles:
                    await db.delete(s)
            await db.commit()
        except Exception as s_err:
            print(f"[KWI] Clean stale admin notifications notice: {s_err}")

        # Deduplicate and persist to DB under user_id='ADMIN_BROADCAST'
        for cand in all_candidates:
            conditions = [Notification.title == cand["title"]]
            if cand.get("report_id"):
                conditions.append(Notification.report_id == cand["report_id"])
            if cand.get("work_id"):
                conditions.append(Notification.work_id == cand["work_id"])

            chk_stmt = select(Notification).where(
                Notification.user_id == "ADMIN_BROADCAST",
                or_(*conditions),
            )
            chk_res = await db.execute(chk_stmt)
            matching_rows = list(chk_res.scalars().all())

            if matching_rows:
                existing = matching_rows[0]
                existing.message = cand["message"]
                existing.location = cand.get("location", existing.location)
                existing.ward = cand.get("ward", existing.ward)
                existing.type = cand["type"]
                existing.title = cand["title"]
                if "report_id" in cand:
                    existing.report_id = cand["report_id"]
                if "work_id" in cand:
                    existing.work_id = cand["work_id"]
                existing.created_at = ensure_kolkata_tz(existing.created_at)
                synced_notifications.append(existing)

                # Delete any duplicate rows in DB for this candidate
                for dup in matching_rows[1:]:
                    await db.delete(dup)
            else:
                new_notif = Notification(
                    notification_id=f"NOTIF-ADMIN-{uuid.uuid4().hex[:10].upper()}",
                    user_id="ADMIN_BROADCAST",
                    type=cand["type"],
                    title=cand["title"],
                    message=cand["message"],
                    location=cand.get("location", ""),
                    ward=cand.get("ward", ""),
                    is_read=False,
                    report_id=cand.get("report_id", ""),
                    work_id=cand.get("work_id", ""),
                    created_at=now,
                )
                db.add(new_notif)
                synced_notifications.append(new_notif)

        await db.commit()
        for s in synced_notifications:
            s.created_at = ensure_kolkata_tz(s.created_at)
        return synced_notifications

    @classmethod
    async def check_and_notify_admin_report_cluster(
        cls, db: AsyncSession, new_report: Report
    ) -> Optional[Notification]:
        """Check if a newly submitted report forms or escalates a multi-report hotspot cluster,
        or creates an incoming citizen report dispatch alert for Municipal Admins.
        Dispatches a real-time Category 3 (reports) alert to Municipal Admins.
        """
        if not new_report or not new_report.location:
            return None

        target_loc = str(new_report.location).strip()
        target_lat = float(new_report.latitude or 0.0)
        target_lon = float(new_report.longitude or 0.0)
        new_ward = str(new_report.ward or "").replace("nan", "").strip()

        # Fetch recent reports from DB
        recent_res = await db.execute(
            select(Report).order_by(desc(Report.submitted_at)).limit(50)
        )
        recent_reports = list(recent_res.scalars().all())

        matching_reports = []
        for r in recent_reports:
            r_loc = str(r.location or "").strip()
            r_lat = float(r.latitude or 0.0)
            r_lon = float(r.longitude or 0.0)
            r_ward = str(r.ward or "").replace("nan", "").strip()

            if r.report_id == new_report.report_id:
                matching_reports.append(r)
            elif r_ward and new_ward and r_ward.lower() == new_ward.lower():
                matching_reports.append(r)
            elif r_loc.lower() == target_loc.lower() or is_same_place(target_loc, r_loc, target_lat, target_lon, r_lat, r_lon):
                matching_reports.append(r)
            elif target_lat != 0.0 and r_lat != 0.0 and calculate_distance_km(target_lat, target_lon, r_lat, r_lon) <= 1.5:
                matching_reports.append(r)

        cluster_count = len(matching_reports)
        ward_str = new_ward
        ward_label = f"Ward {ward_str}" if ward_str and "ward" not in ward_str.lower() else (ward_str or "")

        if cluster_count >= 2:
            title = f"Hotspot Cluster: {cluster_count} Citizen Reports in {ward_label or target_loc}"
            message = (
                f"{cluster_count} citizen waterlogging reports filed at {target_loc}"
                + (f" ({ward_label})" if ward_label else "")
                + ". High report density detected; prioritized for emergency field response dispatch."
            )
            id_prefix = "NOTIF-ADMIN-CLUST-"
        else:
            depth_cm = float(new_report.water_depth or 0.0)
            depth_str = f" ({depth_cm:.0f} cm Depth)" if depth_cm > 0 else ""
            title = f"Citizen Waterlogging Report: {target_loc}{depth_str}"
            message = (
                f"New citizen waterlogging report #{new_report.report_id} registered for {target_loc}"
                + (f" ({ward_label})" if ward_label else "")
                + f" reporting {depth_cm:.0f} cm water accumulation. Incident logged for municipal dispatch triage."
            )
            id_prefix = "NOTIF-ADMIN-REP-"

        # Check if an existing admin broadcast notification for this location cluster/report exists
        existing_stmt = select(Notification).where(
            Notification.user_id == "ADMIN_BROADCAST",
            Notification.type == "reports",
            or_(
                Notification.report_id == str(new_report.report_id or ""),
                Notification.title == title,
            ),
        )
        existing_res = await db.execute(existing_stmt)
        matching_existing = list(existing_res.scalars().all())

        now = get_current_time()
        if matching_existing:
            existing = matching_existing[0]
            existing.title = title
            existing.message = message
            existing.ward = ward_label
            existing.report_id = new_report.report_id or existing.report_id
            existing.is_read = False
            existing.created_at = now
            for dup in matching_existing[1:]:
                await db.delete(dup)
            await db.commit()
            await db.refresh(existing)
            existing.created_at = ensure_kolkata_tz(existing.created_at)
            return existing
        else:
            notif = Notification(
                notification_id=f"{id_prefix}{uuid.uuid4().hex[:10].upper()}",
                user_id="ADMIN_BROADCAST",
                type="reports",
                title=title,
                message=message,
                location=target_loc,
                ward=ward_label,
                is_read=False,
                report_id=new_report.report_id or "",
                work_id="",
                created_at=now,
            )
            db.add(notif)
            await db.commit()
            await db.refresh(notif)
            notif.created_at = ensure_kolkata_tz(notif.created_at)
            return notif

    @classmethod
    async def notify_admin_operations_complete(
        cls,
        db: AsyncSession,
        location: str,
        work_id: str = "",
        ward: str = "",
    ) -> Optional[Notification]:
        """Dispatch a real-time Category 4 (Operations Complete / resolved) notification to Municipal Admins
        when an incident or work order is resolved.
        """
        loc_clean = str(location or "Incident Site").strip()
        clean_work_id = str(work_id or "").replace("#", "").strip()
        display_work_id = clean_work_id if clean_work_id.startswith("WO-") else (f"WO-{clean_work_id}" if clean_work_id else "WO-RESOLVED")
        ward_clean = str(ward or "").replace("nan", "").strip()
        ward_label = f"Ward {ward_clean}" if ward_clean and "ward" not in ward_clean.lower() else (ward_clean or "")

        title = f"Operations Complete: {loc_clean} De-watering Resolved"
        message = (
            f"Field response crews and auxiliary pumping units have finished de-watering operations "
            f"for work order {display_work_id}. Stormwater drains confirmed clear and roadway reopened to regular traffic flow."
        )

        now = get_current_time()

        # Deduplication check: avoid duplicating for the same work_id or title
        existing_stmt = select(Notification).where(
            Notification.user_id == "ADMIN_BROADCAST",
            Notification.type == "incident_resolved",
            or_(
                Notification.work_id == display_work_id,
                Notification.title == title,
            ),
        )
        existing_res = await db.execute(existing_stmt)
        existing = existing_res.scalars().first()

        if existing:
            existing.message = message
            existing.is_read = False
            existing.created_at = now
            await db.commit()
            await db.refresh(existing)
            existing.created_at = ensure_kolkata_tz(existing.created_at)
            return existing

        notif = Notification(
            notification_id=f"NOTIF-ADMIN-RES-{uuid.uuid4().hex[:10].upper()}",
            user_id="ADMIN_BROADCAST",
            type="incident_resolved",
            title=title,
            message=message,
            location=loc_clean,
            ward=ward_label,
            is_read=False,
            report_id="",
            work_id=display_work_id,
            created_at=now,
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        notif.created_at = ensure_kolkata_tz(notif.created_at)
        return notif