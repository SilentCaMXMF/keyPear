---
feature: "Storage as a Service (STaaS) Platform"
spec: |
  Lightweight web storage app for Raspberry Pi 3B+ (1GB RAM). Vanilla JS frontend + Express backend + SQLite + SMB storage. Target: small teams (10-100 users).
---

## Task List

### Feature 1: Foundation & Architecture ✅ COMPLETE
Description: Project setup, architecture, and API design
- [x] 1.01 Set up project structure (Vite + Vanilla JS frontend, Express + TypeScript backend)
- [x] 1.02 Design database schema (users, files, folders, activityLog, shareLinks tables)
- [x] 1.03 REST API endpoints for auth and file operations

### Feature 2: Authentication System ✅ COMPLETE
Description: User authentication with local accounts
- [x] 2.01 User registration with bcrypt hashing
- [x] 2.02 JWT-based session management (7-day expiry)
- [ ] 2.03 OAuth providers (Google, GitHub) - deferred

### Feature 3: File Management API ✅ COMPLETE
Description: Core file storage via SMB mount
- [x] 3.01 File upload endpoint (multipart, 100MB limit)
- [x] 3.02 File download and streaming
- [x] 3.03 Folder CRUD operations
- [ ] 3.04 File preview thumbnails - deferred

### Feature 4: Web Frontend ✅ COMPLETE
Description: Lightweight vanilla JS frontend
- [x] 4.01 Login/register pages with form validation
- [x] 4.02 Dashboard with file browser UI
- [x] 4.03 Drag-and-drop file upload
- [x] 4.04 User settings/profile page

### Feature 5: Advanced Features ✅ COMPLETE
Description: Production-ready features
- [x] 5.01 Storage quotas per user (10GB default, implemented in DB)
- [x] 5.02 Share links with expiry
- [x] 5.03 Activity logs and audit trail

### Feature 6: Mobile App (Phase 2)
Description: Mobile app for iOS/Android
- [ ] 6.01 Set up React Native or Flutter project
- [ ] 6.02 Mobile auth and file browser

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
│                     │         │   │  SQLite DB   │   │
│                     │         │   └─────────────┘   │
│                     │         │          │          │
│                     │         │   ┌──────▼──────┐   │
│                     │         │   │  SMB Mount   │   │
│                     │         │   │192.168.1.254│   │
│                     │         │   │   /public    │   │
│                     │         │   └─────────────┘   │
└─────────────────────┘         └──────────┬──────────┘
                                           │
                                   ┌───────┴───────┐
                                   │  ngrok tunnel │
                                   │  *.ngrok.io   │
                                   └───────────────┘
```

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Vite + Vanilla JS | Lightweight, ~50KB |
| Backend | Express.js + TypeScript | Runs on Pi |
| Database | SQLite (better-sqlite3) | Local |
| File Storage | SMB Mount | 192.168.1.254/public |
| Auth | JWT + bcrypt | Local accounts |
| Deployment | Vercel (frontend) + ngrok | API tunnel |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
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

## Database Schema

### users
- id (TEXT, PK)
- name (TEXT)
- email (TEXT, UNIQUE)
- password (TEXT)
- storageQuota (INTEGER, default 10GB)
- storageUsed (INTEGER)
- createdAt (TEXT)
- updatedAt (TEXT)

### files
- id (TEXT, PK)
- userId (TEXT, FK)
- name (TEXT)
- path (TEXT)
- size (INTEGER)
- mimeType (TEXT)
- storagePath (TEXT)
- isFolder (INTEGER)
- parentId (TEXT, FK)
- createdAt (TEXT)
- updatedAt (TEXT)

### activityLog
- id (TEXT, PK)
- userId (TEXT, FK)
- action (TEXT)
- fileId (TEXT, FK)
- details (TEXT)
- createdAt (TEXT)

### shareLinks
- id (TEXT, PK)
- fileId (TEXT, FK)
- token (TEXT, UNIQUE)
- expiresAt (TEXT)
- createdAt (TEXT)

---

## Progress: 12/21 tasks complete (57%)
