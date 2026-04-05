# AGENTS.md - keyPear Development Guide

## Project Overview

keyPear is a self-hosted cloud storage application for small teams (10-100 users). Vanilla JS SPA frontend with Vite + Tailwind CSS, Express.js backend with SQLite (sql.js). Deployed on Raspberry Pi via Cloudflare Tunnel. Authentication uses Sign-In With Ethereum (SIWE, EIP-4361) via MetaMask — no passwords, no emails.

## Project Structure

```
keyPear/
├── frontend/
│   ├── src/
│   │   ├── lib/             # api.ts (API client), web3.js (SIWE helpers), utils.ts
│   │   ├── pages/           # Page renderers (web3-login.js, dashboard.js, settings.js)
│   │   ├── router.js        # Client-side SPA router
│   │   └── main.js          # Entry point
│   └── vite.config.js
│
├── backend/
│   └── src/
│       ├── middleware/      # auth.js (JWT verification)
│       ├── models/          # DB models (user, file, folder, session, share, activityLog, chunkUpload)
│       ├── routes/          # API routes (auth, auth/web3, files, folders, shares, chunks, logs)
│       ├── services/        # nonceStore.js (SIWE nonces), thumbnail.js (image processing)
│       └── server.js        # Express app entry
│
├── database/migrations/     # SQL schema (PostgreSQL syntax, used with sql.js at runtime)
├── docker-compose.yml       # Backend, frontend, nginx, prometheus, grafana
├── Makefile                 # Docker shortcuts
└── storage/                 # user-files, thumbnails, chunks (gitignored)
```

## Commands

### Development

```bash
npm run dev              # Run both frontend + backend concurrently
npm run dev:frontend     # Frontend only (Vite, port 3000)
npm run dev:backend      # Backend only (Express, port 3001)
```

### Frontend

```bash
cd frontend
npm run dev              # Start Vite dev server (port 3000)
npm run build            # Build for production
npm run preview          # Preview production build
```

### Backend

```bash
cd backend
npm run dev              # Development with node --watch
npm start                # Production server
```

### Docker

```bash
make up                  # Start all services
make down                # Stop services
make logs                # View logs
make clean               # Remove containers and volumes
```

### Database

Database auto-creates at `backend/data/keypear.db` (SQLite via sql.js). Reset with `make db-reset`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/web3/nonce` | Get nonce for SIWE challenge |
| POST | `/api/auth/web3/verify` | Verify SIWE signature, authenticate |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh JWT |
| GET | `/api/files` | List files |
| POST | `/api/files/upload` | Upload file |
| POST | `/api/files/chunks/upload/chunk` | Upload chunk |
| POST | `/api/files/chunks/upload/complete` | Complete chunked upload |
| GET | `/api/files/:id/download` | Download file |
| GET | `/api/files/:id/thumbnail` | Get thumbnail |
| DELETE | `/api/files/:id` | Soft delete file |
| POST | `/api/files/:id/restore` | Restore file |
| GET/POST/PATCH/DELETE | `/api/folders` | Folder CRUD |
| POST/GET/DELETE | `/api/shares` | Share links |
| GET | `/api/logs` | Activity logs |

## Code Style

### General
- **2 spaces** indentation
- **Single quotes** in JS, **double quotes** in JSX/TSX
- **Trailing commas** in multi-line objects/arrays
- **100 char** soft line limit

### JavaScript/TypeScript
- ES Modules (`"type": "module"` in package.json)
- Use `import`/`export`, not `require`
- Backend: mix of `.js` and `.ts` files (transitional state)
- Frontend: `.js` for pages/router, `.tsx` for UI components, `.ts` for hooks/lib
- Avoid `any` — use `unknown` when type is uncertain
- Use **interfaces** for object shapes, **types** for unions

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `auth-forms.tsx` |
| Components | PascalCase | `FileBrowser.tsx` |
| Functions | camelCase | `getUserById()` |
| Variables | camelCase | `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| DB columns | snake_case | `created_at`, `user_id` |

### Imports Order
1. Node built-ins (`fs`, `path`, `crypto`)
2. External packages (`express`, `uuid`, `sharp`)
3. Internal modules (`../models/index.js`, `../middleware/auth.js`)
4. Types (last)

### Error Handling
- Use **try/catch** with async/await
- Return consistent JSON: `{ error: 'message' }` for errors, `{ data }` for success
- Log errors with `console.error` (never `console.log` in production)
- HTTP 400 for validation/quota, 401 for auth, 403 for forbidden, 404 for not found, 500 for server

### Security
- Filenames must be sanitized via `sanitizeFilename()` (HTML entity escaping + char replacement)
- File paths must be validated with `assertInsideStorage()` before disk access
- Storage quota checked before upload writes to disk
- No `console.log` in production code (use `console.error` for errors only)

### Backend Patterns
- Express Router per resource (`routes/files.js`, `routes/folders.js`)
- Auth middleware via `authenticate` from `middleware/auth.js`
- Models export plain functions (not classes): `User.findById(id)`, `File.create(data)`
- Routes: `router.get('/', authenticate, async (req, res) => { ... })`
- Use `req.user.id` after auth middleware for user-scoped queries

### Frontend Patterns
- SPA with manual client-side routing (`router.js`)
- Pages export render function + init function: `export function dashboardPage() { return html; }`
- Use `api` utility from `lib/api.ts` for all API calls (handles JWT refresh)
- Use `web3.js` for MetaMask integration (SIWE message building, signing)
- Tailwind CSS classes for styling (v4)
- No React/Vue — vanilla JS DOM manipulation

## Ports

| Service | Port |
|---------|------|
| Frontend (Vite) | 3000 |
| Backend API | 3001 |
| Nginx | 80 |
| Grafana | 3000 |
| Prometheus | 9090 |

## Environment

Required: copy `.env.example` to `.env`. Key vars: `PORT`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `STORAGE_PATH`, `FRONTEND_URL`, `SIWE_CHAIN_ID`.

## Environment Requirements

The following env vars **must** be set (server refuses to start auth routes without them):
- `JWT_ACCESS_SECRET` — separate secret for access tokens
- `JWT_REFRESH_SECRET` — separate secret for refresh tokens (must differ from access)
