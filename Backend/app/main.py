import asyncio
import logging
from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import settings
from .core.database import init_db, async_session
from .api.v1.api import api_router
from .services.auth_service import AuthService
from .services.report_service import UPLOAD_DIR
from .services.waterlogging_service import WaterloggingService

logger = logging.getLogger("app.main")


async def run_periodic_prediction_scheduler(interval_hours: int = 8):
    """Background task executing the waterlogging prediction cycle periodically every 8 hours."""
    # Brief initial pause to let the server finish startup before first run
    try:
        await asyncio.sleep(2.0)
        async with async_session() as db:
            await WaterloggingService.run_prediction_cycle(db=db, force_weather_refresh=False)
    except asyncio.CancelledError:
        return
    except Exception as exc:
        logger.warning("Initial background waterlogging cycle notice: %s", exc)

    while True:
        try:
            await asyncio.sleep(interval_hours * 3600)
            async with async_session() as db:
                await WaterloggingService.run_prediction_cycle(db=db, force_weather_refresh=True)
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Periodic waterlogging prediction error: %s", exc)
            await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    await init_db()

    # Start 8-hour background prediction scheduler
    scheduler_task = asyncio.create_task(run_periodic_prediction_scheduler(interval_hours=8))
    yield
    # Shutdown logic: cancel background task cleanly
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Kolkata Water Intelligence (KWI) Asynchronous Municipal Command Engine.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Matches the report upload directory (services/report_service.py)
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR, check_dir=False), name="uploads")

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all v1 API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", summary="API Root Status")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "OPERATIONAL",
        "docs": "/docs",
        "auth_endpoints": {
            "login": f"{settings.API_V1_STR}/auth/login",
            "signup": f"{settings.API_V1_STR}/auth/signup",
            "profile": f"{settings.API_V1_STR}/auth/me",
        },
        "waterlogging_endpoints": {
            "predictions": f"{settings.API_V1_STR}/waterlogging/predictions",
            "summary": f"{settings.API_V1_STR}/waterlogging/summary",
            "refresh": f"{settings.API_V1_STR}/waterlogging/refresh",
        },
    }
