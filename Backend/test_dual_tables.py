import asyncio
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import init_db, async_session, engine
from app.models.user import User
from app.models.admin import Admin
from app.schemas.auth import UserSignupRequest
from app.services.auth_service import AuthService
from sqlalchemy import select, inspect, text


async def test_database_and_auth():
    print("=== [TEST 1] Initializing DB and checking tables ===")
    await init_db()

    async with engine.connect() as conn:
        def check_schema(connection):
            insp = inspect(connection)
            tables = insp.get_table_names()
            print("Existing tables:", tables)
            assert "users" in tables, "Table 'users' missing!"
            assert "admin" in tables, "Table 'admin' missing!"

            user_cols = {c["name"] for c in insp.get_columns("users")}
            admin_cols = {c["name"] for c in insp.get_columns("admin")}

            print("\nColumns in 'users':", sorted(list(user_cols)))
            print("Columns in 'admin':", sorted(list(admin_cols)))

            expected_user_cols = {"id", "name", "email", "hashed_password", "phone", "role", "clearance", "status", "created_at", "location"}
            expected_admin_cols = {"id", "badge_id", "name", "email", "hashed_password", "phone", "role", "department", "clearance", "status", "created_at", "location"}

            for col in expected_user_cols:
                assert col in user_cols, f"Missing {col} in users table"
            for col in expected_admin_cols:
                assert col in admin_cols, f"Missing {col} in admin table"

            print("[OK] Both tables have all required columns!")

        await conn.run_sync(check_schema)

    print("\n=== [TEST 2] Testing User Portal Registration -> 'users' table ===")
    async with async_session() as db:
        signup_user = UserSignupRequest(
            email="citizen.test@kolkata.org",
            password="Password@123",
            fullName="Citizen Test User",
            phone="+91 98309 99999",
            portal="user",
        )
        # Delete if exists
        res = await db.execute(select(User).where(User.email == signup_user.email))
        existing = res.scalars().first()
        if existing:
            await db.delete(existing)
            await db.commit()

        user = await AuthService.register_user(db, signup_user)
        print(f"Registered user ID: {user.id}, Table: {user.__tablename__}, Status: {user.status}")
        assert user.__tablename__ == "users"
        assert user.status == "not active", "Initial status must be 'not active'"

        # Verify not in admin table
        res_admin = await db.execute(select(Admin).where(Admin.email == signup_user.email))
        assert res_admin.scalars().first() is None, "User should NOT be in admin table"
        print("[OK] User saved exclusively to 'users' table with status 'not active'")

    print("\n=== [TEST 3] Testing Admin Portal Registration -> 'admin' table ===")
    async with async_session() as db:
        signup_admin = UserSignupRequest(
            email="officer.test@kolkata-water.gov.in",
            password="Officer@123",
            fullName="Officer Test Admin",
            phone="+91 98308 88888",
            portal="admin",
        )
        # Delete if exists
        res = await db.execute(select(Admin).where(Admin.email == signup_admin.email))
        existing = res.scalars().first()
        if existing:
            await db.delete(existing)
            await db.commit()

        admin = await AuthService.register_user(db, signup_admin)
        print(f"Registered admin ID: {admin.id}, Table: {admin.__tablename__}, Status: {admin.status}, Badge: {admin.badge_id}")
        assert admin.__tablename__ == "admin"
        assert admin.status == "not active", "Initial status must be 'not active'"

        # Verify not in users table
        res_user = await db.execute(select(User).where(User.email == signup_admin.email))
        assert res_user.scalars().first() is None, "Admin should NOT be in users table"
        print("[OK] Admin saved exclusively to 'admin' table with status 'not active'")

    print("\n=== [TEST 4] Testing Login Status Update -> 'active' ===")
    async with async_session() as db:
        # User login
        auth_u, _ = await AuthService.authenticate_user(db, "citizen.test@kolkata.org", "Password@123", portal="user")
        assert auth_u is not None
        assert auth_u.status == "active", "User status should be 'active' after login"
        print(f"User login successful -> Status: {auth_u.status}")

        # Admin login
        auth_a, _ = await AuthService.authenticate_user(db, "officer.test@kolkata-water.gov.in", "Officer@123", portal="admin")
        assert auth_a is not None
        assert auth_a.status == "active", "Admin status should be 'active' after login"
        print(f"Admin login successful -> Status: {auth_a.status}")

    print("\n=== [TEST 5] Testing Logout Status Update -> 'not active' ===")
    async with async_session() as db:
        await AuthService.logout_user(db, auth_u.id)
        res_u = await db.execute(select(User).where(User.id == auth_u.id))
        updated_u = res_u.scalars().first()
        assert updated_u.status == "not active", "User status should be 'not active' after logout"
        print(f"User logout successful -> Status: {updated_u.status}")

        await AuthService.logout_user(db, auth_a.id)
        res_a = await db.execute(select(Admin).where(Admin.id == auth_a.id))
        updated_a = res_a.scalars().first()
        assert updated_a.status == "not active", "Admin status should be 'not active' after logout"
        print(f"Admin logout successful -> Status: {updated_a.status}")

    print("\nALL DATABASE AND PORTAL AUTH TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    asyncio.run(test_database_and_auth())
