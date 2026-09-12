# ==============================================================================
# Frontend Dockerfile for Kolkata Water Intelligence (KWI) - NIVARA
# Base Image: Node.js 20 Alpine
# ==============================================================================

FROM node:20-alpine

WORKDIR /app

# Optimize Docker layer caching: install npm dependencies first
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY . .

# Expose Vite development server port
EXPOSE 5173

# Start Vite with external host binding for Docker container access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
