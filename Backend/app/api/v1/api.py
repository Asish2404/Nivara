from fastapi import APIRouter
from .auth import router as auth_router

api_router = APIRouter()

# Register Auth & Officer Persona Routes
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & Officers"])
