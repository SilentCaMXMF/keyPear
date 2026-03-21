---
feature: "Storage as a Service (STaaS) Platform"
spec: |
  Lightweight web storage app for Raspberry Pi 3B+ (1GB RAM). Vanilla JS frontend + Express backend + SQLite + SMB storage. Target: small teams (10-100 users).
---

## Task List

### Feature 1: Foundation & Architecture ✅ COMPLETE
- [x] 1.01 Set up project structure (Vite + Vanilla JS frontend, Express + TypeScript backend)
- [x] 1.02 Design database schema (users, files, folders, activityLog, shareLinks tables)
- [x] 1.03 REST API endpoints for auth and file operations

### Feature 2: Authentication System ✅ COMPLETE
- [x] 2.01 User registration with bcrypt hashing
- [x] 2.02 JWT-based session management (7-day expiry)
- [ ] 2.03 OAuth providers (Google, GitHub) - deferred

### Feature 3: File Management API ✅ COMPLETE
- [x] 3.01 File upload endpoint (multipart, 100MB limit)
- [x] 3.02 File download and streaming
- [x] 3.03 Folder CRUD operations
- [x] 3.04 File preview thumbnails - Sharp-based for images

### Feature 4: Web Frontend ✅ COMPLETE
- [x] 4.01 Login/register pages with form validation
- [x] 4.02 Dashboard with file browser UI
- [x] 4.03 Drag-and-drop file upload
- [x] 4.04 Search, sort, and multi-select features

### Feature 5: Advanced Features ✅ COMPLETE
- [x] 5.01 Storage quotas per user (10GB default, displayed in UI)
- [x] 5.02 Share links with expiry
- [x] 5.03 Activity logs and audit trail

### Feature 6: Security Hardening ✅ COMPLETE
- [x] 6.01 Rate limiting (express-rate-limit)
- [x] 6.02 Input validation & sanitization
- [x] 6.03 CORS configuration (whitelist only)
- [x] 6.04 Refresh token rotation
- [x] 6.05 SSH key-based auth on Pi
- [x] 6.06 Database file permissions (chmod 600)
- [x] 6.07 Git history cleaned (credentials removed)

### Feature 7: Infrastructure ✅ COMPLETE
- [x] 7.01 SMB auto-mount systemd service
- [x] 7.02 Per-user storage isolation
- [x] 7.03 Cloudflare Tunnel for API exposure

### Feature 8: Mobile App (Phase 2)
- [ ] 8.01 Set up React Native or Flutter project
- [ ] 8.02 Mobile auth and file browser

---

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│      Vercel         │         │   Raspberry Pi       │
│   ┌─────────────┐   │   API   │   ┌─────────────┐   │
│   │   Vite +    │◀──┼─────────▶   │  Express    │   │
│   │ Vanilla JS  │   │ HTTPS   │   │  API        │   │
│   └─────────────┘   │         │   └──────┬──────┘   │
│                     │         │          │          │
│   Deployed: Vercel │         │   ┌──────▼──────┐   │
│                     │         │   │ SQLite DB   │   │
│                     │         │   └─────────────┘   │
│                     │         │          │          │
│                     │         │   ┌──────▼──────┐   │
│                     │         │   │ SMB Mount   │   │
│                     │         │   │192.168.1.254│   │
│                     │         │   │ /public     │   │
└─────────────────────┘         └──────────┬──────────┘
                                            │
                                    ┌───────┴───────┐
                                    │ Cloudflare    │
                                    │ Tunnel        │
                                    │ api.keypear  │
                                    └───────────────┘
```

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Vite + Vanilla JS | Lightweight SPA |
| Backend | Express.js | Runs on Pi |
| Database | SQLite | Local storage |
| File Storage | SMB Mount | 192.168.1.254/public |
| Auth | JWT + bcrypt | Local accounts |
| Deployment | Vercel + Cloudflare Tunnel | Frontend + API |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Get current user |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files` | List files (supports search, sort) |
| POST | `/api/files/upload` | Upload file |
| PATCH | `/api/files/:id` | Rename or move file |
| POST | `/api/files/:id/copy` | Copy file |
| POST | `/api/files/bulk-delete` | Bulk delete |
| GET | `/api/files/:id/download` | Download file |
| GET | `/api/files/:id/thumbnail` | Get thumbnail |
| DELETE | `/api/files/:id` | Soft delete |
| POST | `/api/files/:id/restore` | Restore from trash |

### Folders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/folders` | List folders |
| GET | `/api/folders/tree` | Get folder hierarchy |
| POST | `/api/folders` | Create folder |
| PATCH | `/api/folders/:id` | Rename or move folder |
| POST | `/api/folders/:id/copy` | Copy folder |
| DELETE | `/api/folders/:id` | Delete folder |

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://key-pear.vercel.app |
| Backend API | https://backend-api.pedroocalado.eu |
| Backend (local) | http://192.168.1.67:3001 |

---

## Progress: 28/30 tasks complete (93%)
