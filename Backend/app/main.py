import asyncio
import logging
from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db, async_session
from app.api.v1.api import api_router
from app.services.auth_service import AuthService
from app.services.report_service import UPLOAD_DIR
from app.services.waterlogging_service import WaterloggingService

from app.core.datetime_utils import get_kolkata_tz
from datetime import datetime

logger = logging.getLogger("app.main")


async def run_periodic_prediction_scheduler():
    """Background task executing the calendar-anchored waterlogging prediction update.
    Schedule: 02:00, 10:00, 18:00 (local IST time, every day).
    On startup, it warms up cache from the database WITHOUT inserting new data unless empty.
    """
    # Brief initial pause to let the server finish startup before checking DB
    try:
        await asyncio.sleep(2.0)
        async with async_session() as db:
            loaded = await WaterloggingService.load_latest_from_db(db)
            if not loaded:
                logger.info("Database has no waterlogging predictions yet. Generating initial baseline snapshot...")
                await WaterloggingService.run_prediction_cycle(db=db, force_weather_refresh=False)
            else:
                logger.info("Startup initialized with latest predictions from database. No new insertion performed.")
    except asyncio.CancelledError:
        return
    except Exception as exc:
        logger.warning("Initial background waterlogging cache load notice: %s", exc)

    while True:
        try:
            tz = get_kolkata_tz()
            now = datetime.now(tz)
            next_auto = WaterloggingService.calculate_next_auto_ts(now)
            wait_seconds = max(1.0, (next_auto - now).total_seconds())

            logger.info(
                "Calendar-anchored prediction scheduled for %s (in %.1f sec / %.2f hours)",
                next_auto.strftime("%Y-%m-%d %H:%M:%S %Z"),
                wait_seconds,
                wait_seconds / 3600,
            )

            await asyncio.sleep(wait_seconds)
            logger.info("Firing calendar-anchored auto prediction cycle (02:00 / 10:00 / 18:00 IST)...")
            await WaterloggingService.run_auto_prediction_cycle()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Periodic calendar prediction error: %s", exc)
            await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and execute safe migrations
    await init_db()

    # Start calendar-anchored background prediction scheduler (02:00, 10:00, 18:00)
    scheduler_task = asyncio.create_task(run_periodic_prediction_scheduler())
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
