# AGENTS.md - keyPear Development Guide

## Project Overview

keyPear is a cloud storage application with an Astro frontend (React + Tailwind CSS + TypeScript) and an Express.js backend. Target: small teams (10-100 users).

## Project Structure

```
keyPear/
├── frontend/                 # Astro + React frontend
│   ├── src/
│   │   ├── components/      # React components (UI, FileBrowser, AuthForms, Settings)
│   │   ├── contexts/        # Auth, Query providers
│   │   ├── hooks/           # TanStack Query hooks (useFiles, useChunkedUpload)
│   │   ├── layouts/         # Astro layouts
│   │   ├── lib/             # Utilities, API client
│   │   └── pages/           # Astro pages (index, login, register, dashboard)
│   └── public/
│
├── backend/                  # Express.js API
│   └── src/
│       ├── controllers/     # (reserved)
│       ├── middleware/      # Auth middleware
│       ├── models/         # DB models (db, user, file, folder, session, share, activityLog, chunkUpload)
│       ├── routes/         # API routes (auth, files, folders, shares, chunks, logs, oauth)
│       ├── services/       # Business logic (passport, thumbnail)
│       └── server.js       # Express app
│
├── database/
│   └── migrations/         # SQL migrations
│
├── storage/                 # File storage (gitignored)
│   ├── user-files/
│   ├── thumbnails/
│   └── chunks/
│
├── docker-compose.yml        # All services
├── nginx.conf               # Nginx config
├── Makefile                # Docker commands
└── .env.example            # Environment template
```

## Commands

### Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Run only frontend (Astro dev server on port 4321)
npm run dev:frontend

# Run only backend (Express on port 3001)
npm run dev:backend
```

### Frontend

```bash
cd frontend

npm run dev              # Start Astro dev server (port 4321)
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint           # TypeScript validation
```

### Backend

```bash
cd backend

npm start               # Production server
npm run dev            # Development with nodemon
```

### Docker

```bash
make up               # Start all services
make up-monitor      # Start with monitoring
make down            # Stop services
make logs            # View logs
make clean           # Remove containers and volumes
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/oauth/google` | Google OAuth |
| GET | `/api/auth/oauth/github` | GitHub OAuth |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files` | List user files |
| POST | `/api/files/upload` | Upload single file |
| POST | `/api/files/chunks/upload/chunk` | Upload chunk |
| POST | `/api/files/chunks/upload/complete` | Complete chunked upload |
| GET | `/api/files/:id/download` | Download file |
| GET | `/api/files/:id/thumbnail` | Get thumbnail |
| DELETE | `/api/files/:id` | Delete file (soft) |
| POST | `/api/files/:id/restore` | Restore file |

### Folders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/folders` | List folders |
| POST | `/api/folders` | Create folder |
| PATCH | `/api/folders/:id` | Rename folder |
| DELETE | `/api/folders/:id` | Delete folder |

### Shares
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shares` | Create share link |
| GET | `/api/shares/:token` | Get share info |
| DELETE | `/api/shares/:id` | Delete share |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | Get activity logs |

## Code Style Guidelines

### General
- Use **2 spaces** for indentation
- Use **double quotes** for JSX, **single quotes** elsewhere
- Add **trailing commas** in multi-line objects/arrays
- Maximum line length: **100 characters** (soft limit)

### TypeScript
- **Strict mode** enabled in tsconfig.json
- Use **explicit types** for function params and returns
- Avoid `any` - use `unknown` when type is unknown
- Use **interfaces** for object shapes, **types** for unions

```typescript
// Good
interface User {
  id: string;
  email: string;
  name?: string;
}

function getUser(id: string): Promise<User | null> {
  // ...
}
```

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `login-form.astro` |
| Components | PascalCase | `FileBrowser.tsx` |
| Functions | camelCase | `getUserById()` |
| Variables | camelCase | `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Interfaces | PascalCase | `ApiResponse` |

### Imports Order
1. External (React, Astro, etc.)
2. Internal components/utils
3. Type imports
4. CSS/assets

### React/Astro Patterns
- Use **functional components** with hooks
- Destructure props with defaults
- Use **early returns**

```tsx
interface Props {
  title?: string;
}

export default function Component({ title = "Default" }: Props) {
  if (!title) return null;
  return <h1>{title}</h1>;
}
```

### Error Handling
- Use **try/catch** with async/await
- Return **consistent error responses**
- Log errors with context

```javascript
app.get('/api/resource', async (req, res) => {
  try {
    const data = await fetchResource();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Fetch resource failed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch' });
  }
});
```

## Frontend Architecture

### TanStack Query
Use hooks from `src/hooks/useFiles.ts`:

```typescript
import { useFiles, useFolders, useUploadFile, useActivityLogs } from './hooks/useFiles';

// Fetch files in folder
const { data, isLoading, refetch } = useFiles(folderId);

// Upload file
const upload = useUploadFile();
await upload.mutateAsync({ file, folderId });
```

### API Client
The `src/lib/api.ts` provides:
- Auto-refresh JWT tokens
- Cookie-based auth
- Consistent error handling

### Components
| Component | Purpose |
|-----------|---------|
| `FileBrowser.tsx` | Google Drive-style file manager |
| `AuthForms.tsx` | Login/register forms |
| `SettingsPage.tsx` | User settings |
| `ui/*` | shadcn/ui components |

## Backend Architecture

### Models
| Model | Purpose |
|-------|---------|
| `db.js` | PostgreSQL connection pool |
| `user.js` | User CRUD |
| `file.js` | File metadata |
| `folder.js` | Folder operations |
| `session.js` | JWT refresh tokens |
| `share.js` | Share links |
| `activityLog.js` | Audit trail |
| `chunkUpload.js` | Chunked upload tracking |

### Services
| Service | Purpose |
|---------|---------|
| `passport.js` | OAuth strategies |
| `thumbnail.js` | Image thumbnail generation |

### Middleware
| Middleware | Purpose |
|------------|---------|
| `auth.js` | JWT authentication |

## Environment Variables

### Required
```
PORT=3001
DATABASE_URL=postgresql://localhost:5432/keypear
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

### Optional
```
FRONTEND_URL=http://localhost:4321
STORAGE_PATH=./storage/user-files
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

## Database Schema

### Core Tables
- **users**: id, email, password_hash, oauth_provider, oauth_id, name, storage_used, storage_quota, created_at
- **folders**: id, user_id, parent_folder_id, name, created_at, deleted_at
- **files**: id, user_id, folder_id, filename, storage_path, thumbnail_path, size, mime_type, checksum, created_at, deleted_at
- **sessions**: id, user_id, refresh_token, expires_at
- **shares**: id, file_id, token, expires_at
- **activity_logs**: id, user_id, action, file_id, timestamp, metadata
- **chunk_uploads**: id, user_id, filename, total_chunks, total_size, upload_path, expires_at

## Testing

```bash
# Backend - add Jest
cd backend && npm install jest @types/jest

# Frontend - add Vitest
cd frontend && npm install vitest
```

## Ports

| Service | Port |
|---------|------|
| Frontend | 4321 |
| Backend API | 3001 |
| PostgreSQL | 5432 |
| MinIO | 9000 |
| MinIO Console | 9001 |
| Nginx | 80 |
| Grafana | 3000 |
| Prometheus | 9090 |

## Additional Notes

- Frontend runs on **port 4321** (Astro default)
- Backend runs on **port 3001**
- API endpoints: `http://localhost:3001/api/*`
- Storage: `storage/user-files/` (gitignored)
- Thumbnails: `storage/thumbnails/`
- Chunk uploads: `storage/chunks/` (temp)

<!-- Added: 2026-03-15 -->
## Cloudflare Tunnel Multi-Backend Setup for KeyPear

Cloudflare Tunnel can serve multiple backend applications through hostname-based routing using a single tunnel connection.

### Architecture
```
Client → Cloudflare Edge → Tunnel → Local cloudflared → Backend Services
                    ↑                    ↑                    ↑
              (DNS Lookup)     (Ingress Rules)     (Local Ports)
```

### Configuration File (~/.cloudflared/config.yml)
```yaml
tunnel: <tunnel-id>
credentials-file: /path/to/credentials.json

ingress:
  - hostname: api.keypear.pedroocalado.eu
    service: http://127.0.0.1:3001
    originRequest:
      noTLSVerify: true
  - hostname: homelab-backendpi.pedroocalado.eu
    service: http://127.0.0.1:3000
    originRequest:
      noTLSVerify: true
  - service: http_status:404  # Catch-all
```

### Setup Steps
1. Ensure backends running locally:
   - KeyPear API: port 3001
   - Other services: designated ports

2. Create tunnel:
   ```bash
   cloudflared tunnel create <tunnel-name>
   ```

3. Configure ingress rules in config.yml or Dashboard

4. Create DNS CNAME records:
   ```bash
   cloudflared tunnel route dns <tunnel-name> api.keypear.pedroocalado.eu
   cloudflared tunnel route dns <tunnel-name> homelab-backendpi.pedroocalado.eu
   ```

5. Start tunnel:
   ```bash
   cloudflared tunnel run <tunnel-name>
   ```

6. Cloudflare Settings:
   - SSL/TLS → Encryption Mode: Flexible
   - DNS records: Proxy status = Proxied

### Verification
- Tunnel info: `cloudflared tunnel info <tunnel-name>`
- DNS check: `dig <hostname> CNAME`
- Config sync: `curl http://127.0.0.1:20241/metrics | grep config_version`
- Endpoint test: `curl -I https://<hostname>/`

### Troubleshooting
If endpoints timeout:
1. Verify local backends: `curl http://127.0.0.1:<port>/`
2. Check tunnel running: `ps aux | grep cloudflared`
3. Verify DNS: `dig <hostname>`
4. Check config version in metrics
5. Look for "Updated to new configuration" in tunnel logs
6. Test HTTP to bypass SSL: `curl -v http://<hostname>/`

### Best Practices
- Keep ingress rules in version-controlled config.yml
- Use noTLSVerify: true only for local HTTP services
- Always include catch-all rule
- Monitor tunnel metrics and logs
- Test with HTTP first during debugging

<!-- Added: 2026-03-19 -->
## Cloudflare Tunnel Setup for KeyPear API

To expose the KeyPear API running on Raspberry Pi (port 3001) via Cloudflare Tunnel:

### Prerequisites
- Domain managed by Cloudflare (pedroocalado.eu)
- Existing wildcard SSL certificate: *.pedroocalado.eu (covers subdomains like api.pedroocalado.eu)
- KeyPear backend running locally on port 3001
- cloudflared installed

### Steps

1. **Create Tunnel**
   ```bash
   cloudflared tunnel create keyPear-api
   # Save the generated tunnel ID and credentials file path
   ```

2. **Configure Tunnel** (~/.cloudflared/config.yml)
   ```yaml
   tunnel: <tunnel-id-from-step-1>
   credentials-file: /path/to/credentials.json

   ingress:
     - hostname: api.pedroocalado.eu  # Must match existing wildcard cert
       service: http://127.0.0.1:3001
       originRequest:
         noTLSVerify: true  # For local HTTP service
     - service: http_status:404  # Catch-all
   ```

3. **Route DNS**
   ```bash
   cloudflared tunnel route dns keyPear-api api.pedroocalado.eu
   ```

4. **Start Tunnel**
   ```bash
   cloudflared tunnel run keyPear-api
   # Or run as service:
   # sudo systemctl start cloudflared-keyPear-api
   ```

5. **Verify Setup**
   - Check tunnel status: `cloudflared tunnel list`
   - Verify DNS: `dig api.pedroocalado.eu CNAME`
   - Test endpoint: `curl https://api.pedroocalado.eu/api/auth/me`
   - Check config version: `curl http://127.0.0.1:20241/metrics | grep config_version`

### Troubleshooting

- **SSL Handshake Failure**: Ensure hostname in config.yml matches a domain covered by your Cloudflare SSL certificate
- **502 Errors**: Verify backend is running on configured port (3001)
- **Config Version 0**: Tunnel is managed via Dashboard, not local config. Delete tunnel from Dashboard first, then recreate with local config
- **Connection Refused**: Check cloudflared logs: `journalctl -u cloudflared -f` or check /tmp/cloudflared.log

### Notes
- Universal SSL certificates for new subdomains can take 5-30 minutes to provision
- Use subdomains covered by existing certificates (like *.pedroocalado.eu) for immediate availability
- Keep tunnel process running for continued access
- For production, consider running cloudflared as a systemd service
