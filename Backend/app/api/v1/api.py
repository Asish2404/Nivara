from fastapi import APIRouter
from .auth import router as auth_router
from .reports import router as reports_router
from .waterlogging import router as waterlogging_router
from .work_orders import router as work_orders_router

api_router = APIRouter()

# Register Auth & Officer Persona Routes
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & Officers"])

# Register Citizen Report Routes (user-scoped)
api_router.include_router(reports_router, tags=["Citizen Reports"])

# Register Waterlogging Intelligence Routes
api_router.include_router(waterlogging_router, prefix="/waterlogging", tags=["Waterlogging Intelligence"])

# Register Work Orders & Simulation Intervention Routes
api_router.include_router(work_orders_router, tags=["Work Orders"])
