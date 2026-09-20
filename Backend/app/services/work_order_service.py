from datetime import datetime
from typing import List, Optional, Union
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.work_order import WorkOrder
from ..models.incident_queue import IncidentQueue
from ..models.historical_place import HistoricalPlace
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

    @classmethod
    async def sync_all_database_statuses(cls, db: AsyncSession) -> None:
        """One-pass reconciliation ensuring historical_place and active work_orders statuses
        are properly mirrored into incident_queue and reports tables.
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
            )

        # 2. Sync from active work_orders (e.g. In Progress, Dispatched)
        wo_res = await db.execute(select(WorkOrder))
        for wo in wo_res.scalars().all():
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
            )

        await db.commit()

    @classmethod
    async def get_all_work_orders(cls, db: AsyncSession) -> List[WorkOrder]:
        """Fetch all work orders ordered by creation time descending."""
        result = await db.execute(
            select(WorkOrder).order_by(WorkOrder.created_at.desc())
        )
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

    @classmethod
    async def update_work_order_status(
        cls, db: AsyncSession, work_id: str, status: Optional[str] = None
    ) -> Optional[Union[WorkOrder, dict]]:
        """Updates work order lifecycle status (e.g. Dispatched -> In Progress -> Resolved).
        When status becomes 'Resolved', the incident is removed from the work_orders table
        and added to the historical_place table with all required column data.
        """
        wo = await cls.get_work_order_by_id(db, work_id)
        if not wo:
            return None

        now = get_current_time()
        norm_status = (status or "").strip()

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
            wo_resolved_at = wo.resolved_at or now

            # 1. Add to historical_place table with all required column data (created_at from incident_queue, resolved_at from work_orders)
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
                status="Resolved",
                created_at=inc_created_at,
                resolved_at=wo_resolved_at,
            )
            db.add(hist_place)

            # 2. Update status of linked incident_queue and reports to 'Resolved'
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

            # Snapshot data for response before removing from work_orders
            resolved_dict = {
                "id": wo.id,
                "work_id": work_order_id,
                "incident_id": clean_inc,
                "location": wo.location,
                "latitude": wo.latitude,
                "longitude": wo.longitude,
                "ward": wo.ward,
                "assigned_ulb_id": wo.assigned_ulb_id,
                "assigned_ulb_name": wo.assigned_ulb_name,
                "jurisdiction_type": wo.jurisdiction_type,
                "issue_type": wo.issue_type,
                "risk_level": wo.risk_level,
                "water_depth": wo.water_depth,
                "reports_number": wo.reports_number,
                "intervention_type": wo.intervention_type,
                "status": "Resolved",
                "created_at": ensure_kolkata_tz(wo.created_at),
                "dispatched_at": ensure_kolkata_tz(wo.dispatched_at),
                "started_at": ensure_kolkata_tz(wo.started_at or now),
                "resolved_at": ensure_kolkata_tz(now),
                "updated_at": ensure_kolkata_tz(now),
            }

            # 3. Remove incident from work_orders table
            await db.delete(wo)
            await db.commit()

            return resolved_dict

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
        return wo

    @classmethod
    async def get_dispatched_incident_ids(cls, db: AsyncSession) -> List[str]:
        """Returns list of incident_ids that have active or completed work orders."""
        result = await db.execute(select(WorkOrder.incident_id))
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

