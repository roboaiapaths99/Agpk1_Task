# Production Deployment Guide: AGPK1-Task (Multi-Server Setup)

This guide outlines the steps to deploy the AGPK1-Task platform to a VPS that already hosts other websites.

## 1. Prerequisites
- A Hostinger VPS with existing websites running on Nginx.
- Docker and Docker Compose installed.
- Domain `agpk1Task.agpkacademy.in` pointed to your VPS IP.

## 2. Server Configuration

### Step A: Configure Host Nginx
Create a new configuration file on your VPS:
```bash
sudo nano /etc/nginx/sites-available/agpk1task
```
Paste this configuration:
```nginx
server {
    listen 80;
    server_name agpk1Task.agpkacademy.in;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable it and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/agpk1task /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## 3. Deployment Steps

### Step A: Pull Latest Code
```bash
cd /root/agpk1-task
git pull origin master
```

### Step B: Build and Start
```bash
docker compose up -d --build
```

## 4. Troubleshooting
- **Check Logs**: `docker compose logs -f app`
- **Verify Port**: `curl http://127.0.0.1:5001`
- **Nginx Errors**: `sudo tail -f /var/log/nginx/error.log`

---
> [!IMPORTANT]
> This setup uses port **5001** on your VPS to avoid crashing your other 10 websites.
