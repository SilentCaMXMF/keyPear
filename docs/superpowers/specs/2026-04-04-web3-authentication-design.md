# Web3 Authentication Design — SIWE + JWT Hybrid

**Date:** 2026-04-04
**Status:** Implemented — 2026-04-05

## Overview

Replace email/password and OAuth authentication with Sign-In With Ethereum (SIWE, EIP-4361) using MetaMask wallet signatures. Users authenticate by connecting their MetaMask wallet and signing a SIWE message. The wallet address IS the user identity — no email required. The backend verifies the signature cryptographically and issues JWT access/refresh tokens using the existing session system.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Wallet provider | MetaMask only | Largest user base, simplest implementation |
| Auth strategy | Full replacement | Remove email/password + OAuth entirely |
| User identity | Wallet address only | True Web3 identity — wallet IS the user, no email dependency |
| Signing standard | SIWE (EIP-4361) | Industry standard, audited, domain/chain binding |
| Session system | JWT + refresh tokens (existing) | Proven, minimal architecture changes |

## Authentication Flow

### Login / Registration Flow

1. User navigates to `/login`
2. Frontend shows "Connect MetaMask" button
3. User clicks "Connect MetaMask"
4. Frontend calls `POST /api/auth/web3/nonce` with `{ address }` in request body
5. Backend generates 32-char alphanumeric nonce, stores in memory with `{ address, expiresAt: now + 5min }`
6. Backend returns `{ nonce }`
7. Frontend constructs SIWE message per EIP-4361 spec
8. Frontend requests signature: `window.ethereum.request({ method: 'personal_sign', params: [message, address] })`
9. User approves in MetaMask popup
10. Frontend calls `POST /api/auth/web3/verify` with `{ address, signature, message }`
11. Backend:
    a. Parses SIWE message with `siwe` package
    b. Validates domain matches `FRONTEND_URL`
    c. Validates chain ID matches expected chain
    d. Looks up nonce by address, verifies not expired
    e. Verifies nonce in message matches stored nonce
    f. Deletes used nonce (single-use)
    g. Verifies signature recovers to claimed address
    h. Looks up user by `wallet_address`
    i. If user doesn't exist: creates new user with wallet address (and optional display name)
    j. Deletes existing sessions for user (single session policy)
    k. Creates new session with refresh token
    l. Returns `{ user: { id, name, walletAddress }, accessToken, refreshToken }`
12. Frontend stores tokens in localStorage, redirects to dashboard

### Logout Flow

Unchanged — `POST /api/auth/logout` with refresh token, deletes session, clears localStorage.

### Token Refresh Flow

Unchanged — `POST /api/auth/refresh` with refresh token, rotates to new token pair.

## Database Changes

### Migration: `002_web3_auth.sql`

```sql
-- Add wallet_address to users table (becomes the primary identity)
ALTER TABLE users ADD COLUMN wallet_address VARCHAR(42) UNIQUE NOT NULL;

-- Add ENS name (optional)
ALTER TABLE users ADD COLUMN ens_name VARCHAR(255);

-- Make email optional (no longer required)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Create index for wallet lookups
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
```

### Cleanup Migration: `003_remove_legacy_auth.sql`

```sql
-- Remove password-based auth columns
ALTER TABLE users DROP COLUMN password_hash;
ALTER TABLE users DROP COLUMN oauth_provider;
ALTER TABLE users DROP COLUMN oauth_id;
```

### User Model Changes

**New methods:**
- `User.findByWallet(walletAddress)` — Find user by lowercase wallet address
- `User.createWallet({ walletAddress, name })` — Create user with wallet identity

**Removed methods:**
- `User.findByEmail()` — No longer needed
- `User.create()` with password — Replaced by `createWallet`

### Nonce Store

In-memory `Map<string, NonceRecord>` with interval-based cleanup:

```typescript
interface NonceRecord {
  address: string;
  nonce: string;
  expiresAt: number; // timestamp ms
}
```

- Cleanup interval: every 60 seconds
- TTL: 5 minutes
- Nonce deleted on use (verify endpoint)
- No persistence — server restart clears nonces (acceptable, users just re-request)

## Backend Architecture

### New Files

**`backend/src/routes/auth/web3.js`**
- `POST /api/auth/web3/nonce` — Generate nonce for SIWE challenge (body: `{ address }`)
- `POST /api/auth/web3/verify` — Verify SIWE signature and authenticate

**`backend/src/services/nonceStore.js`**
- `generate(address)` → `{ nonce }`
- `consume(address, nonce)` → `true` or throws
- `cleanup()` — Remove expired entries

### Modified Files

**`backend/src/routes/auth.js`**
- Remove: POST `/register`, POST `/login`, POST `/change-password`
- Mount: `router.use('/web3', web3Routes)`
- Keep: POST `/logout`, POST `/refresh`

**`backend/src/models/user.js`**
- Add `findByWallet()`, `createWallet()`

**`backend/src/server.js`**
- Remove: passport initialization, OAuth route mounting
- Remove env var checks for `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Keep: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL` checks

**`backend/src/middleware/auth.ts`**
- No changes — JWT verification unchanged

### Removed Files

- `backend/src/routes/oauth.js`
- `backend/src/services/passport.js`
- `backend/src/routes/auth.ts` (legacy duplicate)

### Dependencies

**Added:**
- `siwe` (v3.0.0) — SIWE message parsing and verification
- `ethers` (v6.x) — `verifyMessage` for signature recovery

**Removed:**
- `bcrypt` — No password hashing
- `passport`, `passport-google-oauth20`, `passport-github2` — OAuth removed

## Frontend Architecture

### New Files

**`frontend/src/pages/web3-login.js`**
- "Connect MetaMask" button
- Optional display name input (for first-time users)
- Status messages (connecting, signing, authenticating)
- MetaMask not installed fallback (link to metamask.io/download)

**`frontend/src/lib/web3.js`**
- `detectMetaMask()` — Check `window.ethereum`
- `requestAccount()` — `eth_requestAccounts`
- `buildSiweMessage({ address, nonce, domain, uri, chainId, issuedAt })` — SIWE message builder per EIP-4361
- `signMessage(message, address)` — `personal_sign`
- `getChainId()` — Get current chain ID

### Modified Files

**`frontend/src/router.js`**
- Route `/login` → `web3-login.js`
- Remove `/register` route

**`frontend/src/utils/auth.js`**
- Replace `login(email, password)` with `loginWithWallet(address, signature, message)`
- Replace `register(name, email, password)` — merged into login flow
- Add `updateProfile({ name })` — Update display name after login
- Keep `logout()`, token storage, `getCurrentUser()`

**`frontend/src/utils/api.js`**
- No changes — JWT refresh flow unchanged

### Removed Files

- `frontend/src/pages/login.js`
- `frontend/src/pages/register.js`
- `frontend/src/components/AuthForms.tsx`

### MetaMask Integration (Vanilla JS)

```javascript
// Detect MetaMask
if (!window.ethereum) {
  showInstallPrompt();
  return;
}

// Request account access
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
const address = accounts[0].toLowerCase();

// Get nonce from server
const { nonce } = await api.post('/api/auth/web3/nonce', { address });

// Build SIWE message
const message = buildSiweMessage({
  address,
  nonce,
  domain: window.location.host,
  uri: window.location.origin,
  chainId: await getChainId(),
  issuedAt: new Date().toISOString()
});

// Sign message
const signature = await window.ethereum.request({
  method: 'personal_sign',
  params: [message, address]
});

// Verify with server
const { user, accessToken, refreshToken } = await api.post('/api/auth/web3/verify', {
  address,
  signature,
  message
});
```

## Security Model

### Threat Mitigations

| Threat | Mitigation |
|--------|-----------|
| **Replay attacks** | Nonce is single-use, deleted after verification. 5-min TTL. |
| **Cross-site signature theft** | SIWE message includes domain binding — signature invalid on wrong domain |
| **Chain spoofing** | SIWE message includes Chain ID — verified server-side against expected chain |
| **Message tampering** | Full SIWE message sent to server, parsed and validated by `siwe` package |
| **Brute force** | Existing rate limiting (20 req/15min) on `/api/auth` covers web3 routes |
| **XSS token theft** | localStorage tokens (same as current system). Future improvement: HTTP-only cookies |
| **Wallet hijacking** | Out of scope — user's wallet security is their responsibility |
| **Phishing** | SIWE message clearly shows domain, URI, and intent in MetaMask popup |
| **Expired nonce abuse** | Server rejects expired nonces, returns 401 |
| **Email enumeration** | Not applicable — no email required |
| **Timing attacks on nonce lookup** | Constant-time comparison not needed — nonces are random, not secrets |
| **Man-in-the-middle** | HTTPS required in production. SIWE message includes URI for verification |

### SIWE Message Format

Per EIP-4361, the signed message follows this structure:

```
<domain> wants you to sign in with your Ethereum account:
<address>

<statement>

URI: <uri>
Version: 1
Chain ID: <chain-id>
Nonce: <nonce>
Issued At: <issued-at>
```

Fields validated server-side:
- `domain` — Must match `FRONTEND_URL` hostname
- `address` — Must match the address that sent the request
- `uri` — Must match `FRONTEND_URL` origin
- `chainId` — Must match expected chain (configurable, default: 1 for Ethereum mainnet)
- `nonce` — Must match stored nonce, must not be expired
- `issuedAt` — Must be within 5 minutes of server time

### Rate Limiting

Existing rate limiter (`server.js:57-63`): 20 requests per 15 minutes on `/api/auth/*` routes.

Additional protection on nonce endpoint: 5 requests per minute per IP address (prevent nonce exhaustion).

## Error Responses

| Status | Code | Message | Scenario |
|--------|------|---------|----------|
| 400 | `MISSING_ADDRESS` | "Address is required" | Nonce request missing address |
| 400 | `INVALID_ADDRESS` | "Invalid Ethereum address" | Malformed address |
| 400 | `INVALID_MESSAGE` | "Invalid SIWE message" | Message fails SIWE parsing |
| 400 | `INVALID_SIGNATURE` | "Signature verification failed" | Signature doesn't recover to address |
| 401 | `NONCE_EXPIRED` | "Nonce has expired. Please try again." | Nonce older than 5 minutes |
| 401 | `NONCE_MISMATCH` | "Nonce does not match" | Message nonce doesn't match stored nonce |
| 401 | `DOMAIN_MISMATCH` | "Domain does not match" | SIWE domain doesn't match server config |
| 401 | `CHAIN_MISMATCH` | "Chain ID does not match" | SIWE chain doesn't match expected chain |
| 500 | `SERVER_ERROR` | "Authentication failed" | Unexpected server error |

## Environment Variables

### Required
- `JWT_ACCESS_SECRET` — Access token signing secret
- `JWT_REFRESH_SECRET` — Refresh token signing secret
- `FRONTEND_URL` — Frontend origin (used for SIWE domain validation)
- `SIWE_CHAIN_ID` — Expected Ethereum chain ID (default: `1` for mainnet)

### Removed
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## Migration Path

1. Create `002_web3_auth.sql` migration — add wallet columns, make email optional
2. Implement backend web3 routes and nonce store
3. Implement frontend web3 login page
4. Test flow end-to-end with MetaMask
5. Run `003_remove_legacy_auth.sql` — remove password/OAuth columns
6. Remove legacy auth files (routes, models, components)
7. Update `.env.example` — remove OAuth vars, add `SIWE_CHAIN_ID`
8. Update documentation

## Testing Strategy

### Backend
- Unit: NonceStore generate/consume/cleanup
- Unit: SIWE message validation (domain, chain, nonce, expiry)
- Unit: Signature verification with known test vectors
- Integration: Full nonce → sign → verify flow with mock ethers provider
- Security: Replay attack test (reuse nonce), expired nonce test, wrong domain test

### Frontend
- Unit: `buildSiweMessage` output matches EIP-4361 format
- Unit: MetaMask detection logic
- Integration: Mock `window.ethereum` → full login flow
- Error handling: MetaMask not installed, user rejects signature, network error
