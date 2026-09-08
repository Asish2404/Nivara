from fastapi import APIRouter
from .auth import router as auth_router
from .reports import router as reports_router

api_router = APIRouter()

# Register Auth & Officer Persona Routes
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & Officers"])

# Register Citizen Report Routes (user-scoped)
api_router.include_router(reports_router, tags=["Citizen Reports"])
