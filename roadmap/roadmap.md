---
feature: "Storage as a Service (STaaS) Platform"
spec: |
  Build a web-based storage-as-a-service application with local backend infrastructure supporting user authentication (local + OAuth) and file management. Later expand to mobile apps. Target: small teams (10-100 users).
---

## Task List

### Feature 1: Foundation & Architecture
Description: Project setup, architecture, and API design
- [x] 1.01 Set up project structure, choose tech stack (Astro frontend + Node.js/Express backend)
- [x] 1.02 Design database schema (users, files, folders, sessions)
- [x] 1.03 Plan REST API endpoints for auth and file operations

### Feature 2: Authentication System
Description: User authentication system with local and social login
- [x] 2.01 Implement user registration and login with bcrypt hashing (12 rounds, Zod validation)
- [x] 2.02 Implement JWT-based session management (access: 15min, refresh: 7d, separate secrets)
- [x] 2.03 Set up OAuth providers (Google, GitHub) with Passport.js

### Feature 3: File Management
Description: Core file storage and management functionality
- [ ] 3.01 Create file upload endpoint with chunking for large files
- [x] 3.02 Implement file download and streaming
- [x] 3.03 Build file/folder organization (CRUD operations)
- [ ] 3.04 Add file preview thumbnails for images

### Feature 4: Web Frontend
Description: Web frontend for authentication and file management
- [x] 4.01 Build login/register pages
- [ ] 4.02 Create dashboard with file browser UI
- [ ] 4.03 Implement drag-and-drop file upload
- [ ] 4.04 Add user settings/profile page

### Feature 5: Advanced Features
Description: Advanced features for production use
- [x] 5.01 Add storage quotas per user (10GB default, tracked in DB)
- [x] 5.02 Implement share links with expiry
- [x] 5.03 Add activity logs and audit trail

### Feature 6: Mobile App (Phase 2)
Description: Mobile app version for iOS and Android
- [ ] 6.01 Set up React Native or Flutter project
- [ ] 6.02 Build mobile auth flow
- [ ] 6.03 Implement file browser for mobile
- [ ] 6.04 Add camera/upload functionality
