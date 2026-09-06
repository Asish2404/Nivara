# ⚡ Kolkata Water Intelligence (KWI) - FastAPI Backend

High-performance asynchronous municipal telemetry, hydraulic stress simulation, and SCADA telecontrol engine.

---

## 🛠️ Architecture & Tech Stack
- **Framework**: FastAPI (Python 3.10+)
- **ASGI Server**: Uvicorn with standard workers
- **Database & ORM**: SQLAlchemy 2.0 (Async) + aiosqlite / PostgreSQL
- **Data Validation**: Pydantic v2 & Pydantic-Settings
- **Migrations**: Alembic
- **Real-time Protocol**: Webhooks & WebSockets

---

## 🚀 Getting Started

### 1. Setup Virtual Environment & Install Dependencies
```bash
# In the Backend directory:
python -m venv venv

# Windows:
.\venv\Scripts\activate

# macOS / Linux:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt
```

### 2. Run the FastAPI Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Interactive Documentation
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 API Endpoints Matrix

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API Root & Service Discovery |
| `GET` | `/api/v1/health` | Service health & telemetry sync status |
| `GET` | `/api/v1/incidents` | List active municipal waterlogging incidents |
| `GET` | `/api/v1/incidents/{id}` | Get incident details |
| `POST` | `/api/v1/incidents` | Create a new municipal incident |
| `POST` | `/api/v1/incidents/{id}/resolve` | Resolve/dispatch incident work order |
| `GET` | `/api/v1/forecast/radar` | Alipore Doppler rainfall curve & Hooghly tides |
| `POST` | `/api/v1/simulate` | Execute hydraulic scenario simulation (PDE solver) |
| `GET` | `/api/v1/reports` | Retrieve citizen reports & municipal drainage audits |
| `POST` | `/api/v1/reports` | Submit a new citizen waterlogging report |
| `GET` | `/api/v1/actions` | List all SCADA pumping station states |
| `POST` | `/api/v1/actions/{id}/toggle` | SCADA pump actuation & sluice throttle |
| `POST` | `/api/v1/copilot/ask` | Natural language Ask Kolkata Copilot query |
| `POST` | `/api/v1/webhook/telemetry` | Ingest external SCADA / IoT telemetry webhooks |
| `WS` | `/api/v1/ws/telemetry` | Real-time live SCADA telemetry WebSocket |
