# KeyPear - Personal Cloud Storage

A lightweight, self-hosted file storage application designed for Raspberry Pi with remote access via Cloudflare Tunnel.

## Features

- 📁 **File Management** - Upload, download, organize files in folders
- 🔐 **Secure Auth** - Local accounts with JWT tokens
- 💾 **SMB Storage** - Uses your existing NAS as backend storage
- 🌐 **Remote Access** - Access from anywhere via Cloudflare Tunnel
- 📱 **Lightweight** - Built with Vanilla JS + Vite (~50KB frontend)
- 📸 **Thumbnails** - Auto-generated image thumbnails
- 🔗 **Share Links** - Public share links with optional expiry
- 📜 **Activity Logs** - Track all file operations

## Tech Stack

- **Frontend**: Vite + Vanilla JavaScript + Tailwind CSS
- **Backend**: Express.js + Node.js ESM modules
- **Database**: SQLite (sql.js)
- **Storage**: SMB mount to NAS
- **Auth**: JWT (15min access, 7d refresh) + bcrypt
- **Remote Access**: Cloudflare Tunnel

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel/Local)                   │
│                      Port 3000 / 4321                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│                  Cloudflare Tunnel                           │
│              backend-api.pedroocalado.eu                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Raspberry Pi                              │
│  ┌─────────────┐     ┌─────────────┐                        │
│  │   Express   │────▶│   SQLite    │                        │
│  │  (Port3001) │     │ (sql.js)    │                        │
│  └─────────────┘     └─────────────┘                        │
│         │                                                   │
│  ┌──────▼──────┐                                            │
│  │ SMB Mount   │                                            │
│  │ NAS Storage │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/SilentCaMXMF/keyPear.git
cd keyPear
cd backend && npm install
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit .env with your settings:
nano backend/.env
```

### 3. Mount SMB Storage
```bash
# Create credentials file
echo 'username=YOUR_USER' > ~/.smbcredentials
echo 'password=YOUR_PASS' >> ~/.smbcredentials
chmod 600 ~/.smbcredentials

# Mount SMB share
sudo mount -t cifs //192.168.1.254/public ~/keypear_mount \
  -o credentials=/home/pi/.smbcredentials,uid=1000,gid=1000,vers=1.0

# Add to fstab for auto-mount:
echo '//192.168.1.254/public /home/pi/keypear_mount cifs credentials=/home/pi/.smbcredentials,uid=1000,gid=1000,vers=1.0 0 0' | sudo tee -a /etc/fstab
```

### 4. Install Systemd Service
```bash
sudo cp keypear-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable keypear-backend
sudo systemctl start keypear-backend
```

### 5. Cloudflare Tunnel (for remote access)
```bash
# Install cloudflared
# Create tunnel at dash.cloudflare.com
# Configure ~/.cloudflared/config.yml:
#   tunnel: <tunnel-id>
#   credentials-file: /path/to/credentials.json
#   ingress:
#     - hostname: backend-api.pedroocalado.eu
#       service: http://127.0.0.1:3001
#       originRequest:
#         noTLSVerify: true
#     - service: http_status:404

cloudflared tunnel run <tunnel-name>
```

### 6. Frontend Setup
```bash
cd frontend && npm install
npm run dev  # For local development
```

## Deployment

### Frontend (Vercel)
1. Connect repo to Vercel
2. Set environment variable: `VITE_API_URL=https://backend-api.pedroocalado.eu`
3. Deploy

### Backend (Raspberry Pi)
- Systemd service: `keypear-backend.service`
- Auto-starts on boot
- Logs: `journalctl -u keypear-backend`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | 3001 |
| `JWT_SECRET` | JWT signing secret | (required) |
| `SMB_MOUNT_PATH` | SMB mount path | `/home/pi/keypear_mount` |
| `FRONTEND_URL` | CORS origin | `http://localhost:4321` |

## API

See [Backend README](backend/README.md) for full API documentation.

## License

MIT
