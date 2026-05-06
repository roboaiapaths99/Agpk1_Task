# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Copy frontend build to a public directory in backend (optional, but cleaner for Docker)
COPY --from=frontend-build /app/frontend/build ./public/frontend

EXPOSE 5000

CMD ["node", "src/server.js"]
