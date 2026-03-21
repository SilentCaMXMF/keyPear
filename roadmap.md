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
│                     │         │   │ PostgreSQL  │   │
│                     │         │   └─────────────┘   │
│                     │         │          │          │
│                     │         │   ┌──────▼──────┐   │
│                     │         │   │ SMB Mount   │   │
│                     │         │   │ 192.168.1. │   │
│                     │         │   │ 254/public  │   │
│                     │         │   └─────────────┘   │
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
| **Database** | PostgreSQL | Persistent storage |
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

### Feature 3: File Management (3/4 complete) ✅

- 3.01 ✅ File upload endpoint (multipart, 100MB limit)
- 3.02 ✅ File download/streaming
- 3.03 ✅ Folder CRUD operations
- 3.04 ⏳ File preview thumbnails - deferred

### Feature 4: Web Frontend (3/4 complete) ✅

- 4.01 ✅ Login/register pages with form validation
- 4.02 ✅ Dashboard with file browser UI
- 4.03 ✅ Drag-and-drop file upload
- 4.04 ⏳ User settings/profile page - deferred

### Feature 5: Advanced Features (0/3 complete)

- 5.01 ⬜ Storage quotas per user (10GB default)
- 5.02 ⬜ Share links with expiry
- 5.03 ⬜ Activity logs and audit trail

### Feature 6: Security Hardening (0/8 complete)

- 6.01 ⬜ **CRITICAL: Rotate SMB password** - Change password since exposed in git history
- 6.02 ⬜ **CRITICAL: Remove credentials from git history** - Use `git-filter-repo` to purge `.env` files
- 6.03 ⬜ Add rate limiting (`express-rate-limit`) - Prevent brute force attacks
- 6.04 ⬜ Enable SSH key-based authentication - Disable password SSH auth
- 6.05 ⬜ Lock down database file permissions (chmod 600)
- 6.06 ⬜ Add input validation & sanitization - Prevent path traversal, XSS
- 6.07 ⬜ Fix CORS configuration - Whitelist specific domains only
- 6.08 ⬜ Implement refresh token rotation - Invalidate old tokens on refresh

### Feature 7: Mobile App (Phase 2)

- 7.01 ⬜ Set up React Native or Flutter project
- 7.02 ⬜ Mobile auth and file browser

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
DATABASE_URL=postgresql://localhost:5432/keypear
FRONTEND_URL=http://localhost:3000
```

**⚠️ NEVER commit `.env` files to git!**

### Running

```bash
# 1. Start backend (terminal 1)
cd backend && npm run dev

# 2. Start frontend (terminal 2)
cd frontend && npm run dev
```

### Tunnel (for Vercel/remote access)

```bash
# Install ngrok
brew install ngrok  # or download from ngrok.com

# Start tunnel to backend
ngrok http 3001
```

Update `.env` with the ngrok URL:
```
NEXT_PUBLIC_API_URL=https://your-ngrok-url.ngrok.io
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

## Progress: 12/29 tasks complete (41%)

---

## ⚠️ Security Alert

The SMB password (`REDACTED_PASSWORD`) and other credentials were accidentally committed to git history. **IMMEDIATE ACTION REQUIRED:**

1. **Change SMB password** on NAS (192.168.1.254)
2. **Rotate all credentials** that were in `.env`
3. Run: `git filter-repo --path .env --invert-paths` to remove from history
4. Force push: `git push --force`

### Environment Variables for Production

```env
# Required
PORT=3001
JWT_ACCESS_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<different-secret>
DATABASE_URL=postgresql://user:pass@host:5432/keypear
FRONTEND_URL=https://your-domain.com

# Optional (for production)
SMB_HOST=192.168.1.254
SMB_SHARE=public
SMB_USERNAME=pedroocalado
SMB_PASSWORD=<NEW-PASSWORD>  # CHANGE THIS!
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
