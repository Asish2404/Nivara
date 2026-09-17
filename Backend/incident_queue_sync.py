"""Incident Queue Sync Helper & Standalone Sync Utility.
Syncs live citizen reports into the `incident_queue` table with real-time count aggregation.
"""
import asyncio
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import async_session, init_db
from app.services.incident_service import IncidentQueueService


async def sync_incident_queue():
    print("[INCIDENT QUEUE SYNC] Initializing Database...")
    await init_db()
    async with async_session() as db:
        print("[INCIDENT QUEUE SYNC] Syncing reports to incident_queue table...")
        synced = await IncidentQueueService.sync_from_existing_reports(db)
        print(f"[INCIDENT QUEUE SYNC] Synced {synced} reports into incident_queue successfully.")
        
        active = await IncidentQueueService.get_active_incidents(db)
        print(f"[INCIDENT QUEUE SYNC] Currently {len(active)} active incident queue hotspots:")
        for inc in active:
            print(f"  - [{inc.severity}] #{inc.incident_id} | {inc.location} | {inc.report_count} reports | {inc.water_depth} cm | {inc.subdivision}")


if __name__ == "__main__":
    asyncio.run(sync_incident_queue())
