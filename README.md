# keyPear - Cloud Storage Platform

A web-based storage-as-a-service application with local backend infrastructure supporting user authentication (local + OAuth) and file management. Built with Astro, Express.js, and PostgreSQL.

![keyPear](https://img.shields.io/badge/keyPear-v1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **User Authentication**: Email/password + OAuth (Google, GitHub)
- **File Management**: Upload, download, organize in folders
- **Chunked Uploads**: Large file support with progress tracking
- **File Previews**: Automatic thumbnails for images
- **Share Links**: Create public share links with expiry
- **Storage Quotas**: 10GB default per user
- **Activity Logs**: Full audit trail

## Tech Stack

### Frontend
- **Framework**: Astro 4.x with React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State**: TanStack Query
- **Icons**: Lucide React
- **Forms**: React Dropzone

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js 5
- **Database**: PostgreSQL 16
- **Auth**: JWT + Passport.js
- **Validation**: Zod
- **Images**: Sharp

### Infrastructure
- **Container**: Docker + Docker Compose
- **Proxy**: Nginx
- **Storage**: MinIO (S3-compatible)
- **Monitoring**: Prometheus + Grafana

## Project Structure

```
keyPear/
├── frontend/                 # Astro + React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # Auth, Query providers
│   │   ├── hooks/           # TanStack Query hooks
│   │   ├── layouts/         # Astro layouts
│   │   ├── lib/             # Utilities, API client
│   │   └── pages/           # Astro pages
│   └── public/
│
├── backend/                  # Express.js API
│   └── src/
│       ├── controllers/     # Route controllers
│       ├── middleware/      # Auth middleware
│       ├── models/          # Database models
│       ├── routes/          # API routes
│       ├── services/        # Business logic
│       └── utils/           # Utilities
│
├── database/
│   └── migrations/          # SQL migrations
│
├── storage/                  # File storage
│   ├── user-files/          # User uploads
│   ├── thumbnails/          # Image thumbnails
│   └── chunks/              # Temporary chunk storage
│
├── docker-compose.yml        # All services
├── nginx.conf               # Nginx config
└── Makefile                # Docker commands
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Development Setup

1. **Clone and install dependencies:**
```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend && npm install

# Backend dependencies
cd ../backend && npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your values
```

3. **Start development servers:**
```bash
# From root - runs both frontend and backend
npm run dev
```

### Docker Setup

1. **Configure environment:**
```bash
cp .env.docker .env
# Edit .env with secure passwords
```

2. **Start services:**
```bash
# Using Makefile
make up

# Or directly
docker-compose up -d
```

3. **Access the app:**
- Frontend: http://localhost
- Backend API: http://localhost:3001
- Grafana (monitoring): http://localhost:3000

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/oauth/google` | GET | Google OAuth |
| `/api/auth/oauth/github` | GET | GitHub OAuth |

### Files

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/files` | GET | List user files |
| `/api/files/upload` | POST | Upload single file |
| `/api/files/chunks/upload/chunk` | POST | Upload chunk |
| `/api/files/chunks/upload/complete` | POST | Complete chunked upload |
| `/api/files/:id/download` | GET | Download file |
| `/api/files/:id/thumbnail` | GET | Get thumbnail |
| `/api/files/:id` | DELETE | Delete file (soft) |
| `/api/files/:id/restore` | POST | Restore file |

### Folders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/folders` | GET | List folders |
| `/api/folders` | POST | Create folder |
| `/api/folders/:id` | PATCH | Rename folder |
| `/api/folders/:id` | DELETE | Delete folder |
| `/api/folders/:id/restore` | POST | Restore folder |

### Shares

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/shares` | POST | Create share link |
| `/api/shares/:token` | GET | Get share info |
| `/api/shares/:id` | DELETE | Delete share |

### Activity Logs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/logs` | GET | Get activity logs |

## Frontend Development

### Available Scripts

```bash
cd frontend

npm run dev          # Start dev server (port 4321)
npm run build         # Build for production
npm run preview      # Preview production build
npm run lint         # Run type checking
```

### Adding Components

This project uses shadcn/ui components. To add a new component:

```bash
# Manual - copy from shadcn/ui docs
# Components are in src/components/ui/
```

### State Management

Use TanStack Query hooks from `src/hooks/useFiles.ts`:

```typescript
import { useFiles, useFolders, useUploadFile } from './hooks/useFiles';

// Fetch files
const { data, isLoading } = useFiles(folderId);

// Upload file
const upload = useUploadFile();
upload.mutate({ file, folderId });
```

## Backend Development

### Available Scripts

```bash
cd backend

npm start            # Start production server
npm run dev         # Start with nodemon
```

### Database

Run migrations:
```bash
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
```

### Adding Routes

1. Create route file in `src/routes/`
2. Add model functions in `src/models/`
3. Register in `src/server.js`

## Deployment

### Production with Docker

```bash
# Build images
make build

# Deploy
make deploy
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | 3001 |
| `DATABASE_URL` | PostgreSQL connection | postgres://localhost:5432/keypear |
| `JWT_ACCESS_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `FRONTEND_URL` | Frontend URL | http://localhost:4321 |
| `STORAGE_PATH` | File storage directory | ./storage/user-files |

## Monitoring

Start with monitoring stack:
```bash
make up-monitor
```

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

## License

MIT
