# Stage 1: Build Frontend
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend node_modules
FROM node:22-slim AS backend-builder
WORKDIR /app/backend
# Only copy package files to ensure we don't bring in host node_modules
COPY backend/package*.json ./
# Install build tools and build sqlite3 from source in the container
RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*
RUN npm install --build-from-source

# Stage 3: Final Production Image
FROM node:22-slim
WORKDIR /app/backend

# Copy the clean node_modules from the builder stage
COPY --from=backend-builder /app/backend/node_modules ./node_modules

# Surigcally copy ONLY backend source code to avoid host pollution
COPY backend/*.js ./
COPY backend/models ./models
COPY backend/routes ./routes
COPY backend/package.json ./

# Copy the frontend build
COPY --from=frontend-build /app/frontend/dist ../frontend/dist

EXPOSE 5000
CMD ["node", "index.js"]
