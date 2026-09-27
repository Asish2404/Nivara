from datetime import datetime
from typing import List, Optional, Union
from sqlalchemy import select, or_, and_, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.work_order import WorkOrder
from ..models.incident_queue import IncidentQueue
from ..models.historical_place import HistoricalPlace
from ..models.team_head import TeamHead
from ..models.report import Report
from ..schemas.work_order import WorkOrderCreate, WorkOrderStatusUpdate
from ..core.datetime_utils import get_current_time, ensure_kolkata_tz
from .incident_service import is_same_place


class WorkOrderService:

    @classmethod
    async def create_work_order(cls, db: AsyncSession, data: WorkOrderCreate) -> WorkOrder:
        """Stores a simulated incident intervention into the `work_orders` table.
        Pops the incident from the simulation dropdown queue.
        """
        now = get_current_time()

        # Derive clean incident ID matching incident_queue format (e.g. PA-729)
        raw_inc_id = data.incident_id or data.incident_ref or "IN-101"
        clean_inc_id = str(raw_inc_id).replace("#", "").strip()

        # Guard: do not create work orders when no active incident is selected / all clear
        if clean_inc_id.upper() in ["ALL-CLEAR", "CLEAR", "NONE", ""] or "ALL HOTSPOTS DISPATCHED" in (data.location or "").upper():
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="No active incidents in queue to generate work orders.")

        # Check if corresponding incident row exists in incident_queue to enrich missing metadata and exact incident_id
        inc_res = await db.execute(
            select(IncidentQueue).where(
                or_(
                    IncidentQueue.incident_id == clean_inc_id,
                    IncidentQueue.incident_id == f"#{clean_inc_id}",
                    IncidentQueue.incident_id == clean_inc_id.replace("-", ""),
                    IncidentQueue.location == data.location,
                )
            )
        )
        linked_inc = inc_res.scalars().first()
        if linked_inc and linked_inc.incident_id:
            clean_inc_id = str(linked_inc.incident_id).replace("#", "").strip()

        # Derive clean unique work order ID: format WO-incident_id
        clean_work_id = f"WO-{clean_inc_id}"

        # Parse coordinate floats if passed as strings like "22.5802° N"
        lat = 0.0
        if data.latitude is not None:
            try:
                lat_str = str(data.latitude).replace("°", "").replace("N", "").replace("S", "").strip()
                lat = float(lat_str)
            except Exception:
                lat = 0.0

        lon = 0.0
        if data.longitude is not None:
            try:
                lon_str = str(data.longitude).replace("°", "").replace("E", "").replace("W", "").strip()
                lon = float(lon_str)
            except Exception:
                lon = 0.0

        assigned_ulb_id = data.assigned_ulb_id or (linked_inc.assigned_ulb_id if linked_inc else "")
        assigned_ulb_name = data.assigned_ulb_name or (linked_inc.assigned_ulb_name if linked_inc else "")
        jurisdiction_type = data.jurisdiction_type or (linked_inc.jurisdiction_type if linked_inc else "")
        ward = str(data.ward or (linked_inc.ward if linked_inc else ""))
        issue_type = data.issue_type or (linked_inc.issue_type if linked_inc else "Waterlogging")
        risk_level = data.risk_level or (linked_inc.risk_level if linked_inc else "CRITICAL")
        water_depth = float(data.water_depth or (linked_inc.water_depth if linked_inc else 0.0))
        reports_count = int(data.reports_number or (linked_inc.report_count if linked_inc else 1))

        if lat == 0.0 and linked_inc:
            lat = linked_inc.latitude
        if lon == 0.0 and linked_inc:
            lon = linked_inc.longitude

        intervention_type = data.intervention_type or "Standard Hydraulic Drainage Response"

        # Check if work order with this work_id or incident_id already exists
        existing_res = await db.execute(
            select(WorkOrder).where(
                or_(
                    WorkOrder.work_id == clean_work_id,
                    WorkOrder.incident_id == clean_inc_id,
                    WorkOrder.incident_id == clean_inc_id.replace("-", ""),
                )
            )
        )
        existing = existing_res.scalars().first()

        # Find the first unoccupied supervisor in team_head
        sup_stmt = (
            select(TeamHead)
            .where(func.lower(func.trim(TeamHead.status)) == "not occupied")
            .order_by(TeamHead.id.asc())
        )
        sup_res = await db.execute(sup_stmt)
        unoccupied_sup = sup_res.scalars().first()

        # If all supervisors in team_head are occupied, reject creation
        if not unoccupied_sup:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No supervisor is currently available.",
            )

        assigned_sup_name = unoccupied_sup.name
        unoccupied_sup.status = "occupied"

        if existing:
            # Update existing work order with latest intervention details and standardized IDs
            existing.work_id = clean_work_id
            existing.incident_id = clean_inc_id
            existing.location = data.location or existing.location
            existing.latitude = lat or existing.latitude
            existing.longitude = lon or existing.longitude
            existing.ward = ward or existing.ward
            existing.assigned_ulb_id = assigned_ulb_id or existing.assigned_ulb_id
            existing.assigned_ulb_name = assigned_ulb_name or existing.assigned_ulb_name
            existing.jurisdiction_type = jurisdiction_type or existing.jurisdiction_type
            existing.issue_type = issue_type
            existing.risk_level = risk_level
            existing.water_depth = water_depth
            existing.reports_number = reports_count
            existing.intervention_type = intervention_type
            existing.status = data.status or existing.status
            if not existing.team_head_name and assigned_sup_name:
                existing.team_head_name = assigned_sup_name
            elif data.team_head_name:
                existing.team_head_name = data.team_head_name
            if data.admin_name:
                existing.admin_name = data.admin_name
            elif not existing.admin_name:
                existing.admin_name = "Municipal Administrator"
            existing.updated_at = now
            target_wo = existing
        else:
            target_wo = WorkOrder(
                work_id=clean_work_id,
                incident_id=clean_inc_id,
                location=data.location,
                latitude=lat,
                longitude=lon,
                ward=ward,
                assigned_ulb_id=assigned_ulb_id,
                assigned_ulb_name=assigned_ulb_name,
                jurisdiction_type=jurisdiction_type,
                issue_type=issue_type,
                risk_level=risk_level,
                water_depth=water_depth,
                reports_number=reports_count,
                intervention_type=intervention_type,
                status=data.status or "Dispatched",
                admin_name=data.admin_name or "Municipal Administrator",
                team_head_name=assigned_sup_name or data.team_head_name or "",
                original_image=data.original_image or "",
                image_url=data.image_url or "",
                reason=data.reason or "",
                created_at=now,
                dispatched_at=now,
                updated_at=now,
            )
            db.add(target_wo)

        # Synchronize status to linked incident_queue and reports tables
        target_status = target_wo.status or "Dispatched"
        await cls.sync_linked_incident_and_reports(
            db=db,
            incident_id=clean_inc_id,
            location=target_wo.location,
            latitude=lat,
            longitude=lon,
            assigned_ulb_name=assigned_ulb_name,
            work_id=clean_work_id,
            target_status=target_status,
            now=now,
        )

        await db.commit()
        await db.refresh(target_wo)

        target_wo.created_at = ensure_kolkata_tz(target_wo.created_at)
        target_wo.dispatched_at = ensure_kolkata_tz(target_wo.dispatched_at)
        target_wo.updated_at = ensure_kolkata_tz(target_wo.updated_at)
        return target_wo

    @classmethod
    async def sync_linked_incident_and_reports(
        cls,
        db: AsyncSession,
        incident_id: str,
        location: str,
        latitude: float,
        longitude: float,
        assigned_ulb_name: str,
        work_id: str,
        target_status: str,
        now: datetime,
        notify: bool = True,
    ) -> None:
        """Propagates work order lifecycle status directly to linked incident_queue and reports tables."""
        clean_inc = str(incident_id or "").replace("WO-", "").replace("#", "").strip()
        wo_loc = str(location or "").strip()
        wo_lat = float(latitude or 0.0)
        wo_lon = float(longitude or 0.0)
        wo_ulb = str(assigned_ulb_name or "").strip().lower()
        wo_primary = wo_loc.split(",")[0].strip().lower() if wo_loc else ""

        # 1. Update linked incident_queue record(s)
        inc_res = await db.execute(select(IncidentQueue))
        all_incidents = list(inc_res.scalars().all())
        for inc in all_incidents:
            clean_i = str(inc.incident_id or "").replace("#", "").strip()
            is_inc_match = False
            if clean_inc and (clean_i == clean_inc or clean_i == clean_inc.replace("-", "")):
                is_inc_match = True
            elif wo_loc and inc.location and (inc.location.strip().lower() == wo_loc.lower()):
                is_inc_match = True
            elif wo_loc and inc.location and is_same_place(inc.location, wo_loc, float(inc.latitude or 0), float(inc.longitude or 0), wo_lat, wo_lon):
                is_inc_match = True

            if is_inc_match:
                if target_status.lower() == "resolved":
                    await db.delete(inc)
                else:
                    inc.status = target_status
                    inc.updated_at = now

        # 2. Update linked reports record(s)
        rep_res = await db.execute(select(Report))
        all_reports = list(rep_res.scalars().all())
        for rep in all_reports:
            r_loc = str(rep.location or "").strip().lower()
            r_ulb = str(rep.assigned_ulb_name or "").strip().lower()
            r_primary = r_loc.split(",")[0].strip() if r_loc else ""

            is_match = False
            if clean_inc and clean_inc.lower() in str(getattr(rep, "incident_id", "") or "").lower():
                is_match = True
            elif wo_loc and (wo_loc.lower() == r_loc or wo_loc.lower() in r_loc or r_loc in wo_loc.lower()):
                is_match = True
            elif is_same_place(wo_loc, r_loc, wo_lat, wo_lon, float(rep.latitude or 0), float(rep.longitude or 0)):
                is_match = True
            elif ("salt lake" in wo_loc.lower() and "salt lake" in r_loc and "sector v" in wo_loc.lower() and "sector v" in r_loc):
                is_match = True
            elif ("college more" in wo_loc.lower() and "college more" in r_loc) or ("behala" in wo_loc.lower() and "behala" in r_loc) or ("park street" in wo_loc.lower() and "park street" in r_loc) or ("howrah" in wo_loc.lower() and "howrah" in r_loc):
                is_match = True
            elif wo_ulb and r_ulb and wo_ulb == r_ulb and wo_primary and r_primary and (wo_primary in r_primary or r_primary in wo_primary):
                is_match = True

            if is_match:
                rep.status = target_status
                if target_status.lower() == "resolved":
                    rep.dispatch_status = "Resolved"
                elif target_status.lower() == "in progress":
                    rep.dispatch_status = f"In Progress – Field Team on Site ({work_id})"
                elif target_status.lower() == "dispatched":
                    rep.dispatch_status = f"Dispatched – Rapid Response Assigned ({work_id})"
                else:
                    rep.dispatch_status = target_status

                # Populate dispatched_to with the municipal authority or ward team
                if not rep.dispatched_to or rep.dispatched_to == "—":
                    dept = assigned_ulb_name or rep.assigned_ulb_name or "KMC Emergency Response"
                    if rep.ward:
                        rep.dispatched_to = f"{dept} - Ward {rep.ward}"
                    else:
                        rep.dispatched_to = dept

                rep.updated_at = now

        # Triggers 2 & 3: Persistently notify all citizen users who reported this location
        # (Only when notify=True; internal database reconciliation does not spam citizen users)
        if notify and target_status.lower() in ["in progress", "resolved"]:
            try:
                from .notification_service import NotificationService
                await NotificationService.notify_users_for_incident(
                    db=db,
                    location=wo_loc,
                    ward="",
                    target_status=target_status,
                    work_id=work_id,
                    latitude=wo_lat,
                    longitude=wo_lon,
                )
            except Exception as notif_err:
                print(f"[KWI] Status change notification DB warning: {notif_err}")

        # Trigger 4: For municipal admins, broadcast an "Operations Complete" notification when an incident is resolved
        if notify and target_status.lower() in ["resolved", "completed"]:
            try:
                from .notification_service import NotificationService
                await NotificationService.notify_admin_operations_complete(
                    db=db,
                    location=wo_loc,
                    work_id=work_id,
                )
            except Exception as admin_notif_err:
                print(f"[KWI] Admin operations complete notification DB warning: {admin_notif_err}")

    @classmethod
    async def sync_all_database_statuses(cls, db: AsyncSession) -> None:
        """One-pass reconciliation ensuring historical_place and active work_orders statuses
        are properly mirrored into incident_queue and reports tables.
        Removes any work orders with status 'Resolved' from the work_orders table, ensuring
        they reside strictly in historical_place.
        Internal reconciliation strictly disables notifications to avoid duplicate broadcasts.
        """
        now = get_current_time()

        # 1. Sync from historical_place (all resolved incidents)
        hist_res = await db.execute(select(HistoricalPlace))
        for hp in hist_res.scalars().all():
            await cls.sync_linked_incident_and_reports(
                db=db,
                incident_id=hp.incident_id,
                location=hp.location,
                latitude=hp.latitude,
                longitude=hp.longitude,
                assigned_ulb_name=hp.assigned_ulb_name,
                work_id=hp.work_id or f"WO-{hp.incident_id}",
                target_status="Resolved",
                now=now,
                notify=False,
            )

        # 2. Sync from work_orders (clean up any Resolved work orders from work_orders table)
        wo_res = await db.execute(select(WorkOrder))
        for wo in wo_res.scalars().all():
            if (wo.status or "").strip().lower() == "resolved":
                clean_inc = str(wo.incident_id or "").replace("#", "").strip()
                work_order_id = wo.work_id or f"WO-{clean_inc}"
                hp_res = await db.execute(
                    select(HistoricalPlace).where(
                        or_(
                            HistoricalPlace.work_id == work_order_id,
                            HistoricalPlace.incident_id == clean_inc,
                        )
                    )
                )
                if not hp_res.scalars().first():
                    db.add(
                        HistoricalPlace(
                            incident_id=clean_inc,
                            location=str(wo.location or ""),
                            latitude=float(wo.latitude or 0.0),
                            longitude=float(wo.longitude or 0.0),
                            issue_type=str(wo.issue_type or "Waterlogging"),
                            water_depth=float(wo.water_depth or 0.0),
                            work_id=work_order_id,
                            assigned_ulb_id=str(wo.assigned_ulb_id or ""),
                            assigned_ulb_name=str(wo.assigned_ulb_name or ""),
                            jurisdiction_type=str(wo.jurisdiction_type or ""),
                            ward=str(wo.ward or ""),
                            admin_name=str(wo.admin_name or ""),
                            team_head_name=str(wo.team_head_name or ""),
                            original_image=str(wo.original_image or ""),
                            image_url=str(wo.image_url or ""),
                            reason=str(wo.reason or "Resolved by Field Supervisor"),
                            status="Resolved",
                            created_at=wo.created_at or now,
                            resolved_at=wo.resolved_at or now,
                        )
                    )
                if wo.team_head_name:
                    sup_q = await db.execute(
                        select(TeamHead).where(TeamHead.name == wo.team_head_name)
                    )
                    assigned_sup = sup_q.scalars().first()
                    if assigned_sup:
                        assigned_sup.status = "not occupied"
                # Remove resolved work order from work_orders table
                await db.delete(wo)
                continue

            await cls.sync_linked_incident_and_reports(
                db=db,
                incident_id=wo.incident_id,
                location=wo.location,
                latitude=wo.latitude,
                longitude=wo.longitude,
                assigned_ulb_name=wo.assigned_ulb_name,
                work_id=wo.work_id,
                target_status=wo.status or "Dispatched",
                now=now,
                notify=False,
            )

        await db.commit()

    @classmethod
    async def get_all_work_orders(cls, db: AsyncSession, supervisor_name: Optional[str] = None) -> List[WorkOrder]:
        """Fetch all active work orders ordered by creation time descending (excludes resolved)."""
        stmt = select(WorkOrder).where(func.lower(WorkOrder.status) != "resolved")
        if supervisor_name:
            clean_sup = supervisor_name.strip().lower()
            stmt = stmt.where(func.lower(WorkOrder.team_head_name).contains(clean_sup))
        stmt = stmt.order_by(WorkOrder.created_at.desc())
        result = await db.execute(stmt)
        orders = list(result.scalars().all())
        for wo in orders:
            wo.created_at = ensure_kolkata_tz(wo.created_at)
            wo.dispatched_at = ensure_kolkata_tz(wo.dispatched_at)
            if wo.started_at:
                wo.started_at = ensure_kolkata_tz(wo.started_at)
            if wo.resolved_at:
                wo.resolved_at = ensure_kolkata_tz(wo.resolved_at)
            wo.updated_at = ensure_kolkata_tz(wo.updated_at)
        return orders

    @classmethod
    async def get_work_order_by_id(cls, db: AsyncSession, work_id: str) -> Optional[WorkOrder]:
        """Fetch a single work order by its work_id or incident_id."""
        clean_id = str(work_id).strip()
        clean_inc = clean_id.replace("WO-", "").replace("#", "").strip()
        result = await db.execute(
            select(WorkOrder).where(
                or_(
                    WorkOrder.work_id == clean_id,
                    WorkOrder.work_id == f"WO-{clean_id}",
                    WorkOrder.work_id == f"WO-{clean_inc}",
                    WorkOrder.incident_id == clean_id,
                    WorkOrder.incident_id == clean_inc,
                    WorkOrder.incident_id == f"#{clean_inc}",
                    WorkOrder.incident_id == clean_inc.replace("-", ""),
                )
            )
        )
        wo = result.scalars().first()
        if wo:
            wo.created_at = ensure_kolkata_tz(wo.created_at)
            wo.dispatched_at = ensure_kolkata_tz(wo.dispatched_at)
            if wo.started_at:
                wo.started_at = ensure_kolkata_tz(wo.started_at)
            if wo.resolved_at:
                wo.resolved_at = ensure_kolkata_tz(wo.resolved_at)
            wo.updated_at = ensure_kolkata_tz(wo.updated_at)
            return wo

        # Fallback to historical_place for resolved work orders so lookup still succeeds
        hist_res = await db.execute(
            select(HistoricalPlace).where(
                or_(
                    HistoricalPlace.work_id == clean_id,
                    HistoricalPlace.work_id == f"WO-{clean_id}",
                    HistoricalPlace.work_id == f"WO-{clean_inc}",
                    HistoricalPlace.incident_id == clean_id,
                    HistoricalPlace.incident_id == clean_inc,
                    HistoricalPlace.incident_id == f"#{clean_inc}",
                    HistoricalPlace.incident_id == clean_inc.replace("-", ""),
                )
            )
        )
        hp = hist_res.scalars().first()
        if hp:
            synthetic_wo = WorkOrder(
                id=hp.id or 0,
                work_id=hp.work_id or f"WO-{hp.incident_id}",
                incident_id=hp.incident_id,
                location=hp.location,
                latitude=hp.latitude,
                longitude=hp.longitude,
                ward=hp.ward,
                assigned_ulb_id=hp.assigned_ulb_id,
                assigned_ulb_name=hp.assigned_ulb_name,
                jurisdiction_type=hp.jurisdiction_type,
                issue_type=hp.issue_type,
                water_depth=hp.water_depth,
                status=hp.status or "Resolved",
                admin_name=hp.admin_name,
                team_head_name=hp.team_head_name,
                original_image=hp.original_image,
                image_url=hp.image_url,
                reason=hp.reason,
                created_at=ensure_kolkata_tz(hp.created_at),
                resolved_at=ensure_kolkata_tz(hp.resolved_at),
                updated_at=ensure_kolkata_tz(hp.resolved_at),
            )
            return synthetic_wo

        return None

    @classmethod
    async def update_work_order_status(
        cls,
        db: AsyncSession,
        work_id: str,
        status: Optional[str] = None,
        reason: Optional[str] = None,
        image_url: Optional[str] = None,
    ) -> Optional[WorkOrder]:
        """Updates work order lifecycle status (e.g. Dispatched -> In Progress -> Resolved).
        When status becomes 'Resolved', details are recorded in both work_orders and historical_place tables,
        and the assigned supervisor is freed back to 'not occupied' in team_head table.
        """
        wo = await cls.get_work_order_by_id(db, work_id)
        if not wo:
            return None

        now = get_current_time()
        norm_status = (status or "").strip()
        if reason:
            wo.reason = reason
        if image_url:
            wo.image_url = image_url

        if norm_status.lower() == "resolved":
            clean_inc = str(wo.incident_id or "").replace("#", "").strip()
            work_order_id = f"WO-{clean_inc}"

            # Fetch linked incident from incident_queue to get its created_at
            inc_res = await db.execute(
                select(IncidentQueue).where(
                    or_(
                        IncidentQueue.incident_id == clean_inc,
                        IncidentQueue.incident_id == f"#{clean_inc}",
                        IncidentQueue.incident_id == clean_inc.replace("-", ""),
                        IncidentQueue.location == wo.location,
                    )
                )
            )
            linked_incidents = list(inc_res.scalars().all())
            inc_created_at = linked_incidents[0].created_at if (linked_incidents and linked_incidents[0].created_at) else (wo.created_at or now)
            wo_resolved_at = now

            # 1. Add to historical_place table with all required column data (avoid duplicate)
            hp_check = await db.execute(
                select(HistoricalPlace).where(
                    or_(
                        HistoricalPlace.work_id == work_order_id,
                        HistoricalPlace.incident_id == clean_inc,
                    )
                )
            )
            if not hp_check.scalars().first():
                hist_place = HistoricalPlace(
                    incident_id=clean_inc,
                    location=str(wo.location or ""),
                    latitude=float(wo.latitude or 0.0),
                    longitude=float(wo.longitude or 0.0),
                    issue_type=str(wo.issue_type or "Waterlogging"),
                    water_depth=float(wo.water_depth or 0.0),
                    work_id=work_order_id,
                    assigned_ulb_id=str(wo.assigned_ulb_id or ""),
                    assigned_ulb_name=str(wo.assigned_ulb_name or ""),
                    jurisdiction_type=str(wo.jurisdiction_type or ""),
                    ward=str(wo.ward or ""),
                    admin_name=str(wo.admin_name or ""),
                    team_head_name=str(wo.team_head_name or ""),
                    original_image=str(wo.original_image or ""),
                    image_url=str(wo.image_url or ""),
                    reason=str(wo.reason or "Resolved by Field Supervisor"),
                    status="Resolved",
                    created_at=inc_created_at,
                    resolved_at=wo_resolved_at,
                )
                db.add(hist_place)

            # 2. Free assigned supervisor in team_head table (status = 'not occupied')
            if wo.team_head_name:
                sup_q = await db.execute(
                    select(TeamHead).where(TeamHead.name == wo.team_head_name)
                )
                assigned_sup = sup_q.scalars().first()
                if assigned_sup:
                    assigned_sup.status = "not occupied"

            # 3. Update status of linked incident_queue and reports to 'Resolved'
            await cls.sync_linked_incident_and_reports(
                db=db,
                incident_id=clean_inc,
                location=wo.location,
                latitude=wo.latitude,
                longitude=wo.longitude,
                assigned_ulb_name=wo.assigned_ulb_name,
                work_id=work_order_id,
                target_status="Resolved",
                now=now,
            )

            # 4. Remove work order from work_orders table
            wo.status = "Resolved"
            wo.resolved_at = wo_resolved_at
            wo.updated_at = now
            # Delete from work_orders table
            if wo in db:
                await db.delete(wo)
            else:
                await db.execute(
                    delete(WorkOrder).where(
                        or_(
                            WorkOrder.work_id == wo.work_id,
                            WorkOrder.work_id == work_order_id,
                            WorkOrder.incident_id == clean_inc,
                        )
                    )
                )

            await db.commit()
            wo.created_at = ensure_kolkata_tz(wo.created_at)
            wo.dispatched_at = ensure_kolkata_tz(wo.dispatched_at)
            if wo.started_at:
                wo.started_at = ensure_kolkata_tz(wo.started_at)
            wo.resolved_at = ensure_kolkata_tz(wo.resolved_at)
            wo.updated_at = ensure_kolkata_tz(wo.updated_at)
            return wo

        # Otherwise update regular lifecycle status (e.g. In Progress)
        if norm_status:
            wo.status = norm_status

        if wo.status.lower() == "in progress" and not wo.started_at:
            wo.started_at = now

        wo.updated_at = now

        # Update linked incident_queue and reports to matching status
        await cls.sync_linked_incident_and_reports(
            db=db,
            incident_id=wo.incident_id,
            location=wo.location,
            latitude=wo.latitude,
            longitude=wo.longitude,
            assigned_ulb_name=wo.assigned_ulb_name,
            work_id=wo.work_id,
            target_status=norm_status,
            now=now,
        )

        await db.commit()
        await db.refresh(wo)
        wo.created_at = ensure_kolkata_tz(wo.created_at)
        wo.dispatched_at = ensure_kolkata_tz(wo.dispatched_at)
        if wo.started_at:
            wo.started_at = ensure_kolkata_tz(wo.started_at)
        if wo.resolved_at:
            wo.resolved_at = ensure_kolkata_tz(wo.resolved_at)
        wo.updated_at = ensure_kolkata_tz(wo.updated_at)
        return wo

    @classmethod
    async def get_dispatched_incident_ids(cls, db: AsyncSession) -> List[str]:
        """Returns list of incident_ids that have active work orders (excludes resolved)."""
        result = await db.execute(
            select(WorkOrder.incident_id).where(func.lower(WorkOrder.status) != "resolved")
        )
        ids = list(result.scalars().all())
        clean_ids = set()
        for i in ids:
            if i:
                c = str(i).replace("#", "").strip()
                clean_ids.add(c)
                clean_ids.add(f"#{c}")
        return list(clean_ids)

    @classmethod
    async def get_all_historical_places(cls, db: AsyncSession) -> List[HistoricalPlace]:
        """Fetch all historical resolved places from the historical_place table."""
        result = await db.execute(select(HistoricalPlace).order_by(HistoricalPlace.id.desc()))
        return list(result.scalars().all())

