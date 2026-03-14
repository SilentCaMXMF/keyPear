# KeyPear - Personal Cloud Storage

A lightweight, self-hosted file storage application optimized for Raspberry Pi (1GB RAM).

## Features

- 📁 **File Management** - Upload, download, organize files in folders
- 🔐 **Secure Auth** - Local accounts with JWT tokens
- 💾 **SMB Storage** - Uses your existing NAS as backend storage
- 🌐 **Remote Access** - Access files from anywhere via ngrok tunnel
- 📱 **Lightweight** - Built with Vanilla JS + Vite (~50KB frontend)

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Mount SMB storage
sudo mount -t cifs //192.168.1.254/public ~/keypear_mount \
  -o user=pedroocalado,pass=YOUR_PASSWORD,vers=1.0

# Start backend
cd backend && npm run dev

# Start frontend (new terminal)
cd frontend && npm run dev
```

Open http://localhost:3000 in your browser.

## Tech Stack

- **Frontend**: Vite + Vanilla JavaScript
- **Backend**: Express.js + TypeScript
- **Database**: SQLite (better-sqlite3)
- **Storage**: SMB mount to NAS (192.168.1.254)
- **Auth**: JWT + bcrypt

## Architecture

```
┌─────────────┐     ┌─────────────┐
│   Vite UI   │────▶│   Express   │
│  (Port 3000)│     │  (Port 3001)│
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   SQLite    │
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │ SMB Mount   │
                    │ NAS Storage │
                    └─────────────┘
```

## API

See [API Documentation](roadmap.md#api-endpoints) in roadmap.md.

## License

MIT
