"""Verification test script for Citizen Complaint Location -> Municipality/Corporation Jurisdiction Mapping.

Run with:
    python test_jurisdiction_feature.py
"""

import asyncio
import sys
import os

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db, async_session
from app.core.security import create_access_token
from app.models.user import User
from app.services.jurisdiction_service import JurisdictionService
from app.services.geocoding_service import GeocodingService
from sqlalchemy import select


async def run_tests():
    print("==================================================================")
    print(" SMART DRAINAGE INTELLIGENCE - JURISDICTION MAPPING TEST SUITE")
    print("==================================================================")

    # 1. Initialize Database & safe migrations
    print("\n[1/4] Initializing Database & Executing Safe Schema Migrations...")
    await init_db()

    # 2. Test Geocoding Service directly
    print("\n[2/4] Testing Geocoding Service (Forward Geocoding)...")
    res_geo = GeocodingService.forward_geocode("Techno India University Kolkata")
    print(f"  Query: 'Techno India University Kolkata'")
    if res_geo:
        print(f"  -> Latitude:  {res_geo['latitude']}")
        print(f"  -> Longitude: {res_geo['longitude']}")
        print(f"  -> Address:   {res_geo['formatted_address']}")
    assert res_geo is not None, "Geocoding returned no result"
    print("  [OK] Geocoding service verified successfully.")

    # 3. Test Jurisdiction Service directly (Point-in-Polygon)
    print("\n[3/4] Testing Jurisdiction Service (Point-in-Polygon Spatial Joins)...")

    # 3a. Coordinates inside KMC (Victoria Memorial)
    kmc_res = JurisdictionService.find_jurisdiction(22.5448, 88.3426)
    print(f"  (a) Inside KMC (Victoria Memorial - 22.5448, 88.3426):")
    print(f"      -> Found:             {kmc_res['found']}")
    print(f"      -> ULB ID:            {kmc_res['ulb_id']}")
    print(f"      -> ULB Name:          {kmc_res['ulb_name']}")
    print(f"      -> Jurisdiction Type: {kmc_res['jurisdiction_type']}")
    print(f"      -> Ward:              {kmc_res['ward']}")
    assert kmc_res["found"] is True and kmc_res["ulb_id"] == "KMC"

    # 3b. Coordinates inside Bidhannagar (Salt Lake)
    bidhan_res = JurisdictionService.find_jurisdiction(22.5848443, 88.4065528)
    print(f"  (b) Inside Bidhannagar (Salt Lake Sector III - 22.5848443, 88.4065528):")
    print(f"      -> Found:             {bidhan_res['found']}")
    print(f"      -> ULB ID:            {bidhan_res['ulb_id']}")
    print(f"      -> ULB Name:          {bidhan_res['ulb_name']}")
    print(f"      -> Jurisdiction Type: {bidhan_res['jurisdiction_type']}")
    assert bidhan_res["found"] is True and bidhan_res["ulb_name"] == "Bidhannagar"

    # 3c. Coordinates outside supported boundary (New Delhi)
    outside_res = JurisdictionService.find_jurisdiction(28.6139, 77.2090)
    print(f"  (c) Outside Boundary (New Delhi - 28.6139, 77.2090):")
    print(f"      -> Found: {outside_res['found']}")
    assert outside_res["found"] is False
    print("  [OK] Spatial lookups verified successfully.")

    # 4. End-to-End API Integration Tests (POST /api/v1/reports)
    print("\n[4/4] Testing HTTP POST /api/v1/reports Endpoint...")
    async with async_session() as db:
        result = await db.execute(select(User))
        user = result.scalars().first()
        if not user:
            user = User(
                id="USR-TEST-001",
                email="citizen.tester@kwi.gov.in",
                hashed_password="dummy",
                full_name="Citizen Tester",
                role="Citizen Reporter",
                department="Kolkata Water Watch",
                badge_id="CIT-9999",
                clearance="Citizen",
                avatar="🌊",
                is_active=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

    token = create_access_token(subject=user.id, extra_claims={"email": user.email, "role": user.role})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Example 1: Coordinates inside KMC
        print("\n  Example 1: Direct GPS Coordinates inside Kolkata Municipal Corporation (KMC)")
        r1 = await client.post(
            "/api/v1/reports",
            headers=headers,
            data={
                "location": "Park Street Crossing",
                "latitude": 22.5448,
                "longitude": 88.3426,
                "issueType": "Waterlogging",
                "waterDepth": 20.0,
                "description": "Drain choke near Park Street intersection",
            }
        )
        assert r1.status_code == 201, f"Failed: {r1.text}"
        d1 = r1.json()
        print(f"    Status: HTTP {r1.status_code}")
        print(f"    Report ID:         {d1['report_id']}")
        print(f"    Assigned ULB Name: {d1['assigned_ulb_name']}")
        print(f"    Assigned ULB ID:   {d1['assigned_ulb_id']}")
        print(f"    Jurisdiction Type: {d1['jurisdiction_type']}")
        print(f"    KMC Ward:          {d1['ward']}")
        print(f"    Location Source:   {d1['location_source']}")

        # Example 2: Coordinates inside another supported ULB (Bidhannagar)
        print("\n  Example 2: Direct GPS Coordinates inside Bidhannagar Corporation")
        r2 = await client.post(
            "/api/v1/reports",
            headers=headers,
            data={
                "location": "Salt Lake Sector III",
                "latitude": 22.5848443,
                "longitude": 88.4065528,
                "issueType": "Drainage Overflow",
                "waterDepth": 15.0,
                "description": "Water accumulated on sidewalk",
            }
        )
        assert r2.status_code == 201, f"Failed: {r2.text}"
        d2 = r2.json()
        print(f"    Status: HTTP {r2.status_code}")
        print(f"    Report ID:         {d2['report_id']}")
        print(f"    Assigned ULB Name: {d2['assigned_ulb_name']}")
        print(f"    Assigned ULB ID:   {d2['assigned_ulb_id']}")
        print(f"    Jurisdiction Type: {d2['jurisdiction_type']}")
        print(f"    Location Source:   {d2['location_source']}")

        # Example 3: Manual address forward geocoding
        print("\n  Example 3: Manual Address Forward Geocoding (no lat/lon supplied)")
        r3 = await client.post(
            "/api/v1/reports",
            headers=headers,
            data={
                "location": "Techno India University, Kolkata",
                "issueType": "Waterlogging",
                "description": "Flooding outside university gate",
            }
        )
        assert r3.status_code == 201, f"Failed: {r3.text}"
        d3 = r3.json()
        print(f"    Status: HTTP {r3.status_code}")
        print(f"    Report ID:         {d3['report_id']}")
        print(f"    Resolved Lat/Lon:  {d3['latitude']}, {d3['longitude']}")
        print(f"    Assigned ULB Name: {d3['assigned_ulb_name']}")
        print(f"    Location Source:   {d3['location_source']}")

        # Example 4: Coordinates outside supported boundary (New Delhi) -> Should return HTTP 400
        print("\n  Example 4: Location Outside Supported Boundary (New Delhi - 28.6139, 77.2090)")
        r4 = await client.post(
            "/api/v1/reports",
            headers=headers,
            data={
                "latitude": 28.6139,
                "longitude": 77.2090,
                "issueType": "Waterlogging",
            }
        )
        print(f"    Status: HTTP {r4.status_code} (Expected 400)")
        print(f"    Error response: {r4.json()['detail']}")
        assert r4.status_code == 400

        # Example 5: Missing location information
        print("\n  Example 5: Missing Location Information (no coordinates and no address)")
        r5 = await client.post(
            "/api/v1/reports",
            headers=headers,
            data={
                "issueType": "Waterlogging",
            }
        )
        print(f"    Status: HTTP {r5.status_code} (Expected 400)")
        print(f"    Error response: {r5.json()['detail']}")
        assert r5.status_code == 400

    print("\n==================================================================")
    print(" ALL TESTS COMPLETED AND PASSED!")
    print("==================================================================")


if __name__ == "__main__":
    asyncio.run(run_tests())
