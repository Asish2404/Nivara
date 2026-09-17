import asyncio
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import init_db, async_session, engine
from app.models.user import User
from app.models.report import Report
from app.models.incident_queue import IncidentQueue
from app.services.incident_service import IncidentQueueService
from app.services.report_service import ReportService
from app.schemas.report import ReportCreate
from sqlalchemy import select, delete


async def test_incident_queue():
    print("=== [TEST 1] Initializing DB & Verifying incident_queue table ===")
    await init_db()

    async with async_session() as db:
        # Create test user
        user_res = await db.execute(select(User).where(User.email == "citizen.test@kolkata.org"))
        user = user_res.scalars().first()
        if not user:
            user = User(
                id="test-user-123",
                name="Citizen Test",
                email="citizen.test@kolkata.org",
                hashed_password="hash",
                status="active"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # Clear any prior test entries for isolated verification
        await db.execute(delete(Report).where(Report.user_id == user.id))
        await db.execute(delete(IncidentQueue))
        await db.commit()

        print("\n=== [TEST 2] Submitting Report 1 (Salt Lake, Sector V) -> New row ===")
        rep1_data = ReportCreate(
            location="Salt Lake, Sector V, Kolkata",
            latitude=22.5735,
            longitude=88.4331,
            issueType="Waterlogging",
            description="Severe street waterlogging near SDF building",
            waterDepth=25.0
        )
        rep1 = await ReportService.create_report(db, user, rep1_data, None)
        print(f"Created Report 1: {rep1.report_id} at {rep1.location}")

        # Check incident_queue
        inc_res = await db.execute(select(IncidentQueue))
        incidents = list(inc_res.scalars().all())
        assert len(incidents) == 1, f"Expected 1 incident row, found {len(incidents)}"
        inc1 = incidents[0]
        print(f"Incident Queue Row: ID={inc1.incident_id}, Location='{inc1.location}', Count={inc1.report_count}, Depth={inc1.water_depth}cm, Severity={inc1.severity}")
        assert inc1.report_count == 1, "Report count should be 1"
        assert "Salt Lake" in inc1.location
        assert inc1.severity in ["MODERATE", "HIGH", "CRITICAL"], f"Unexpected severity {inc1.severity}"

        print("\n=== [TEST 3] Submitting Report 2 for SAME Area (Salt Lake, Sector V) -> Increment count ===")
        rep2_data = ReportCreate(
            location="Salt Lake, Sector V, Kolkata",
            latitude=22.5735,
            longitude=88.4331,
            issueType="Waterlogging",
            description="Water level increasing past footpath",
            waterDepth=30.0
        )
        rep2 = await ReportService.create_report(db, user, rep2_data, None)
        print(f"Created Report 2: {rep2.report_id} at {rep2.location}")

        # Check incident_queue - should still be 1 row, but count = 2
        inc_res2 = await db.execute(select(IncidentQueue))
        incidents2 = list(inc_res2.scalars().all())
        assert len(incidents2) == 1, f"Expected still 1 incident row, found {len(incidents2)}"
        inc1_updated = incidents2[0]
        print(f"Incident Queue Row (Updated): ID={inc1_updated.incident_id}, Location='{inc1_updated.location}', Count={inc1_updated.report_count}, Depth={inc1_updated.water_depth}cm, Severity={inc1_updated.severity}")
        assert inc1_updated.report_count == 2, f"Expected report_count == 2, got {inc1_updated.report_count}"
        assert inc1_updated.water_depth == 30.0, f"Expected water_depth == 30.0, got {inc1_updated.water_depth}"

        print("\n=== [TEST 4] Submitting Report 3 for DIFFERENT Area (College More) -> New row ===")
        rep3_data = ReportCreate(
            location="College More, Sector V, Ward 32 (Bidhannagar)",
            latitude=22.5726,
            longitude=88.4320,
            issueType="Waterlogging",
            description="Traffic blocked due to water near College More",
            waterDepth=20.0
        )
        rep3 = await ReportService.create_report(db, user, rep3_data, None)
        print(f"Created Report 3: {rep3.report_id} at {rep3.location}")

        # Check incident_queue - should now be 2 rows
        inc_res3 = await db.execute(select(IncidentQueue))
        incidents3 = list(inc_res3.scalars().all())
        assert len(incidents3) == 2, f"Expected 2 incident rows, found {len(incidents3)}"
        print(f"Total Incident Queue Rows: {len(incidents3)}")
        for inc in incidents3:
            print(f"  - #{inc.incident_id} | {inc.location} | count: {inc.report_count} | {inc.water_depth}cm | {inc.severity}")

        print("\n=== [TEST 5] Fetching Active Incidents via IncidentQueueService.get_active_incidents ===")
        active_list = await IncidentQueueService.get_active_incidents(db)
        assert len(active_list) == 2
        # Salt Lake with 2 reports should be first due to higher count/severity
        assert active_list[0].report_count >= active_list[1].report_count
        print(f"[OK] Active incidents returned {len(active_list)} cards, top card: #{active_list[0].incident_id} ({active_list[0].location}) with {active_list[0].report_count} reports")

    print("\nALL INCIDENT QUEUE TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(test_incident_queue())
