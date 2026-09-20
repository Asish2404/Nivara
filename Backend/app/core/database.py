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


# 5. Startup table initializer with safe schema migration for SQLite
async def init_db() -> None:
    # Import models so Base.metadata knows about users, admin, reports, waterlogging predictions, incident_queue, work_orders, and historical_place
    from app.models import User, Admin, Report, WaterloggingPrediction, IncidentQueue, WorkOrder, HistoricalPlace  # noqa: F401
    from app.services.incident_service import IncidentQueueService

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


        def sync_migrate(connection):
            from sqlalchemy import inspect, text
            inspector = inspect(connection)
            table_names = inspector.get_table_names()

            # Ensure 'status' column exists in waterlogging_predictions
            if "waterlogging_predictions" in table_names:
                wlp_cols = {col["name"] for col in inspector.get_columns("waterlogging_predictions")}
                if "status" not in wlp_cols:
                    connection.execute(text("ALTER TABLE waterlogging_predictions ADD COLUMN status VARCHAR(32) DEFAULT 'ACTIVE'"))

            # Migrate / clean 'users' table to have exact requested columns:
            # id, name, email, hashed_password, phone, role, clearance, status, created_at, location
            if "users" in table_names:
                existing_cols = {col["name"] for col in inspector.get_columns("users")}
                if "department" in existing_cols or "bio" in existing_cols or "avatar_url" in existing_cols:
                    name_expr = "COALESCE(name, full_name, '')" if ("name" in existing_cols and "full_name" in existing_cols) else ("full_name" if "full_name" in existing_cols else "name")
                    status_expr = "COALESCE(status, 'not active')" if "status" in existing_cols else "'not active'"
                    phone_expr = "phone" if "phone" in existing_cols else "NULL"
                    role_expr = "COALESCE(role, 'Citizen')" if "role" in existing_cols else "'Citizen'"
                    clearance_expr = "COALESCE(clearance, 'Citizen Access')" if "clearance" in existing_cols else "'Citizen Access'"
                    location_expr = "location" if "location" in existing_cols else "NULL"
                    created_at_expr = "created_at" if "created_at" in existing_cols else "datetime('now')"

                    connection.execute(text("""
                        CREATE TABLE users_migrated (
                            id VARCHAR(64) PRIMARY KEY,
                            name VARCHAR(128) NOT NULL,
                            email VARCHAR(128) UNIQUE NOT NULL,
                            hashed_password VARCHAR(255) NOT NULL,
                            phone VARCHAR(32),
                            role VARCHAR(64) DEFAULT 'Citizen',
                            clearance VARCHAR(64) DEFAULT 'Citizen Access',
                            status VARCHAR(32) DEFAULT 'not active',
                            created_at DATETIME,
                            location VARCHAR(128)
                        )
                    """))
                    connection.execute(text(f"""
                        INSERT OR IGNORE INTO users_migrated (id, name, email, hashed_password, phone, role, clearance, status, created_at, location)
                        SELECT id, {name_expr}, email, hashed_password, {phone_expr}, {role_expr}, {clearance_expr}, {status_expr}, {created_at_expr}, {location_expr}
                        FROM users
                    """))
                    connection.execute(text("DROP TABLE users"))
                    connection.execute(text("ALTER TABLE users_migrated RENAME TO users"))
                else:
                    # Add any missing columns
                    if "status" not in existing_cols:
                        connection.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(32) DEFAULT 'not active'"))
                    if "location" not in existing_cols:
                        connection.execute(text("ALTER TABLE users ADD COLUMN location VARCHAR(128)"))
                    if "phone" not in existing_cols:
                        connection.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(32)"))
                    if "auth_provider" not in existing_cols:
                        connection.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(32) DEFAULT 'local'"))
                    if "google_id" not in existing_cols:
                        connection.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR(128)"))

            # Migrate / ensure 'admin' table has exact requested columns:
            # id, badge_id, name, email, hashed_password, phone, role, department, clearance, status, created_at, location
            if "admin" in table_names:
                existing_admin_cols = {col["name"] for col in inspector.get_columns("admin")}
                missing_admin_columns = {
                    "badge_id": "VARCHAR(64) DEFAULT ''",
                    "name": "VARCHAR(128) DEFAULT ''",
                    "department": "VARCHAR(128) DEFAULT 'KMC Sewerage & Drainage Directorate'",
                    "clearance": "VARCHAR(64) DEFAULT 'Level 3 // Admin Clearance'",
                    "status": "VARCHAR(32) DEFAULT 'not active'",
                    "phone": "VARCHAR(32)",
                    "location": "VARCHAR(128)",
                    "auth_provider": "VARCHAR(32) DEFAULT 'local'",
                    "google_id": "VARCHAR(128)",
                }
                for col_name, col_type in missing_admin_columns.items():
                    if col_name not in existing_admin_cols:
                        connection.execute(text(f"ALTER TABLE admin ADD COLUMN {col_name} {col_type}"))

            if "reports" in table_names:
                existing_report_cols = {col["name"] for col in inspector.get_columns("reports")}
                missing_report_columns = {
                    "location_source": "VARCHAR(32) DEFAULT 'coordinates'",
                    "assigned_ulb_id": "VARCHAR(64) DEFAULT ''",
                    "assigned_ulb_name": "VARCHAR(128) DEFAULT ''",
                    "jurisdiction_type": "VARCHAR(64) DEFAULT ''",
                    "ward": "VARCHAR(32) DEFAULT ''",
                }
                for col_name, col_type in missing_report_columns.items():
                    if col_name not in existing_report_cols:
                        connection.execute(text(f"ALTER TABLE reports ADD COLUMN {col_name} {col_type}"))

            if "incident_queue" in table_names:
                existing_inc_cols = {col["name"] for col in inspector.get_columns("incident_queue")}
                if "reports_number" in existing_inc_cols:
                    connection.execute(text("""
                        CREATE TABLE incident_queue_migrated (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            incident_id VARCHAR(32) NOT NULL,
                            location VARCHAR(255) NOT NULL,
                            latitude FLOAT DEFAULT 0.0,
                            longitude FLOAT DEFAULT 0.0,
                            ward VARCHAR(64) DEFAULT '',
                            assigned_ulb_id VARCHAR(64) DEFAULT '',
                            assigned_ulb_name VARCHAR(128) DEFAULT '',
                            jurisdiction_type VARCHAR(64) DEFAULT '',
                            subdivision VARCHAR(255) DEFAULT '',
                            issue_type VARCHAR(128) DEFAULT 'Waterlogging',
                            water_depth FLOAT DEFAULT 0.0,
                            report_count INTEGER DEFAULT 1,
                            risk_level VARCHAR(32) DEFAULT 'LOW',
                            status VARCHAR(32) DEFAULT 'Needs Intervention',
                            latest_description TEXT DEFAULT '',
                            latest_image_url VARCHAR(255) DEFAULT '',
                            latest_report_id VARCHAR(64) DEFAULT '',
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            last_reported_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    rep_cnt = "COALESCE(report_count, reports_number, 1)" if "report_count" in existing_inc_cols else "COALESCE(reports_number, 1)"
                    r_lvl = "COALESCE(risk_level, severity, 'LOW')" if "severity" in existing_inc_cols else "COALESCE(risk_level, 'LOW')"
                    connection.execute(text(f"""
                        INSERT OR IGNORE INTO incident_queue_migrated (id, incident_id, location, latitude, longitude, ward, assigned_ulb_id, assigned_ulb_name, jurisdiction_type, subdivision, issue_type, water_depth, report_count, risk_level, status, latest_description, latest_image_url, latest_report_id, created_at, updated_at, last_reported_at)
                        SELECT id, incident_id, location, latitude, longitude, COALESCE(ward, ''), COALESCE(assigned_ulb_id, ''), COALESCE(assigned_ulb_name, ''), COALESCE(jurisdiction_type, ''), COALESCE(subdivision, ''), COALESCE(issue_type, 'Waterlogging'), COALESCE(water_depth, 0.0), {rep_cnt}, {r_lvl}, COALESCE(status, 'Needs Intervention'), COALESCE(latest_description, ''), COALESCE(latest_image_url, ''), COALESCE(latest_report_id, ''), created_at, updated_at, COALESCE(last_reported_at, updated_at, created_at)
                        FROM incident_queue
                    """))
                    connection.execute(text("DROP TABLE incident_queue"))
                    connection.execute(text("ALTER TABLE incident_queue_migrated RENAME TO incident_queue"))
                else:
                    missing_inc_columns = {
                        "incident_id": "VARCHAR(32) DEFAULT ''",
                        "location": "VARCHAR(255) DEFAULT ''",
                        "latitude": "FLOAT DEFAULT 0.0",
                        "longitude": "FLOAT DEFAULT 0.0",
                        "ward": "VARCHAR(64) DEFAULT ''",
                        "assigned_ulb_id": "VARCHAR(64) DEFAULT ''",
                        "assigned_ulb_name": "VARCHAR(128) DEFAULT ''",
                        "jurisdiction_type": "VARCHAR(64) DEFAULT ''",
                        "subdivision": "VARCHAR(255) DEFAULT ''",
                        "issue_type": "VARCHAR(128) DEFAULT 'Waterlogging'",
                        "water_depth": "FLOAT DEFAULT 0.0",
                        "report_count": "INTEGER DEFAULT 1",
                        "risk_level": "VARCHAR(32) DEFAULT 'LOW'",
                        "status": "VARCHAR(32) DEFAULT 'Needs Intervention'",
                        "latest_description": "TEXT DEFAULT ''",
                        "latest_image_url": "VARCHAR(255) DEFAULT ''",
                        "latest_report_id": "VARCHAR(64) DEFAULT ''",
                        "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP",
                        "updated_at": "DATETIME DEFAULT CURRENT_TIMESTAMP",
                        "last_reported_at": "DATETIME DEFAULT CURRENT_TIMESTAMP",
                    }
                    for col_name, col_type in missing_inc_columns.items():
                        if col_name not in existing_inc_cols:
                            connection.execute(text(f"ALTER TABLE incident_queue ADD COLUMN {col_name} {col_type}"))

            if "work_orders" in table_names:
                existing_wo_cols = {col["name"] for col in inspector.get_columns("work_orders")}
                unwanted_cols = {"stage", "equipment", "eta", "expected_impact", "assigned_node", "trigger_reason", "simulation_outcome", "assigned_crew", "chief", "radio", "expected_action"}
                if existing_wo_cols.intersection(unwanted_cols):
                    # Cleanly rebuild table with exact requested columns only
                    connection.execute(text("""
                        CREATE TABLE work_orders_clean (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            work_id VARCHAR(64) UNIQUE NOT NULL,
                            incident_id VARCHAR(32) NOT NULL,
                            location VARCHAR(255) NOT NULL,
                            latitude FLOAT DEFAULT 0.0,
                            longitude FLOAT DEFAULT 0.0,
                            ward VARCHAR(64) DEFAULT '',
                            assigned_ulb_id VARCHAR(64) DEFAULT '',
                            assigned_ulb_name VARCHAR(128) DEFAULT '',
                            jurisdiction_type VARCHAR(64) DEFAULT '',
                            issue_type VARCHAR(128) DEFAULT 'Waterlogging',
                            risk_level VARCHAR(32) DEFAULT 'LOW',
                            water_depth FLOAT DEFAULT 0.0,
                            reports_number INTEGER DEFAULT 1,
                            intervention_type VARCHAR(255) DEFAULT '',
                            status VARCHAR(32) DEFAULT 'Dispatched',
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            dispatched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            started_at DATETIME,
                            resolved_at DATETIME,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    # Copy over data from existing table
                    connection.execute(text("""
                        INSERT OR IGNORE INTO work_orders_clean (
                            id, work_id, incident_id, location, latitude, longitude,
                            ward, assigned_ulb_id, assigned_ulb_name, jurisdiction_type,
                            issue_type, risk_level, water_depth, reports_number,
                            intervention_type, status, created_at, dispatched_at,
                            started_at, resolved_at, updated_at
                        )
                        SELECT 
                            id, work_id, incident_id, location, latitude, longitude,
                            ward, assigned_ulb_id, assigned_ulb_name, jurisdiction_type,
                            issue_type, risk_level, water_depth, reports_number,
                            intervention_type, status, created_at, dispatched_at,
                            started_at, resolved_at, updated_at
                        FROM work_orders
                    """))
                    connection.execute(text("DROP TABLE work_orders"))
                    connection.execute(text("ALTER TABLE work_orders_clean RENAME TO work_orders"))
                else:
                    # Add any missing standard columns if not present
                    missing_wo_columns = {
                        "intervention_type": "VARCHAR(255) DEFAULT ''",
                        "status": "VARCHAR(32) DEFAULT 'Dispatched'",
                        "dispatched_at": "DATETIME DEFAULT CURRENT_TIMESTAMP",
                        "started_at": "DATETIME",
                        "resolved_at": "DATETIME",
                        "updated_at": "DATETIME DEFAULT CURRENT_TIMESTAMP",
                    }
                    for col_name, col_type in missing_wo_columns.items():
                        if col_name not in existing_wo_cols:
                            connection.execute(text(f"ALTER TABLE work_orders ADD COLUMN {col_name} {col_type}"))

            if "historical_place" in table_names:
                existing_hp_cols = {col["name"] for col in inspector.get_columns("historical_place")}
                if "created_at" not in existing_hp_cols:
                    connection.execute(text("ALTER TABLE historical_place ADD COLUMN created_at DATETIME"))
                if "resolved_at" not in existing_hp_cols:
                    connection.execute(text("ALTER TABLE historical_place ADD COLUMN resolved_at DATETIME"))

        await conn.run_sync(sync_migrate)



    # Initial sync from reports to incident_queue if queue is empty
    try:
        async with async_session() as session:
            await IncidentQueueService.sync_from_existing_reports(session)
    except Exception as e:
        # Non-fatal if table is newly initializing
        pass

