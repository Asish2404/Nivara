# ==============================================================================
# Backend Dockerfile for Kolkata Water Intelligence (KWI) - NIVARA
# Base Image: Python 3.11 Slim (Debian Bookworm)
# ==============================================================================

FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered terminal logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install minimal required system libraries:
# - libgomp1: GNU Offloading and OpenMP Runtime Library (required by scikit-learn & numpy)
# - curl: Lightweight HTTP utility for container health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Optimize Docker layer caching: install Python dependencies first
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Ensure uploads directory exists inside container
RUN mkdir -p /app/uploads

# Copy application source code
COPY . .

# Expose backend API port
EXPOSE 8000

# Start FastAPI application via Uvicorn with auto-reload for development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
