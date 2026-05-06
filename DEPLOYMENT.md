# Production Deployment Guide: AGPK1-Task

This guide outlines the steps to deploy the AGPK1-Task platform to your Hostinger VPS at `agpk1Task.agpkacademy.in`.

## 1. Prerequisites
- A Hostinger VPS running Ubuntu (22.04 or 24.04 recommended).
- Docker and Docker Compose installed on the VPS.
- Domain `agpk1Task.agpkacademy.in` pointed to your VPS IP.

## 2. Prepare the Production Environment
I have created a `Dockerfile` and `docker-compose.yml` in your root directory. Before deploying, ensure your `.env` file on the server has the following production settings:

```env
NODE_ENV=production
PORT=5000
MONGO_URI="mongodb://agpkacademy_db_user:MaXpMeIrCdjJZ9CO@ac-er2l78g-shard-00-00.m4ff4ei.mongodb.net:27017,ac-er2l78g-shard-00-01.m4ff4ei.mongodb.net:27017,ac-er2l78g-shard-00-02.m4ff4ei.mongodb.net:27017/test?authSource=admin&replicaSet=atlas-e485ws-shard-0&retryWrites=true&w=majority&ssl=true"
JWT_SECRET=your_actual_secure_random_secret
REFRESH_TOKEN_SECRET=your_actual_secure_random_refresh_secret
ALLOWED_ORIGINS=https://agpk1Task.agpkacademy.in
REDIS_URL=redis://redis:6379
```

## 3. Deployment Steps

### Step A: Clone the Repository
SSH into your VPS and clone the project:
```bash
git clone <your-repo-url> agpk1-task
cd agpk1-task
```

### Step B: Create .env
Create the production `.env` file using the values above.

### Step C: Build and Start Containers
Run the following command to build the frontend and start all services (App, Redis, Nginx):
```bash
docker compose up -d --build
```

### Step D: SSL Setup (Let's Encrypt)
To enable HTTPS, run Certbot on your VPS:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d agpk1Task.agpkacademy.in
```
Then, ensure the certificates are mapped in `docker-compose.yml` (I have already added the volume mapping for `/etc/letsencrypt`).

## 4. Maintenance Commands

- **View Logs**: `docker compose logs -f app`
- **Restart App**: `docker compose restart app`
- **Update Code**:
  ```bash
  git pull
  docker compose up -d --build
  ```

## 5. Nginx Configuration Details
The provided `nginx.conf` handles:
- Forwarding traffic to the backend on port 5000.
- Serving the React frontend (integrated via the backend).
- Supporting WebSockets for real-time features.

---
> [!IMPORTANT]
> Make sure to update `JWT_SECRET` and `REFRESH_TOKEN_SECRET` with strong, unique strings before going live.
