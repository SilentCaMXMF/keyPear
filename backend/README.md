# KeyPear Backend API

A Node.js/Express REST API for the KeyPear cloud storage application. Designed to run on Raspberry Pi with SQLite storage and SMB mount for file persistence.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Express API (Port 3001)                 │
├─────────────────────────────────────────────────────────────┤
│  Routes          │  Models      │  Services    │ Middleware │
│  ─────────────  │  ──────────  │  ──────────  │ ───────── │
│  auth           │  User        │  database    │ authenticate│
│  files          │  File        │  thumbnail   │ rateLimit  │
│  folders        │  Folder      │  passport    │            │
│  shares         │  Session     │              │            │
│  chunks         │  Share       │              │            │
│  logs           │  ActivityLog │              │            │
│                 │  ChunkUpload │              │            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Storage Layer                           │
├────────────────────────────┬────────────────────────────────┤
│   SQLite (keypear.db)     │   SMB Mount (/mnt/keypear)     │
│   - Users                 │   - user-files/                │
│   - Files metadata        │   - thumbnails/                │
│   - Folders               │   - chunks/                   │
│   - Sessions              │                               │
│   - Shares                │                               │
│   - Activity Logs          │                               │
└────────────────────────────┴────────────────────────────────┘
```

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 18+ | JavaScript runtime |
| Framework | Express.js | REST API framework |
| Database | SQLite (sql.js) | Lightweight database |
| File Storage | SMB Mount | NAS storage for files |
| Auth | JWT + bcrypt | Stateless authentication |
| Image Processing | Sharp | Thumbnail generation |
| Security | Helmet, CORS, Rate Limiting | Security hardening |

## Quick Start

### Prerequisites
- Node.js 18+
- SMB access to NAS (or local storage for development)

### Installation

```bash
# Clone repository
git clone https://github.com/SilentCaMXMF/keyPear.git
cd keyPear/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev

# Or start production server
npm start
```

### Environment Variables

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_PATH=./data/keypear.db

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Frontend URL (for CORS)
FRONTEND_URL=https://key-pear.vercel.app

# Storage
SMB_MOUNT_PATH=/home/pedroocalado/keypear_mount
STORAGE_PATH=./storage
```

## Project Structure

```
backend/
├── src/
│   ├── server.js          # Express app entry point
│   ├── middleware/
│   │   └── auth.js        # JWT authentication middleware
│   ├── models/
│   │   ├── index.js       # Database connection
│   │   ├── user.js       # User CRUD operations
│   │   ├── file.js       # File metadata operations
│   │   ├── folder.js     # Folder operations
│   │   ├── session.js     # JWT session management
│   │   ├── share.js      # Share link operations
│   │   ├── activityLog.js # Activity audit logging
│   │   └── chunkUpload.js # Chunked upload tracking
│   ├── routes/
│   │   ├── auth.js       # Authentication endpoints
│   │   ├── files.js      # File operations
│   │   ├── folders.js     # Folder operations
│   │   ├── shares.js     # Share link operations
│   │   ├── chunks.js      # Chunked upload endpoints
│   │   └── logs.js       # Activity log endpoints
│   ├── services/
│   │   ├── database.js   # SQLite connection (sql.js)
│   │   ├── thumbnail.js   # Sharp-based thumbnail generation
│   │   └── passport.js    # OAuth strategies (future)
│   └── utils/
│       └── ...
├── data/                   # SQLite database location
├── storage/               # Local file storage (dev)
│   ├── user-files/
│   ├── thumbnails/
│   └── chunks/
├── systemd/
│   ├── keypear-api.service  # Systemd service for autostart
│   └── keypear-smb.service  # SMB mount service
├── Dockerfile
├── entrypoint.sh
└── package.json
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create new account |
| POST | `/login` | Login, returns JWT tokens |
| POST | `/logout` | Logout, invalidates refresh token |
| POST | `/refresh` | Refresh access token |
| GET | `/me` | Get current user info |
| PATCH | `/me` | Update user profile |

**Register Request:**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Login Response:**
```json
{
  "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### Files (`/api/files`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List files (with folderId, search, sort params) |
| POST | `/upload` | Upload single file (multipart) |
| GET | `/:id` | Get file metadata |
| PATCH | `/:id` | Update file (rename, move) |
| DELETE | `/:id` | Soft delete file (or permanent with ?permanent=true) |
| POST | `/:id/restore` | Restore deleted file |
| POST | `/:id/copy` | Copy file to folder |
| GET | `/:id/download` | Download file |
| GET | `/:id/thumbnail` | Get thumbnail image |
| GET | `/trash` | List deleted files |
| GET | `/recent` | List recent files |

**List Files Query Parameters:**
```
GET /api/files?folderId=uuid&search=document&sort=created_at&order=DESC
```

**Update File (Rename/Move):**
```json
PATCH /api/files/:id
{
  "name": "new-filename.pdf"    // Rename
}
```
```json
PATCH /api/files/:id
{
  "folderId": "parent-folder-uuid"  // Move to folder (null for root)
}
```

### Folders (`/api/folders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List folders |
| POST | `/` | Create folder |
| PATCH | `/:id` | Update folder (rename, move) |
| DELETE | `/:id` | Soft delete folder |
| POST | `/:id/restore` | Restore deleted folder |
| POST | `/:id/copy` | Copy folder |
| GET | `/tree` | Get folder tree structure |
| GET | `/trash` | List deleted folders |

### Shares (`/api/shares`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's share links |
| GET | `/shared-with-me` | List files shared with user |
| POST | `/` | Create share link |
| GET | `/:token` | Get share info (public) |
| DELETE | `/:id` | Delete share link |

**Create Share:**
```json
POST /api/shares
{
  "fileId": "file-uuid",
  "expiresIn": 86400,           // Optional: expires in seconds
  "sharedWithEmail": "user@example.com"  // Optional: email sharing
}
```

### Chunked Uploads (`/api/files/chunks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/chunk` | Upload a chunk |
| POST | `/upload/complete` | Complete upload, merge chunks |

**Chunk Upload Flow:**
1. POST `/upload/chunk` with chunk data
2. Receive `uploadId` for subsequent chunks
3. POST `/upload/complete` with `uploadId` when all chunks uploaded

### Activity Logs (`/api/logs`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user's activity logs |

## Database Schema

> **Note:** This implementation uses SQLite (sql.js), so all types are stored as TEXT/INTEGER internally. The types below show the logical data type, not the SQLite storage type.

### users
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| email | TEXT | Unique email |
| password_hash | TEXT | bcrypt hash |
| oauth_provider | TEXT | google/github |
| oauth_id | TEXT | OAuth ID |
| name | TEXT | Display name |
| storage_used | INTEGER | Bytes used |
| storage_quota | INTEGER | Default 10GB (10737418240) |
| created_at | TEXT | ISO timestamp |

### files
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT (UUID) | Owner reference |
| folder_id | TEXT (UUID) | Parent folder (null = root) |
| filename | TEXT | Display name |
| storage_path | TEXT | Actual file path |
| thumbnail_path | TEXT | Thumbnail path |
| size | INTEGER | File size in bytes |
| mime_type | TEXT | MIME type |
| checksum | TEXT | SHA-256 hash |
| created_at | TEXT | ISO timestamp |
| deleted_at | TEXT | ISO timestamp (null if not deleted) |

### folders
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT (UUID) | Owner reference |
| parent_folder_id | TEXT (UUID) | Parent folder (null = root) |
| name | TEXT | Folder name |
| created_at | TEXT | ISO timestamp |
| deleted_at | TEXT | ISO timestamp (null if not deleted) |

### shares
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| file_id | TEXT (UUID) | Referenced file |
| token | TEXT | Unique share token |
| expires_at | TEXT | ISO timestamp (null = never) |
| shared_with_email | TEXT | Email sharing (optional) |
| shared_with_user_id | TEXT (UUID) | User-to-user sharing (optional) |
| created_at | TEXT | ISO timestamp |

### sessions
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT (UUID) | User reference |
| refresh_token | TEXT | JWT refresh token |
| expires_at | TEXT | ISO timestamp |
| created_at | TEXT | ISO timestamp |

### activity_logs
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT (UUID) | User reference |
| action | TEXT | Action type |
| file_id | TEXT (UUID) | Related file |
| timestamp | TEXT | ISO timestamp |
| metadata | TEXT | JSON string |

### chunk_uploads
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT (UUID) | User reference |
| filename | TEXT | Original filename |
| total_chunks | INTEGER | Total chunks expected |
| total_size | INTEGER | Total file size |
| mime_type | TEXT | MIME type |
| folder_id | TEXT (UUID) | Destination folder |
| upload_path | TEXT | Temp storage path |
| created_at | TEXT | ISO timestamp |
| expires_at | TEXT | ISO timestamp |

## Security Features

### Rate Limiting
- **Global:** 1000 requests per 15 minutes
- **Auth endpoints:** 20 requests per 15 minutes

### CORS
Whitelist includes:
- `https://key-pear.vercel.app`
- `*.vercel.app` (subdomains)
- `http://localhost:4321` (development)

### Authentication Flow
```
1. User registers/logs in → receives access + refresh tokens
2. Access token expires after 15 minutes
3. Frontend uses refresh token to get new access token
4. Refresh token rotation: old token is invalidated on use
5. Logout invalidates refresh token
```

## File Storage

### Storage Path Resolution
```javascript
// Priority: SMB_MOUNT_PATH > local storage
const basePath = process.env.SMB_MOUNT_PATH 
  ? path.join(SMB_MOUNT_PATH, 'keypear_files')
  : path.join(__dirname, '../../storage/user-files');
```

### File Naming
Files are stored with UUID suffix for uniqueness:
```
original_name.pdf  →  original_name_<uuid>.pdf
```

### Thumbnail Generation
Images generate thumbnails on upload via Sharp:
- Max size: 200x200px
- Format: JPEG
- Location: `storage/thumbnails/<file-id>.jpg`

## Systemd Services

### keypear-api.service
Auto-starts backend on boot:
```bash
sudo systemctl enable keypear-api
sudo systemctl start keypear-api
```

### keypear-smb.service  
Mounts SMB share before API starts:
```bash
sudo systemctl enable keypear-smb
sudo systemctl start keypear-smb
```

## Deployment on Raspberry Pi

### 1. Clone and Setup
```bash
ssh pi@192.168.1.67
git clone https://github.com/SilentCaMXMF/keyPear.git
cd keypear/backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env  # Set JWT secrets, database path, etc.
```

### 3. Run Migrations
```bash
# SQLite (sql.js auto-creates tables on first run)
# No migration steps needed - database is created automatically
```

### 4. Install Systemd Services
```bash
sudo cp systemd/keypear-smb.service /etc/systemd/system/
sudo cp systemd/keypear-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable keypear-smb keypear-api
sudo systemctl start keypear-smb keypear-api
```

### 5. Cloudflare Tunnel (for public access)
```bash
# Install cloudflared
# Create tunnel at cloudflare.com/now/tunnels
# Configure ~/.cloudflared/config.yml:
#   tunnel: <tunnel-id>
#   ingress:
#     - hostname: backend-api.pedroocalado.eu
#       service: http://127.0.0.1:3001
#       originRequest:
#         noTLSVerify: true
#     - service: http_status:404

cloudflared tunnel run keypear-api
```

## Activity Log Actions

| Action | Description |
|--------|-------------|
| `user_register` | New user registration |
| `user_login` | User login |
| `file_upload` | File uploaded |
| `file_delete` | File soft-deleted |
| `file_rename` | File renamed |
| `file_move` | File moved to folder |
| `file_restore` | File restored from trash |
| `folder_create` | Folder created |
| `folder_delete` | Folder deleted |
| `folder_rename` | Folder renamed |
| `folder_move` | Folder moved |
| `folder_restore` | Folder restored |
| `share_create` | Share link created |

## Development

### Run with Watch Mode
```bash
npm run dev
```

### Database Reset (SQLite)
```bash
rm data/keypear.db
# Restart server - db auto-creates
```

### Testing API
```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}' \
  | jq -r '.accessToken')

# Upload file
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/file.pdf"
```

## Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure FRONTEND_URL for CORS
- [ ] Set up SMB mount with proper credentials
- [ ] Enable systemd services for auto-start
- [ ] Configure Cloudflare Tunnel for public API
- [ ] Set up database backup strategy
- [ ] Configure monitoring (future)

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### SMB Mount Issues
```bash
# Check mount status
mount | grep cifs

# Manual mount
sudo mount -t cifs //192.168.1.254/public /home/pedroocalado/keypear_mount \
  -o credentials=/home/pedroocalado/.smbcredentials,vers=1.0,sec=ntlmssp
```

### Database Locked
```bash
# For SQLite, check for stuck processes
ps aux | grep node
# Restart the service
sudo systemctl restart keypear-api
```

## License

MIT License - See main project LICENSE
