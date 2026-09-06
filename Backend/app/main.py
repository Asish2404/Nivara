from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import init_db, async_session
from .api.v1.api import api_router
from .services.auth_service import AuthService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables & seed default official demo personas
    await init_db()
    async with async_session() as db:
        await AuthService.seed_default_users(db)
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Kolkata Water Intelligence (KWI) Asynchronous Municipal Command Engine.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

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
    }
