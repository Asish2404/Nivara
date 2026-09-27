from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.work_order import (
    WorkOrderCreate,
    WorkOrderResponse,
    WorkOrderStatusUpdate,
    SupervisorVerificationResponse,
    ResolveVerifiedRequest,
    ResolveWarningRequest,
)
from app.services.work_order_service import WorkOrderService

router = APIRouter()


@router.post(
    "/work-orders",
    response_model=WorkOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update work order with simulation intervention details",
)
@router.post(
    "/work_orders",
    response_model=WorkOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update work order with simulation intervention details (alias)",
)
async def create_work_order(
    data: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
):
    """Stores simulation intervention details into the `work_orders` table and pops the selected incident

    from the simulate hotspot dropdown queue.
    """
    work_order = await WorkOrderService.create_work_order(db, data)
    return WorkOrderResponse.model_validate(work_order)


@router.get(
    "/work-orders",
    response_model=List[WorkOrderResponse],
    summary="List all work orders in reverse chronological order",
)
@router.get(
    "/work_orders",
    response_model=List[WorkOrderResponse],
    summary="List all work orders in reverse chronological order (alias)",
)
async def list_work_orders(
    supervisor: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Fetch all work orders from `work_orders` table, optionally filtered by supervisor."""
    orders = await WorkOrderService.get_all_work_orders(db, supervisor_name=supervisor)
    return [WorkOrderResponse.model_validate(wo) for wo in orders]


@router.get(
    "/historical-places",
    summary="List all historical/resolved places",
)
@router.get(
    "/historical_places",
    summary="List all historical/resolved places (alias)",
)
async def list_historical_places(
    db: AsyncSession = Depends(get_db),
):
    """Fetch all historical resolved places from the historical_place table."""
    places = await WorkOrderService.get_all_historical_places(db)
    return [
        {
            "id": hp.id,
            "incident_id": hp.incident_id,
            "work_id": hp.work_id or (f"WO-{hp.incident_id}" if hp.incident_id else f"WO-HIST-{hp.id}"),
            "location": hp.location,
            "latitude": hp.latitude,
            "longitude": hp.longitude,
            "issue_type": hp.issue_type or "Waterlogging",
            "water_depth": hp.water_depth,
            "assigned_ulb_id": hp.assigned_ulb_id,
            "assigned_ulb_name": hp.assigned_ulb_name,
            "jurisdiction_type": hp.jurisdiction_type,
            "ward": hp.ward,
            "status": hp.status or "Resolved",
            "created_at": hp.created_at.isoformat() if hp.created_at else None,
            "resolved_at": hp.resolved_at.isoformat() if hp.resolved_at else None,
        }
        for hp in places
    ]


@router.get(
    "/work-orders/dispatched-ids",
    response_model=List[str],
    summary="Get list of all dispatched incident IDs",
)
@router.get(
    "/work_orders/dispatched-ids",
    response_model=List[str],
    summary="Get list of all dispatched incident IDs (alias)",
)
async def get_dispatched_incident_ids(
    db: AsyncSession = Depends(get_db),
):
    """Returns all incident IDs that have been dispatched into work orders."""
    return await WorkOrderService.get_dispatched_incident_ids(db)


@router.get(
    "/work-orders/{work_id}",
    response_model=WorkOrderResponse,
    summary="Get details of a single work order",
)
@router.get(
    "/work_orders/{work_id}",
    response_model=WorkOrderResponse,
    summary="Get details of a single work order (alias)",
)
async def get_work_order(
    work_id: str,
    db: AsyncSession = Depends(get_db),
):
    wo = await WorkOrderService.get_work_order_by_id(db, work_id)
    if not wo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order '{work_id}' not found.",
        )
    return WorkOrderResponse.model_validate(wo)


@router.patch(
    "/work-orders/{work_id}/status",
    response_model=WorkOrderResponse,
    summary="Update work order status and stage",
)
@router.patch(
    "/work_orders/{work_id}/status",
    response_model=WorkOrderResponse,
    summary="Update work order status and stage (alias)",
)
async def update_work_order_status(
    work_id: str,
    payload: WorkOrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    # Rule 1 & Rule 15: Disallow direct change to Resolved without verification gate
    if payload.status and payload.status.strip().lower() == "resolved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Work order cannot be directly updated to Resolved. Complete supervisor verification gate is required.",
        )

    wo = await WorkOrderService.update_work_order_status(
        db,
        work_id,
        status=payload.status,
        reason=payload.reason,
        image_url=payload.image_url,
    )
    if not wo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order '{work_id}' not found.",
        )
    return WorkOrderResponse.model_validate(wo)


@router.post(
    "/work-orders/{work_id}/verify",
    response_model=SupervisorVerificationResponse,
    summary="Run complete 6-stage supervisor verification pipeline on work order resolution photo",
)
@router.post(
    "/work_orders/{work_id}/verify",
    response_model=SupervisorVerificationResponse,
    summary="Run complete 6-stage supervisor verification pipeline on work order resolution photo (alias)",
)
async def verify_work_order_completion(
    work_id: str,
    image: UploadFile = File(...),
    client_lat: Optional[float] = Form(None),
    client_lon: Optional[float] = Form(None),
    client_timestamp: Optional[str] = Form(None),
    gps_tolerance_meters: Optional[float] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Executes the complete verification gate:
    1. Image validation & relevance
    2. EXIF / OCR GPS & Timestamp extraction
    3. GPS verification (<= tolerance)
    4. Timestamp verification (> work_orders.created_at)
    5. MobileNetV2 surface / depth analysis
    6. Water level comparison (ACCEPTED, WARNING, REJECTED)
    DOES NOT modify database.
    """
    wo = await WorkOrderService.get_work_order_by_id(db, work_id)
    if not wo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order '{work_id}' not found.",
        )

    from app.services.supervisor_verification_service import SupervisorVerificationService
    image_bytes = await image.read()
    verification = SupervisorVerificationService.verify_work_order_completion(
        work_order=wo,
        image_input=image_bytes,
        client_lat=client_lat,
        client_lon=client_lon,
        client_timestamp=client_timestamp,
        gps_tolerance_meters=gps_tolerance_meters,
    )
    return SupervisorVerificationResponse(**verification)


@router.post(
    "/work-orders/{work_id}/resolve-verified",
    response_model=WorkOrderResponse,
    summary="Confirm resolution after verification gate has passed with ACCEPTED",
)
@router.post(
    "/work_orders/{work_id}/resolve-verified",
    response_model=WorkOrderResponse,
    summary="Confirm resolution after verification gate has passed with ACCEPTED (alias)",
)
async def resolve_verified_work_order(
    work_id: str,
    payload: ResolveVerifiedRequest,
    db: AsyncSession = Depends(get_db),
):
    """Updates work order to RESOLVED ONLY AFTER verification succeeds."""
    wo = await WorkOrderService.update_work_order_status(
        db,
        work_id,
        status="Resolved",
        reason=payload.reason or "Waterlogging cleared & verified via Supervisor Verification Gate",
        image_url=payload.image_url,
    )
    if not wo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order '{work_id}' not found.",
        )
    return WorkOrderResponse.model_validate(wo)


@router.post(
    "/work-orders/{work_id}/resolve-warning",
    response_model=WorkOrderResponse,
    summary="Submit mandatory supervisor reason when verification warning is triggered (sets status to Incomplete)",
)
@router.post(
    "/work_orders/{work_id}/resolve-warning",
    response_model=WorkOrderResponse,
    summary="Submit mandatory supervisor reason when verification warning is triggered (alias)",
)
async def submit_warning_incomplete(
    work_id: str,
    payload: ResolveWarningRequest,
    db: AsyncSession = Depends(get_db),
):
    """When detected level >= work-order level, supervisor enters required reason and status becomes Incomplete.
    NEVER sets work order to RESOLVED.
    """
    if not payload.reason or not payload.reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mandatory reason must be provided to submit verification warning.",
        )

    wo = await WorkOrderService.update_work_order_status(
        db,
        work_id,
        status="Incomplete",
        reason=f"[VERIFICATION WARNING] {payload.reason.strip()}",
        image_url=payload.image_url,
    )
    if not wo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order '{work_id}' not found.",
        )
    return WorkOrderResponse.model_validate(wo)

