# Project Roadmap

## Project Overview
Build a web-based storage-as-a-service application with local backend infrastructure supporting user authentication (local + OAuth) and file management. Target small teams (10-100 users).

## Features

### Feature 1: Foundation & Architecture (0/3 complete)
Description: Project setup, architecture, and API design
- 1.01 ○ Set up project structure, choose tech stack (recommend: Astro frontend + Node.js/Express backend)
- 1.02 ○ Design database schema (users, files, folders, sessions)
- 1.03 ○ Plan REST API endpoints for auth and file operations

### Feature 2: Authentication System (0/3 complete)
Description: User authentication system with local and social login
- 2.01 ○ Implement user registration and login with bcrypt hashing
- 2.02 ○ Implement JWT-based session management
- 2.03 ○ Set up OAuth providers (Google, GitHub)

### Feature 3: File Management (0/4 complete)
Description: Core file storage and management functionality
- 3.01 ○ Create file upload endpoint with chunking for large files
- 3.02 ○ Implement file download and streaming
- 3.03 ○ Build file/folder organization (CRUD operations)
- 3.04 ○ Add file preview thumbnails for images

### Feature 4: Web Frontend (0/4 complete)
Description: Web frontend for authentication and file management
- 4.01 ○ Build login/register pages
- 4.02 ○ Create dashboard with file browser UI
- 4.03 ○ Implement drag-and-drop file upload
- 4.04 ○ Add user settings/profile page

### Feature 5: Advanced Features (0/3 complete)
Description: Advanced features for production use
- 5.01 ○ Add storage quotas per user
- 5.02 ○ Implement share links with expiry
- 5.03 ○ Add activity logs and audit trail

### Feature 6: Mobile App (Phase 2) (0/4 complete)
Description: Mobile app version for iOS and Android
- 6.01 ○ Set up React Native or Flutter project
- 6.02 ○ Build mobile auth flow
- 6.03 ○ Implement file browser for mobile
- 6.04 ○ Add camera/upload functionality