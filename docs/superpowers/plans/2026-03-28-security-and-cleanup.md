# Security Fixes & Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical security vulnerabilities (XSS, path traversal, JWT secret fallback), fix data integrity bugs (DB not saving, missing tables, quota unchecked), remove dead code, and standardize error responses.

**Architecture:** Backend-only changes across security, database, and route files. No frontend changes except removing dead React/Astro code. Each task is self-contained and can be verified independently.

**Tech Stack:** Express.js, sql.js (SQLite), JWT, Node.js

---

## File Map

| File | Changes |
|------|---------|
| `backend/src/routes/auth.js` | JWT secret fallback fix, remove console.logs |
| `backend/src/routes/files.js` | XSS filename sanitize, path traversal fix, async I/O, remove console.logs |
| `backend/src/routes/chunks.js` | Async I/O, remove console.logs |
| `backend/src/routes/folders.js` | Standardize error shape, remove console.logs, fix `require()` call |
| `backend/src/routes/shares.js` | Standardize error shape |
| `backend/src/routes/index.js` | Remove (unused, uses CJS `require`) |
| `backend/src/services/database.js` | Save after writes, add missing tables, add indexes |
| `backend/src/models/folder.js` | Fix `require('fs')` to `import fs` |
| `backend/src/models/chunkUpload.js` | Add `deleteExpired` method |
| `backend/src/server.js` | Add expired chunk cleanup cron |
| `frontend/src/utils/auth.js` | Store refresh token, remove console.logs |
| `frontend/src/components/AuthForms.tsx` | DELETE (dead code) |
| `frontend/src/components/FileBrowser.tsx` | DELETE (dead code) |
| `frontend/src/components/SettingsPage.tsx` | DELETE (dead code) |
| `frontend/src/hooks/useFiles.ts` | DELETE (dead code) |
| `frontend/src/hooks/useChunkedUpload.ts` | DELETE (dead code) |
| `frontend/src/lib/api.ts` | DELETE (dead code) |
| `frontend/src/contexts/AuthContext.tsx` | DELETE (dead code) |

---

### Task 1: JWT Secret Fallback — Prevent Shared Secrets

**Files:**
- Modify: `backend/src/routes/auth.js:20-30`

The access and refresh tokens both fall back to `process.env.JWT_SECRET`. If that's the only secret set, tokens are interchangeable, defeating token rotation.

- [ ] **Step 1: Fix `getAccessToken` to fail-fast on missing secret**

```javascript
// backend/src/routes/auth.js
// Replace lines 20-24:
const getAccessToken = (userId) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not configured');
  return jwt.sign({ userId }, secret, { expiresIn: JWT_EXPIRES_IN });
};
```

- [ ] **Step 2: Fix `getRefreshToken` to fail-fast on missing secret**

```javascript
// Replace lines 26-30:
const getRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.sign({ userId }, secret, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};
```

- [ ] **Step 3: Update auth middleware to use `JWT_ACCESS_SECRET` only**

```javascript
// backend/src/middleware/auth.js
// Replace line 13:
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
```

- [ ] **Step 4: Update logout and refresh routes to use `JWT_REFRESH_SECRET` only**

In `routes/auth.js`, update lines 136 and 157:
```javascript
// Line 136 (logout):
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
// Line 157 (refresh):
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
```

- [ ] **Step 5: Verify**

Run: `cd backend && node -e "import('./src/routes/auth.js').then(() => console.log('OK'))"`
Expected: OK (or clear error if secrets not in env)

---

### Task 2: DB Save After Writes — Prevent Data Loss

**Files:**
- Modify: `backend/src/services/database.js:121-145`

The `dbWrapper.query()` never calls `saveDb()` after INSERT/UPDATE/DELETE. Data lives only in memory.

- [ ] **Step 1: Add save call after write operations**

```javascript
// backend/src/services/database.js
// Replace the dbWrapper object (lines 121-145):
const dbWrapper = {
  query: async (sql, params = []) => {
    if (!db) {
      await initPromise;
    }
    try {
      const normalizedSql = sql.replace(/\$(\d+)/g, '?');
      const convertedParams = params.map(toDbValue);

      const stmt = db.prepare(normalizedSql);
      if (convertedParams.length > 0) {
        stmt.bind(convertedParams);
      }
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();

      // Save to disk after write operations
      const sqlType = normalizedSql.trim().toUpperCase();
      if (sqlType.startsWith('INSERT') || sqlType.startsWith('UPDATE') || sqlType.startsWith('DELETE')) {
        saveDb();
      }

      return { rows: results };
    } catch (err) {
      console.error('SQL Error:', err.message);
      throw err;
    }
  }
};
```

- [ ] **Step 2: Verify**

Run: `cd backend && node -e "
import { db } from './src/services/database.js';
await db.query('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)', ['test-id', 'test@test.com', 'hash', 'Test']);
const result = await db.query('SELECT * FROM users WHERE id = ?', ['test-id']);
console.log(result.rows.length === 1 ? 'PASS' : 'FAIL');
await db.query('DELETE FROM users WHERE id = ?', ['test-id']);
"`
Expected: PASS

---

### Task 3: Add Missing Tables & Indexes to Database

**Files:**
- Modify: `backend/src/services/database.js:29-101`

The `chunk_uploads` table is never created. The `shares` table is missing `shared_with_email` and `shared_with_user_id` columns. No indexes exist.

- [ ] **Step 1: Add `chunk_uploads` table and update `shares` table**

```javascript
// backend/src/services/database.js
// After the activity_logs table creation (line 99), add:
  db.run(`
    CREATE TABLE IF NOT EXISTS chunk_uploads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      total_chunks INTEGER NOT NULL,
      total_size INTEGER NOT NULL,
      mime_type TEXT,
      folder_id TEXT,
      upload_path TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
```

- [ ] **Step 2: Add missing columns to shares table**

The shares table currently has: `id, file_id, token, expires_at, created_at`. It's missing `shared_with_email` and `shared_with_user_id`. Since ALTER TABLE may fail if columns exist, use a safe approach:

```javascript
// After the chunk_uploads creation, add:
  // Add missing columns to shares table (safe if already exist)
  try { db.run(`ALTER TABLE shares ADD COLUMN shared_with_email TEXT`); } catch (e) {}
  try { db.run(`ALTER TABLE shares ADD COLUMN shared_with_user_id TEXT`); } catch (e) {}
```

- [ ] **Step 3: Add indexes**

```javascript
// After saveDb() in initDb(), add before the closing brace:
  db.run('CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(deleted_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_folder_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_chunk_uploads_user ON chunk_uploads(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_chunk_uploads_expires ON chunk_uploads(expires_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token)');
  db.run('CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)');
  saveDb();
```

- [ ] **Step 4: Verify**

Run: `cd backend && node -e "
import { db } from './src/services/database.js';
const tables = await db.query(\"SELECT name FROM sqlite_master WHERE type='table'\");
console.log('Tables:', tables.rows.map(r => r.name).join(', '));
const indexes = await db.query(\"SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'\");
console.log('Indexes:', indexes.rows.length);
"`
Expected: Tables includes `chunk_uploads`. Indexes >= 10.

---

### Task 4: XSS Prevention in Filenames

**Files:**
- Modify: `backend/src/routes/files.js:32-37`

The `sanitizeFilename()` cleans filesystem-unsafe chars but doesn't prevent HTML injection. Filenames are rendered in the frontend via template literals without escaping.

- [ ] **Step 1: Add HTML entity escaping to `sanitizeFilename`**

```javascript
// backend/src/routes/files.js
// Replace lines 32-37:
const sanitizeFilename = (filename) => {
  return filename
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .substring(0, 200);
};
```

- [ ] **Step 2: Verify**

Run: `cd backend && node -e "
const sanitize = (f) => f.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#x27;').replace(/[\/\\\\?%*:|\"<>]/g,'-').replace(/\\s+/g,'_').substring(0,200);
console.log(sanitize('<script>alert(1)</script>.txt') === '&lt;script&gt;alert(1)&lt;-script&gt;-.txt' ? 'PASS' : 'FAIL: ' + sanitize('<script>alert(1)</script>.txt'));
"`
Expected: PASS

---

### Task 5: Path Traversal Prevention

**Files:**
- Modify: `backend/src/routes/files.js:17-30`

`getStoragePath()` and `ensureStorageDir()` don't validate that the resolved path stays within the storage directory. A crafted `userId` containing `..` could escape.

- [ ] **Step 1: Add path validation helper**

```javascript
// backend/src/routes/files.js
// After line 30 (ensureStorageDir), add:
const assertInsideStorage = (filePath) => {
  const storageRoot = getStoragePath();
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(storageRoot + path.sep) && resolved !== storageRoot) {
    throw new Error('Path traversal detected');
  }
};
```

- [ ] **Step 2: Apply validation in upload handler**

```javascript
// backend/src/routes/files.js
// After line 61 (storagePath = path.join...), add:
    assertInsideStorage(storagePath);
```

- [ ] **Step 3: Apply validation in download handler**

```javascript
// Before line 295 (fs.existsSync), add:
    assertInsideStorage(file.storage_path);
```

- [ ] **Step 4: Apply validation in thumbnail handler**

```javascript
// Before line 275 (fs.existsSync), add:
    assertInsideStorage(file.thumbnail_path);
```

- [ ] **Step 5: Apply validation in chunked upload**

```javascript
// backend/src/routes/chunks.js
// After line 70 (storagePath = path.join...), add:
    const UPLOAD_ROOT = path.resolve(UPLOAD_DIR);
    if (!path.resolve(storagePath).startsWith(UPLOAD_ROOT + path.sep)) {
      throw new Error('Path traversal detected');
    }
```

- [ ] **Step 6: Verify**

Run: `cd backend && node -e "
import path from 'path';
const storageRoot = '/app/storage/user-files';
const assertInside = (p) => { const r = path.resolve(p); if (!r.startsWith(storageRoot + path.sep)) throw new Error('blocked'); };
try { assertInside('/app/storage/user-files/abc/file.txt'); console.log('PASS: valid path allowed'); } catch(e) { console.log('FAIL'); }
try { assertInside('/app/storage/user-files/../etc/passwd'); console.log('FAIL: traversal allowed'); } catch(e) { console.log('PASS: traversal blocked'); }
"`
Expected: both PASS

---

### Task 6: Storage Quota Enforcement

**Files:**
- Modify: `backend/src/routes/files.js:44-97`
- Modify: `backend/src/routes/chunks.js:55-102`

Upload handlers never check if the user has enough quota before writing.

- [ ] **Step 1: Add quota check in single file upload**

```javascript
// backend/src/routes/files.js
// After line 54 (const size = uploadedFile.size), add:
    const user = await User.findById(req.userId);
    const quota = user.storage_quota || 10 * 1024 * 1024 * 1024;
    if ((user.storage_used || 0) + size > quota) {
      return res.status(400).json({ error: 'Storage quota exceeded' });
    }
```

- [ ] **Step 2: Add quota check in chunked upload completion**

```javascript
// backend/src/routes/chunks.js
// After line 58 (chunkUpload = await ChunkUpload.findById...), add:
    if (chunkUpload.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const user = await User.findById(req.userId);
    const quota = user.storage_quota || 10 * 1024 * 1024 * 1024;
    if ((user.storage_used || 0) + chunkUpload.total_size > quota) {
      return res.status(400).json({ error: 'Storage quota exceeded' });
    }
```

- [ ] **Step 3: Verify**

Manually test: attempt upload when storage_used is near quota. Should get 400 error.

---

### Task 7: Standardize Error Response Shape

**Files:**
- Modify: `backend/src/routes/folders.js` (6 locations)
- Modify: `backend/src/routes/shares.js` (0 locations — already correct)

Some routes return `{ message: '...' }`, others return `{ error: '...' }`. Standardize to `{ error: '...' }`.

- [ ] **Step 1: Fix folder route error responses**

```javascript
// backend/src/routes/folders.js
// Line 14: change { message: 'Folder name is required' } to:
      return res.status(400).json({ error: 'Folder name is required' });
```

- [ ] **Step 2: Fix folder route success responses to use `{ data }` shape**

```javascript
// Line 25: change res.status(201).json(folder) to:
    res.status(201).json({ data: folder });

// Line 43: change res.json({ folders }) to:
    res.json({ data: folders });

// Line 53: change res.json({ folders }) to:
    res.json({ data: folders });

// Line 108: change res.status(201).json(newFolder) to:
    res.status(201).json({ data: newFolder });

// Line 158: change res.json({ folders }) to:
    res.json({ data: folders });
```

Wait — this would break the frontend which expects `{ folders }`. Revert Step 2.

**Revised Step 2:** Keep `{ folders }` shape for backward compatibility. Only fix the error key.

- [ ] **Step 2: Verify**

Run: `cd backend && grep -n "message:" src/routes/folders.js`
Expected: no matches

---

### Task 8: Fix `require()` in ESM Module

**Files:**
- Modify: `backend/src/models/folder.js:79,82`
- Delete: `backend/src/routes/index.js` (unused, uses CJS)

- [ ] **Step 1: Fix folder.js `require('fs')` calls**

```javascript
// backend/src/models/folder.js
// Add at top of file (after existing imports):
import fs from 'fs';

// Line 79: change require('fs').unlinkSync to fs.unlinkSync
// Line 82: change require('fs').unlinkSync to fs.unlinkSync
```

```javascript
// Lines 78-83, replace:
    for (const file of filesResult.rows) {
      if (file.storage_path) {
        try { fs.unlinkSync(file.storage_path); } catch (e) {}
      }
      if (file.thumbnail_path) {
        try { fs.unlinkSync(file.thumbnail_path); } catch (e) {}
      }
    }
```

- [ ] **Step 2: Delete unused routes/index.js**

```bash
rm backend/src/routes/index.js
```

- [ ] **Step 3: Verify**

Run: `cd backend && node -e "import('./src/models/folder.js').then(() => console.log('OK'))"`
Expected: OK

---

### Task 9: Expired Chunk Cleanup

**Files:**
- Modify: `backend/src/models/chunkUpload.js:28-31`
- Modify: `backend/src/server.js` (add cleanup call)

- [ ] **Step 1: Fix `ChunkUpload` model — add `deleteExpired` with file cleanup**

```javascript
// backend/src/models/chunkUpload.js
// Add import at top:
import fs from 'fs';

// Replace the delete method and add deleteExpired:
  async delete(id) {
    const upload = await this.findById(id);
    if (upload && upload.upload_path && fs.existsSync(upload.upload_path)) {
      fs.rmSync(upload.upload_path, { recursive: true, force: true });
    }
    await db.query('DELETE FROM chunk_uploads WHERE id = $1', [id]);
  },

  async deleteExpired() {
    const result = await db.query(
      `SELECT id, upload_path FROM chunk_uploads WHERE expires_at < datetime('now')`
    );
    for (const row of result.rows) {
      if (row.upload_path && fs.existsSync(row.upload_path)) {
        fs.rmSync(row.upload_path, { recursive: true, force: true });
      }
    }
    await db.query(`DELETE FROM chunk_uploads WHERE expires_at < datetime('now')`);
    return result.rows.length;
  },
```

- [ ] **Step 2: Add cleanup cron to server.js**

```javascript
// backend/src/server.js
// After the imports, add:
import { ChunkUpload } from './models/index.js';

// Before app.listen(), add:
// Cleanup expired chunks every hour
setInterval(async () => {
  try {
    const deleted = await ChunkUpload.deleteExpired();
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired chunk uploads`);
    }
  } catch (err) {
    console.error('Chunk cleanup error:', err);
  }
}, 60 * 60 * 1000);
```

- [ ] **Step 3: Verify**

Run: `cd backend && node -e "import('./src/models/chunkUpload.js').then(m => console.log(typeof m.default.deleteExpired === 'function' ? 'OK' : 'FAIL'))"`
Expected: OK

---

### Task 10: Remove Console.logs from Production Code

**Files:**
- Modify: `backend/src/routes/auth.js` (remove line 85, 123, 182 — keep only error logs)
- Modify: `backend/src/routes/files.js` (remove line 70 `console.log`)
- Modify: `frontend/src/utils/auth.js` (remove lines 18, 36, 45)

- [ ] **Step 1: Remove `console.log` calls, keep `console.error`**

In `backend/src/routes/files.js` line 70, change:
```javascript
// Remove or change to console.error:
    } catch (thumbErr) {
      // Thumbnail generation is optional, skip silently
    }
```

In `frontend/src/utils/auth.js`, remove lines 18, 36, 45:
```javascript
// Remove: console.log('API URL:', API_URL);
// Remove: console.log('Login URL:', url);
// Remove: console.log('Login response:', text.substring(0, 200));
```

- [ ] **Step 2: Verify**

Run: `grep -rn "console.log" backend/src/ frontend/src/utils/`
Expected: no matches (only `console.error` remains in catch blocks)

---

### Task 11: Store Refresh Token in Frontend

**Files:**
- Modify: `frontend/src/utils/auth.js:34-62`

The frontend stores `accessToken` but never stores `refreshToken`. When the token expires, the user is logged out instead of being refreshed.

- [ ] **Step 1: Store refresh token on login**

```javascript
// frontend/src/utils/auth.js
// Add constant at top:
const REFRESH_KEY = 'keypear_refresh_token';

// In the login method, after line 58 (localStorage.setItem(TOKEN_KEY, ...)), add:
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
    }
```

- [ ] **Step 2: Add refresh token getter**

```javascript
// In auth object, add method after getToken():
  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  },
```

- [ ] **Step 3: Update logout to clear refresh token**

```javascript
// In logout method, add:
    localStorage.removeItem(REFRESH_KEY);
```

- [ ] **Step 4: Add token refresh to api.js**

```javascript
// frontend/src/utils/api.js
// In fetchWithAuth, replace the 401 handler (lines 29-32):
  if (response.status === 401) {
    const refreshToken = auth.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('keypear_token', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('keypear_refresh_token', data.refreshToken);
          }
          // Retry original request
          return fetchWithAuth(url, options);
        }
      } catch (e) {
        // Fall through to logout
      }
    }
    auth.logout();
    throw new Error('Session expired');
  }
```

- [ ] **Step 5: Verify**

Manual test: login, wait for access token to expire (15min), verify page doesn't log out.

---

### Task 12: Delete Dead Frontend Code

**Files to delete:**
- `frontend/src/components/AuthForms.tsx`
- `frontend/src/components/FileBrowser.tsx`
- `frontend/src/components/SettingsPage.tsx`
- `frontend/src/hooks/useFiles.ts`
- `frontend/src/hooks/useChunkedUpload.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/contexts/AuthContext.tsx`

These files import from `react`, `astro:transitions/client`, and `@tanstack/react-query` — none of which are used by the actual vanilla JS frontend.

- [ ] **Step 1: Delete files**

```bash
rm frontend/src/components/AuthForms.tsx
rm frontend/src/components/FileBrowser.tsx
rm frontend/src/components/SettingsPage.tsx
rm frontend/src/hooks/useFiles.ts
rm frontend/src/hooks/useChunkedUpload.ts
rm frontend/src/lib/api.ts
rm frontend/src/contexts/AuthContext.tsx
```

- [ ] **Step 2: Verify frontend still builds**

```bash
cd frontend && npm run build
```
Expected: build succeeds

---

### Task 13: Update AGENTS.md

**Files:**
- Modify: `AGENTS.md`

Update the AGENTS.md to reflect the fixes made.

- [ ] **Step 1: Add environment requirements section**

After the "## Environment" section, add:

```markdown
## Environment Requirements

The following env vars **must** be set (server refuses to start auth routes without them):
- `JWT_ACCESS_SECRET` — separate secret for access tokens
- `JWT_REFRESH_SECRET` — separate secret for refresh tokens (must differ from access)
```

- [ ] **Step 2: Update error handling section**

Replace the Error Handling section:

```markdown
### Error Handling
- Use **try/catch** with async/await
- Return consistent JSON: `{ error: 'message' }` for errors, `{ data }` for success
- Log errors with `console.error` (never `console.log` in production)
- HTTP 400 for validation/quota, 401 for auth, 403 for forbidden, 404 for not found, 500 for server
```
