# KeyPear - Project Roadmap

## Project Overview

**Storage as a Service (STaaS)** - A lightweight web-based file storage application optimized for Raspberry Pi 3B+ (1GB RAM).

### Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│      Vercel         │         │   Raspberry Pi       │
│   ┌─────────────┐   │   API   │   ┌─────────────┐   │
│   │   Vite +    │◀──┼─────────▶   │  Express    │   │
│   │ Vanilla JS  │   │ HTTPS   │   │  API        │   │
│   └─────────────┘   │         │   └──────┬──────┘   │
│                     │         │          │          │
│   Deployed: Vercel │         │   ┌──────▼──────┐   │
│                     │         │   │ SQLite      │   │
│                     │         │   │ (sql.js)    │   │
│                     │         │   └─────────────┘   │
│                     │         │          │          │
│                     │         │   ┌──────▼──────┐   │
│                     │         │   │ SMB Mount   │   │
└─────────────────────┘         └──────────┬──────────┘
                                            │
                                    ┌───────┴───────┐
                                    │ Cloudflare    │
                                    │ Tunnel        │
                                    │ api.keypear   │
                                    └───────────────┘
```

### Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Vite + Vanilla JS | Lightweight SPA |
| **Backend** | Express.js + TypeScript | Runs on Pi |
| **Database** | SQLite (sql.js) | File-based |
| **File Storage** | SMB Mount (NAS) | 192.168.1.254/public |
| **Auth** | JWT + bcrypt | Local accounts |
| **Deployment** | Vercel (frontend) + Cloudflare Tunnel | For API access |

---

## Features

### Feature 1: Foundation & Architecture (3/3 complete) ✅

- 1.01 ✅ Set up project structure (Vite frontend + Express backend)
- 1.02 ✅ Design SQLite database schema (users, files, folders, activityLog, shareLinks)
- 1.03 ✅ REST API endpoints implemented

### Feature 2: Authentication System (3/3 complete) ✅

- 2.01 ✅ User registration with bcrypt hashing
- 2.02 ✅ JWT-based session management (7-day expiry)
- 2.03 ⏳ OAuth providers (Google, GitHub) - deferred

### Feature 3: File Management (7/7 complete) ✅

- 3.01 ✅ File upload endpoint (multipart, 100MB limit)
- 3.02 ✅ File download/streaming
- 3.03 ✅ Folder CRUD operations
- 3.04 ✅ File preview thumbnails - Sharp-based image thumbnails
- 3.05 ✅ Move/copy files between folders
- 3.06 ✅ Rename files and folders
- 3.07 ✅ Bulk delete operations

### Feature 4: Web Frontend (4/4 complete) ✅

- 4.01 ✅ Login/register pages with form validation
- 4.02 ✅ Dashboard with file browser UI
- 4.03 ✅ Drag-and-drop file upload
- 4.04 ✅ Search, sort, and multi-select features

### Feature 5: Advanced Features (3/3 complete) ✅

- 5.01 ✅ Storage quotas per user (10GB default) - displayed in sidebar
- 5.02 ✅ Share links with expiry
- 5.03 ✅ Activity logs and audit trail

### Feature 6: Security Hardening (8/8 complete) ✅

- 6.01 ✅ **Rotate SMB password** - Change password since exposed in git history
- 6.02 ✅ **Remove credentials from git history** - Use `git-filter-repo` to purge `.env` files
- 6.03 ✅ Add rate limiting (`express-rate-limit`) - Prevent brute force attacks
- 6.04 ✅ Enable SSH key-based authentication - Disable password SSH auth
- 6.05 ✅ Lock down database file permissions (chmod 600)
- 6.06 ✅ Add input validation & sanitization - Prevent path traversal, XSS
- 6.07 ✅ Fix CORS configuration - Whitelist specific domains only
- 6.08 ✅ Implement refresh token rotation - Invalidate old tokens on refresh

### Feature 7: Storage & Infrastructure (4/4 complete) ✅

- 7.01 ✅ Refactor file storage to preserve original names (with UUID suffix for uniqueness)
- 7.02 ✅ Implement thumbnail generation (Sharp-based for images)
- 7.03 ✅ Create SMB auto-mount systemd service
- 7.04 ✅ Organize SMB share structure with per-user isolation

### Feature 8: Mobile App (Phase 2)

- 8.01 ⬜ Set up React Native or Flutter project
- 8.02 ⬜ Mobile auth and file browser

### Feature 9: UI/UX Improvements (9/9 complete) ✅

- 9.01 ✅ Search bar - Filter files by name
- 9.02 ✅ Sort options - By name, date, size (asc/desc)
- 9.03 ✅ Multi-select - Checkbox selection for bulk operations
- 9.04 ✅ Storage quota display - Progress bar in sidebar
- 9.05 ✅ Upload progress - Real-time upload progress indicator
- 9.06 ✅ Context menu - Right-click menu with all file operations
- 9.07 ✅ Trash view - View deleted files, restore, permanent delete
- 9.08 ✅ Recent files view - Show recently uploaded files
- 9.09 ✅ Shared with me view - Show files shared by others

### Feature 10: Backend Services (1/1 complete) ✅

- 10.01 ✅ Backend systemd service - Auto-start on boot via systemd

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files` | List files in path |
| POST | `/api/files/upload` | Upload file |
| GET | `/api/files/:id/download` | Download file |
| DELETE | `/api/files/:id` | Delete file |

### Folders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/folders` | Create folder |
| PATCH | `/api/folders/:id` | Rename folder |

---

## Getting Started

### Prerequisites

- Node.js 18+
- SMB access to NAS (192.168.1.254)
- ngrok account (for tunnel)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd keypear

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Update with your credentials

```env
PORT=3001
JWT_ACCESS_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<different-generate-with-openssl-rand-base64-32>
FRONTEND_URL=http://localhost:3000
# SQLite database auto-created at backend/data/keypear.db
```

**⚠️ NEVER commit `.env` files to git!**

### Running

```bash
# 1. Start backend (terminal 1)
cd backend && npm run dev

# 2. Start frontend (terminal 2)
cd frontend && npm run dev
```

### Deployment

#### Vercel (Frontend)
The frontend is deployed on Vercel at: **https://key-pear.vercel.app**

```bash
# Connect GitHub repo to Vercel
# Vercel auto-builds from vercel.json config

# Environment variables on Vercel:
VITE_API_URL=https://backend-api.pedroocalado.eu
```

#### Cloudflare Tunnel (Backend API)
The backend API is exposed via Cloudflare Tunnel at: **https://backend-api.pedroocalado.eu**

The tunnel runs on the Pi and routes traffic to the Express backend.

#### Pi Setup

```bash
# SSH to Pi
ssh pedroocalado@192.168.1.67

# Start backend
cd keypear/backend && npm run dev

# Enable services (after reboot)
sudo systemctl enable keypear-smb keypear-api
sudo systemctl start keypear-smb keypear-api
```

#### Local Development

```bash
# Clone repository
git clone https://github.com/SilentCaMXMF/keyPear.git
cd keyPear

# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev
```

---

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| name | TEXT | User's full name |
| email | TEXT | Unique email |
| password | TEXT | bcrypt hash |
| storageQuota | INTEGER | Default 10GB |
| storageUsed | INTEGER | Bytes used |
| createdAt | TEXT | Timestamp |

### files
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| userId | TEXT | Foreign key to users |
| name | TEXT | File/folder name |
| path | TEXT | Parent path |
| size | INTEGER | Bytes |
| mimeType | TEXT | File type |
| storagePath | TEXT | SMB file path |
| isFolder | INTEGER | 0=file, 1=folder |
| parentId | TEXT | Self-reference |

### activityLog
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID |
| userId | TEXT | FK to users |
| action | TEXT | upload, delete, etc. |
| fileId | TEXT | Related file |
| details | TEXT | JSON details |

---

## Progress: 35/37 tasks complete (95%)

---

## Live URLs

| Service | URL |
|---------|-----|
| **Frontend** | https://key-pear.vercel.app |
| **Backend API** | https://backend-api.pedroocalado.eu |
| **Backend (local)** | http://192.168.1.67:3001 |

---

## ⚠️ Security Notes

- `.env` files are gitignored - never commit secrets
- SMB credentials stored in `~/.smbcredentials` (mode 600)
- SSH key-based auth enabled on Pi
- Rate limiting active on all endpoints
- Refresh token rotation enabled

### Database Migrations

Run the following SQL after pulling updates to enable new features:

```bash
# SSH to Pi
ssh pedroocalado@192.168.1.67

# Run migration for sharing features
psql -d keypear -f ~/keypear/database/migrations/002_sharing_schema.sql
```

### Environment Variables for Production

```env
# Required
PORT=3001
JWT_ACCESS_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<different-secret>
FRONTEND_URL=https://your-domain.com

# SQLite database auto-created at backend/data/keypear.db

# Optional (for production)
SMB_HOST=192.168.1.254
SMB_SHARE=public
SMB_USERNAME=pedroocalado
SMB_PASSWORD=<NEW-PASSWORD>  # CHANGE THIS!
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
