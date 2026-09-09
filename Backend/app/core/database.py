from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from .config import settings

# 1. Create the asynchronous database engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

# 2. Async session factory
async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


# 3. Base class for all SQLAlchemy ORM models
class Base(DeclarativeBase):
    pass


# 4. Dependency for FastAPI route handlers
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


# 5. Startup table initializer with safe column migration for SQLite
async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def sync_migrate(connection):
            from sqlalchemy import inspect, text
            inspector = inspect(connection)
            table_names = inspector.get_table_names()
            if "users" in table_names:
                existing_cols = {col["name"] for col in inspector.get_columns("users")}
                missing_columns = {
                    "avatar_url": "TEXT",
                    "phone": "VARCHAR(32)",
                    "location": "VARCHAR(128)",
                    "bio": "TEXT",
                }
                for col_name, col_type in missing_columns.items():
                    if col_name not in existing_cols:
                        connection.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))

            if "reports" in table_names:
                existing_cols = {col["name"] for col in inspector.get_columns("reports")}
                missing_report_columns = {
                    "location_source": "VARCHAR(32) DEFAULT 'coordinates'",
                    "assigned_ulb_id": "VARCHAR(64) DEFAULT ''",
                    "assigned_ulb_name": "VARCHAR(128) DEFAULT ''",
                    "jurisdiction_type": "VARCHAR(64) DEFAULT ''",
                    "ward": "VARCHAR(32) DEFAULT ''",
                }
                for col_name, col_type in missing_report_columns.items():
                    if col_name not in existing_cols:
                        connection.execute(text(f"ALTER TABLE reports ADD COLUMN {col_name} {col_type}"))

        await conn.run_sync(sync_migrate)

