# Raspberry Pi Deployment Guide

## Overview

Deploy keyPear on a Raspberry Pi with SMB/network storage for user files.

## Prerequisites

- Raspberry Pi 4+ (recommended 4GB+ RAM)
- Raspbian OS or Ubuntu Server 22.04+
- Network storage (NAS) accessible via SMB/CIFS
- Node.js 18+ or Docker

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   keyPear       │     │   NAS Storage   │
│   Frontend      │────▶│   (SMB Mount)   │
│   (Port 4321)   │     │                 │
└─────────────────┘     └────────▲────────┘
        │                        │
        ▼                        │
┌─────────────────┐              │
│   keyPear       │──────────────┘
│   Backend       │
│   (Port 3001)   │
└─────────────────┘
```

## Option 1: Direct Deployment (Node.js)

### 1. Install Dependencies

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Clone Repository

```bash
git clone https://github.com/SilentCaMXMF/keyPear.git
cd keyPear
npm install
```

### 3. Mount SMB Storage

```bash
# Install CIFS utilities
sudo apt-get install cifs-utils

# Create mount point
sudo mkdir -p /mnt/nas/keypear-storage

# Add credentials file (optional, for secured shares)
# Create /root/.smbcredentials:
# username=your_nas_user
# password=your_nas_password
# domain=WORKGROUP

# Mount temporarily
sudo mount -t cifs //NAS_IP/shared-folder /mnt/nas/keypear-storage \
  -o username=your_user,password=your_pass,uid=1000,gid=1000

# Or mount with credentials file:
sudo mount -t cifs //NAS_IP/shared-folder /mnt/nas/keypear-storage \
  -o credentials=/root/.smbcredentials,uid=1000,gid=1000
```

### 4. Make Mount Persistent

```bash
# Add to /etc/fstab
sudo nano /etc/fstab

# Add this line:
# //NAS_IP/shared-folder /mnt/nas/keypear-storage cifs credentials=/root/.smbcredentials,uid=1000,gid=1000 0 0

# Test mount
sudo mount -a
```

### 5. Configure Environment

```bash
cd backend
cp ../.env.example .env
nano .env
```

Edit `.env`:
```env
PORT=3001
DATABASE_PATH=/mnt/nas/keypear-storage/data/keypear.db
STORAGE_PATH=/mnt/nas/keypear-storage/user-files
THUMBNAIL_DIR=/mnt/nas/keypear-storage/thumbnails
JWT_ACCESS_SECRET=your-secure-access-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret
FRONTEND_URL=http://your-pi-ip:4321
```

### 6. Create Directories

```bash
sudo mkdir -p /mnt/nas/keypear-storage/{data,user-files,thumbnails,chunks}
sudo chown -R $USER:$USER /mnt/nas/keypear-storage
```

### 7. Start Backend

```bash
cd backend
npm run dev  # Development
# Or for production:
pm2 start src/server.ts --name keypear-backend
```

### 8. Start Frontend

```bash
cd frontend
npm run dev
```

## Option 2: Docker Deployment

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. Update Docker Compose for Pi

Create `docker-compose.pi.yml`:

```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: keypear-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_PATH: /data/keypear.db
      STORAGE_PATH: /data/user-files
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:4321}
    volumes:
      - /mnt/nas/keypear-storage:/data
    ports:
      - "3001:3001"
    networks:
      - keypear

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: keypear-frontend
    restart: unless-stopped
    environment:
      PUBLIC_API_URL: http://localhost:3001
    ports:
      - "4321:80"
    depends_on:
      - backend
    networks:
      - keypear

networks:
  keypear:
    driver: bridge
```

### 3. Deploy

```bash
docker-compose -f docker-compose.pi.yml up -d
```

## Cloudflare Tunnel (for external access)

### 1. Install cloudflared

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 > cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

### 2. Create Tunnel

```bash
cloudflared tunnel create keypear
cloudflared tunnel route dns keypear api.keypear.pedroocalado.eu
```

### 3. Configure Ingress

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.keypear.pedroocalado.eu
    service: http://127.0.0.1:3001
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

### 4. Run Tunnel

```bash
cloudflared tunnel run keypear
```

### 5. Systemd Service (optional)

```bash
sudo nano /etc/systemd/system/cloudflared-keypear.service
```

```ini
[Unit]
Description=Cloudflare Tunnel for keyPear
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel run keypear
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cloudflared-keypear
sudo systemctl start cloudflared-keypear
```

## Troubleshooting

### SMB Mount Issues

```bash
# Check SMB version (use SMB3 for encrypted transfers)
sudo mount -t cifs //NAS_IP/share /mnt/point -o vers=3.0,...

# Verify mount is working
df -h | grep nas

# Check mount permissions
ls -la /mnt/nas/keypear-storage
```

### Port Already in Use

```bash
# Find and kill process on port
sudo lsof -i :3001
sudo kill <PID>
```

### Database Issues

```bash
# Reset database
rm /mnt/nas/keypear-storage/data/keypear.db
# Restart backend to recreate
```

### Permission Denied

```bash
# Fix ownership
sudo chown -R $USER:$USER /mnt/nas/keypear-storage
```

## Security Notes

1. Use strong JWT secrets (32+ random characters)
2. Enable HTTPS in production (via Nginx or Cloudflare)
3. Set proper file permissions on storage mount
4. Consider firewall rules (ufw allow 22, 80, 443)
5. Use SMB3 with encryption for network storage

## Quick Start Checklist

- [ ] Raspberry Pi powered on and connected to network
- [ ] NAS accessible and SMB share configured
- [ ] Mount point created and tested
- [ ] Dependencies installed (Node.js, PM2)
- [ ] Environment variables configured
- [ ] Backend started and verified
- [ ] Frontend started and accessible locally
- [ ] Cloudflare tunnel configured (optional)
- [ ] DNS and SSL working
