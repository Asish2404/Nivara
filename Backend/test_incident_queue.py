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
from app.core.datetime_utils import get_current_time
from sqlalchemy import select, delete


async def test_incident_queue():
    print("=== [TEST 1] Initializing DB & Verifying incident_queue table ===")
    await init_db()

    # Unit tests for calculate_most_frequent_water_depth
    from app.services.incident_service import calculate_most_frequent_water_depth
    print("\n=== [TEST 0] Unit Tests for calculate_most_frequent_water_depth ===")
    assert calculate_most_frequent_water_depth([30, 15, 0, 30]) == 30.0
    assert calculate_most_frequent_water_depth([30, 15, 0, 30, 15]) == 30.0  # Tie-breaker: max(30, 15) == 30.0
    assert calculate_most_frequent_water_depth([30, 15, 0, 30, 15, 15]) == 15.0  # 15 comes 3 times
    assert calculate_most_frequent_water_depth([0, 0, 0]) == 0.0
    assert calculate_most_frequent_water_depth([25.0]) == 25.0
    print("[OK] All calculate_most_frequent_water_depth unit tests passed!")

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

        # Clear prior test reports for isolated verification
        await db.execute(delete(Report).where(Report.user_id == user.id))
        await db.execute(delete(IncidentQueue).where(IncidentQueue.location.like("Test %")))
        await db.commit()

        test_loc1 = "Test Sector V Alpha, Kolkata"
        test_loc2 = "Test College More Beta, Kolkata"

        print(f"\n=== [TEST 2] Submitting Report 1 ({test_loc1}) -> New row ===")
        rep1_data = ReportCreate(
            location=test_loc1,
            latitude=22.5735,
            longitude=88.4331,
            issueType="Waterlogging",
            description="Severe street waterlogging near test building",
            waterDepth=25.0
        )
        rep1 = await ReportService.create_report(db, user, rep1_data, None)
        print(f"Created Report 1: {rep1.report_id} at {rep1.location}")

        # Check incident_queue for this test location
        inc_res = await db.execute(select(IncidentQueue).where(IncidentQueue.location == test_loc1))
        inc1 = inc_res.scalars().first()
        assert inc1 is not None, "Expected incident row for test location 1"
        print(f"Incident Queue Row: ID={inc1.incident_id}, Location='{inc1.location}', Count={inc1.report_count}, Depth={inc1.water_depth}cm, Severity={inc1.severity}")
        assert inc1.report_count == 1, "Report count should be 1"
        assert inc1.water_depth == 25.0, f"Expected 25.0, got {inc1.water_depth}"
        assert inc1.severity in ["MODERATE", "HIGH", "CRITICAL"], f"Unexpected severity {inc1.severity}"

        print(f"\n=== [TEST 3] Submitting Report 2 for SAME Area ({test_loc1}) -> Increment count & mode depth ===")
        rep2_data = ReportCreate(
            location=test_loc1,
            latitude=22.5735,
            longitude=88.4331,
            issueType="Waterlogging",
            description="Water level increasing past footpath",
            waterDepth=30.0
        )
        rep2 = await ReportService.create_report(db, user, rep2_data, None)
        print(f"Created Report 2: {rep2.report_id} at {rep2.location}")

        inc_res2 = await db.execute(select(IncidentQueue).where(IncidentQueue.location == test_loc1))
        inc1_updated = inc_res2.scalars().first()
        assert inc1_updated is not None
        print(f"Incident Queue Row (Updated): ID={inc1_updated.incident_id}, Location='{inc1_updated.location}', Count={inc1_updated.report_count}, Depth={inc1_updated.water_depth}cm, Severity={inc1_updated.severity}")
        assert inc1_updated.report_count == 2, f"Expected report_count == 2, got {inc1_updated.report_count}"
        assert inc1_updated.water_depth == 30.0, f"Expected water_depth == 30.0, got {inc1_updated.water_depth}"

        print(f"\n=== [TEST 4] Submitting Report 3 for DIFFERENT Area ({test_loc2}) -> New row ===")
        rep3_data = ReportCreate(
            location=test_loc2,
            latitude=22.5726,
            longitude=88.4320,
            issueType="Waterlogging",
            description="Traffic blocked due to water near test point",
            waterDepth=20.0
        )
        rep3 = await ReportService.create_report(db, user, rep3_data, None)
        print(f"Created Report 3: {rep3.report_id} at {rep3.location}")

        inc_res3 = await db.execute(select(IncidentQueue).where(IncidentQueue.location == test_loc2))
        inc2 = inc_res3.scalars().first()
        assert inc2 is not None, "Expected incident row for test location 2"
        assert inc2.report_count == 1
        assert inc2.water_depth == 20.0

        print("\n=== [TEST 5] Fetching Active Incidents via IncidentQueueService.get_active_incidents ===")
        active_list = await IncidentQueueService.get_active_incidents(db)
        assert len(active_list) >= 2
        print(f"[OK] Active incidents returned {len(active_list)} cards")

        print("\n=== [TEST 6] User Reference Example: Salt Lake Sector V with depths [30, 15, 0, 30] ===")
        # Isolated test for the exact user prompt scenario
        test_sl_loc = "Test Salt Lake Sector V Simulation, Kolkata"

        # Generate 4 reports: order 30, 15, 0, 30
        depth_sequence = [30.0, 15.0, 0.0, 30.0]
        for idx, d in enumerate(depth_sequence, start=1):
            await ReportService.create_report(
                db,
                user,
                ReportCreate(
                    location=test_sl_loc,
                    latitude=22.5735,
                    longitude=88.4331,
                    issueType="Waterlogging",
                    description=f"Water depth observation #{idx}",
                    waterDepth=d,
                ),
                None,
            )

        inc_res4 = await db.execute(select(IncidentQueue).where(IncidentQueue.location == test_sl_loc))
        sl_inc = inc_res4.scalars().first()
        assert sl_inc is not None
        assert sl_inc.report_count == 4, f"Expected 4 reports, got {sl_inc.report_count}"
        print(f"4 reports submitted with depths {depth_sequence}. Most frequent depth: {sl_inc.water_depth}cm")
        assert sl_inc.water_depth == 30.0, f"Expected water_depth == 30.0 cm, got {sl_inc.water_depth}"

        print("\n=== [TEST 7] Subsequent Report Generation for Same Location: report #5 depth=15 -> tie (30 & 15 at 2) ===")
        await ReportService.create_report(
            db,
            user,
            ReportCreate(
                location=test_sl_loc,
                latitude=22.5735,
                longitude=88.4331,
                issueType="Waterlogging",
                description="5th report with 15 cm",
                waterDepth=15.0,
            ),
            None,
        )
        inc_res5 = await db.execute(select(IncidentQueue).where(IncidentQueue.location == test_sl_loc))
        sl_inc5 = inc_res5.scalars().first()
        assert sl_inc5.report_count == 5
        print(f"5 reports submitted [30, 15, 0, 30, 15]. Tie-break depth: {sl_inc5.water_depth}cm")
        assert sl_inc5.water_depth == 30.0, f"Expected tie-break 30.0, got {sl_inc5.water_depth}"

        print("\n=== [TEST 8] Subsequent Report Generation: report #6 depth=15 -> 15 appears 3 times ===")
        await ReportService.create_report(
            db,
            user,
            ReportCreate(
                location=test_sl_loc,
                latitude=22.5735,
                longitude=88.4331,
                issueType="Waterlogging",
                description="6th report with 15 cm",
                waterDepth=15.0,
            ),
            None,
        )
        inc_res6 = await db.execute(select(IncidentQueue).where(IncidentQueue.location == test_sl_loc))
        sl_inc6 = inc_res6.scalars().first()
        assert sl_inc6.report_count == 6
        print(f"6 reports submitted [30, 15, 0, 30, 15, 15]. Mode depth: {sl_inc6.water_depth}cm")
        assert sl_inc6.water_depth == 15.0, f"Expected mode depth 15.0, got {sl_inc6.water_depth}"

        print("\n=== [TEST 9] Priority Sorting Rules Verification ===")
        # Rule 1: If report_count is same then check water_depth, else whose report_count is more priorities first
        # Rule 2: If water_depth is same then check, for which location report generated first priorities first, else whose water_depth is more priorities first
        await db.execute(delete(Report).where(Report.user_id == user.id))
        await db.execute(delete(IncidentQueue).where(IncidentQueue.location.like("Test %")))
        await db.commit()

        from datetime import timedelta
        base_time = get_current_time()

        # Location Alpha: count 3, depth 10.0 (more reports, but lower depth)
        # Location Beta:  count 2, depth 35.0 (fewer reports, higher depth)
        # Location Gamma: count 2, depth 20.0 (generated earlier at base_time + 10s)
        # Location Delta: count 2, depth 20.0 (generated later at base_time + 20s)
        loc_alpha = "Test Priority Loc Alpha, Kolkata"
        loc_beta  = "Test Priority Loc Beta, Kolkata"
        loc_gamma = "Test Priority Loc Gamma, Kolkata"
        loc_delta = "Test Priority Loc Delta, Kolkata"

        # Alpha gets 3 reports of depth 10.0
        for i in range(3):
            await ReportService.create_report(
                db, user, ReportCreate(location=loc_alpha, latitude=22.5735, longitude=88.4331, issueType="Waterlogging", waterDepth=10.0), None
            )

        # Beta gets 2 reports of depth 35.0
        for i in range(2):
            await ReportService.create_report(
                db, user, ReportCreate(location=loc_beta, latitude=22.5726, longitude=88.4320, issueType="Waterlogging", waterDepth=35.0), None
            )

        # Gamma gets 2 reports of depth 20.0
        for i in range(2):
            await ReportService.create_report(
                db, user, ReportCreate(location=loc_gamma, latitude=22.5411, longitude=88.3639, issueType="Waterlogging", waterDepth=20.0), None
            )

        # Delta gets 2 reports of depth 20.0
        for i in range(2):
            await ReportService.create_report(
                db, user, ReportCreate(location=loc_delta, latitude=22.5000, longitude=88.3200, issueType="Waterlogging", waterDepth=20.0), None
            )

        # Explicitly set created_at timestamps to enforce deterministic ordering between Gamma and Delta
        q_gamma = (await db.execute(select(IncidentQueue).where(IncidentQueue.location == loc_gamma))).scalars().first()
        q_delta = (await db.execute(select(IncidentQueue).where(IncidentQueue.location == loc_delta))).scalars().first()
        q_gamma.created_at = base_time - timedelta(minutes=10)  # Gamma was generated FIRST
        q_delta.created_at = base_time - timedelta(minutes=5)   # Delta was generated LATER
        await db.commit()

        sorted_incidents = await IncidentQueueService.get_active_incidents(db)
        test_sorted = [inc for inc in sorted_incidents if inc.location.startswith("Test Priority")]
        loc_order = [inc.location for inc in test_sorted]

        print("Priority Order Result:")
        for idx, inc in enumerate(test_sorted, 1):
            print(f"  {idx}. {inc.location} | count: {inc.report_count} | depth: {inc.water_depth}cm | created: {inc.created_at}")

        # Check 1: Alpha has more report_count (3 > 2), so it MUST prioritize first even though Beta has higher depth (35 > 10)
        assert loc_order[0] == loc_alpha, f"Expected Alpha 1st (higher report_count 3 > 2), got {loc_order[0]}"

        # Check 2: Beta has same report_count as Gamma & Delta (2), but higher water_depth (35.0 > 20.0), so Beta MUST come 2nd
        assert loc_order[1] == loc_beta, f"Expected Beta 2nd (same count 2, higher depth 35 > 20), got {loc_order[1]}"

        # Check 3: Gamma & Delta have same report_count (2) and same depth (20.0), but Gamma was generated FIRST, so Gamma MUST come 3rd
        assert loc_order[2] == loc_gamma, f"Expected Gamma 3rd (same count & depth, generated earlier), got {loc_order[2]}"

        # Check 4: Delta comes 4th
        assert loc_order[3] == loc_delta, f"Expected Delta 4th, got {loc_order[3]}"
        print("[OK] Priority Sorting Rules 1 & 2 verified successfully!")

        # Clean up test reports and test incidents to leave DB clean
        await db.execute(delete(Report).where(Report.user_id == user.id))
        await db.execute(delete(IncidentQueue).where(IncidentQueue.location.like("Test %")))
        await db.commit()

        # Recalculate real incidents
        await IncidentQueueService.recalculate_all_incidents(db)

    print("\nALL INCIDENT QUEUE TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(test_incident_queue())

