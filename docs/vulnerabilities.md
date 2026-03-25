# Security Vulnerabilities Report

**Date:** 2026-03-25
**Scope:** Full-stack NestJS + React authentication application
**Auditor:** Senior Fullstack Developer (Claude Code)

---

## Table of Contents

1. [Critical Vulnerabilities](#critical-vulnerabilities)
2. [High Severity](#high-severity)
3. [Medium Severity](#medium-severity)
4. [Low Severity](#low-severity)
5. [Fix Plan](#fix-plan)
6. [Summary](#summary)

---

## Critical Vulnerabilities

---

## High Severity

---

### VULN-02 — No Rate Limiting on Authentication Endpoints

**Severity:** HIGH
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)
**OWASP:** A07:2021 – Identification and Authentication Failures
**File:** `src/authenticate/authenticate.controller.ts` (lines 21–38)

**How it can be leveraged:**

- `POST /authenticate` (login) and `POST /authenticate/sign-up` accept unlimited requests per second from any IP.
- An attacker can run a credential stuffing attack — taking breached email/password lists and replaying them — without any throttle.
- For a targeted account, a dictionary attack can exhaust common passwords in minutes.
- The sign-up endpoint can be flooded to create thousands of fake accounts (resource exhaustion / spam abuse).

**Fix:**

- Install `@nestjs/throttler` and configure a `ThrottlerGuard` globally.
- Apply tighter limits specifically on auth endpoints (e.g., 5 requests/minute per IP for login).
- Consider progressive backoff or temporary IP ban after repeated failures.

---

### VULN-03 — JWT Tokens Stored in `localStorage` (XSS-Accessible)

**Severity:** HIGH
**CWE:** CWE-922 (Insecure Storage of Sensitive Information)
**OWASP:** A02:2021 – Cryptographic Failures
**File:** `client/src/providers/authContext.tsx` (lines 33–46)

```typescript
localStorage.setItem(tokenPrefix, newToken);
localStorage.setItem('user', JSON.stringify(newUser));
```

**How it can be leveraged:**

- `localStorage` is readable by any JavaScript running on the same origin.
- A single XSS vulnerability anywhere on the frontend (a third-party script, a malicious npm package, or a reflected error message) allows an attacker to run `localStorage.getItem('$$sut...')` and exfiltrate the JWT token.
- With the stolen token, the attacker silently impersonates the victim from any device until the token expires (12 hours — see VULN-07).
- The `user` object stored alongside the token leaks the user's email, name, and internal `_id`.

**Fix:**

- Store tokens in `HttpOnly; Secure; SameSite=Strict` cookies set by the backend on login. JavaScript cannot read `HttpOnly` cookies.
- If `localStorage` must be kept, implement a strict Content-Security-Policy to prevent third-party script execution.

---

### VULN-04 — No CSRF Protection

**Severity:** HIGH
**CWE:** CWE-352 (Cross-Site Request Forgery)
**OWASP:** A01:2021 – Broken Access Control
**File:** `src/main.ts` (lines 9–14)

**How it can be leveraged:**

- There are no CSRF tokens on any state-changing endpoints.
- If authentication is ever migrated to cookies (the correct fix for VULN-03), an attacker can host a malicious page that silently POSTs to `http://localhost:4000/authenticate` with the victim's cookies attached.
- Even with the current localStorage approach, CORS misconfiguration (see VULN-10) in production could enable cross-origin fetches.

**Fix:**

- Use the `csurf` middleware (or NestJS equivalent) to generate and validate CSRF tokens on all mutating requests.
- Alternatively, rely on `SameSite=Strict` cookies combined with `Origin` header validation.

---

### VULN-05 — Insecure Scrypt Salt Length

**Severity:** HIGH
**CWE:** CWE-330 (Use of Insufficiently Random Values)
**File:** `src/authenticate/authenticate.service.ts` (line 36)

```typescript
const salt = randomBytes(8).toString('hex');
```

**How it can be leveraged:**

- The salt is only 8 bytes (64 bits) before hex-encoding. NIST SP 800-132 recommends a minimum of 16 bytes (128 bits).
- A smaller salt increases the probability of two users sharing the same salt, reducing the uniqueness guarantee that salts are meant to provide.
- With only 2^64 possible salts, precomputed salt tables become more feasible at scale.

**Fix:**

- Increase to `randomBytes(16)` (128 bits) or higher.

---

### VULN-06 — API Calls Use HTTP Instead of HTTPS

**Severity:** HIGH
**CWE:** CWE-319 (Cleartext Transmission of Sensitive Information)
**OWASP:** A02:2021 – Cryptographic Failures
**File:** `client/config.ts` (line 2)

```typescript
API_URL: 'http://localhost:4000/',
```

**How it can be leveraged:**

- Credentials (email + password) and JWT tokens are transmitted in plaintext over the network.
- On any shared network (café Wi-Fi, corporate proxy, hostile network), an attacker running a passive sniffer (e.g., Wireshark) captures authentication tokens and credentials in real time.
- An active man-in-the-middle (e.g., ARP poisoning) can intercept and modify API responses to inject malicious payloads.

**Fix:**

- Terminate TLS at the Nginx reverse proxy for production.
- Update `client/config.ts` to read from an environment variable (e.g., `VITE_API_URL`) so dev uses HTTP locally and production uses HTTPS.
- Enforce `Strict-Transport-Security` (HSTS) header (see VULN-09).

---

## Medium Severity

---

### VULN-07 — No Server-Side Token Revocation on Logout

**Severity:** MEDIUM
**CWE:** CWE-613 (Insufficient Session Expiration)
**OWASP:** A07:2021 – Identification and Authentication Failures
**File:** `client/src/providers/authContext.tsx` (lines 54–62), `src/authenticate/authenticate.module.ts` (line 20)

```typescript
signOptions: { expiresIn: '12h' },
```

**How it can be leveraged:**

- Logout only deletes the token from `localStorage` on the current device. The JWT itself remains cryptographically valid on the backend for up to 12 hours.
- If an attacker has already stolen the token (e.g., via XSS), logout does nothing to invalidate it.
- A stolen session cannot be terminated without waiting for natural expiry.
- The 12-hour window is unnecessarily long; industry standard for sensitive apps is 15–60 minutes with refresh tokens.

**Fix:**

- Implement a server-side token denylist (Redis or in-memory store) and check it in `JwtAuthGuard`.
- Reduce access token expiry to 15 minutes; introduce refresh tokens with rotation.
- Add a `POST /authenticate/logout` endpoint that adds the token's `jti` claim to the denylist.

---

### VULN-08 — Missing Security Headers

**Severity:** MEDIUM
**CWE:** CWE-693 (Protection Mechanism Failure)
**OWASP:** A05:2021 – Security Misconfiguration
**File:** `src/main.ts`

**Missing headers and their impact:**

| Header                                | Missing Effect                                              |
| ------------------------------------- | ----------------------------------------------------------- |
| `Content-Security-Policy`             | XSS attacks can execute arbitrary scripts                   |
| `X-Frame-Options` / `frame-ancestors` | Clickjacking attacks embed the app in an iframe             |
| `X-Content-Type-Options: nosniff`     | Browser MIME-sniffing can execute uploaded files as scripts |
| `Strict-Transport-Security`           | Browser downgrades HTTPS to HTTP (SSL stripping)            |
| `Referrer-Policy`                     | JWT tokens in URLs leak via `Referer` header                |
| `Permissions-Policy`                  | Unnecessary browser APIs (camera, mic) remain accessible    |

**Fix:**

- Install `helmet` for NestJS: `npm install helmet` and call `app.use(helmet())` in `main.ts`.
- Configure a strict `Content-Security-Policy` that whitelists only your own domain.

---

### VULN-09 — Swagger UI Exposed Without Authentication

**Severity:** MEDIUM
**CWE:** CWE-215 (Insertion of Sensitive Information Into Debugging Code)
**OWASP:** A05:2021 – Security Misconfiguration
**File:** `src/main.ts` (lines 21–29)

```typescript
SwaggerModule.setup('api', app, document);
```

**How it can be leveraged:**

- The full API schema is publicly accessible at `/api` with no authentication.
- An attacker can enumerate all endpoints, required parameters, and expected response shapes.
- This drastically reduces the time needed to craft targeted attacks against the API.

**Fix:**

- Disable Swagger in production by wrapping setup in `if (process.env.NODE_ENV !== 'production')`.
- Or protect the `/api` route with HTTP Basic Auth or IP allowlisting.

---

### VULN-10 — Hardcoded `localhost` CORS Origin

**Severity:** MEDIUM
**CWE:** CWE-346 (Origin Validation Error)
**OWASP:** A05:2021 – Security Misconfiguration
**File:** `src/main.ts` (line 10)

```typescript
origin: 'http://localhost:5173',
```

**How it can be leveraged:**

- In production, the actual frontend domain is not `localhost:5173`. This likely causes a developer to change the origin to `*` (allow all) to make things work, which opens the API to any website on the internet.
- `credentials: true` combined with a wildcard origin is rejected by browsers but is often "fixed" by setting a permissive explicit origin, enabling CSRF via cross-origin requests.

**Fix:**

- Read the allowed origin from an environment variable: `origin: process.env.ALLOWED_ORIGIN`.
- Never combine `credentials: true` with `origin: '*'`.

---

### VULN-11 — Weak Password Policy

**Severity:** MEDIUM
**CWE:** CWE-521 (Weak Password Requirements)
**File:** `src/utils/globals.ts` (line 1), `client/src/shared/globals.ts` (line 2)

```typescript
passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
```

**How it can be leveraged:**

- Minimum 8 characters allows passwords like `Password1!` which appear in every breach dictionary.
- Only 8 special characters are accepted — attackers can narrow their brute-force keyspace.
- No maximum length check means an attacker can send a multi-megabyte "password" string causing a CPU denial-of-service during scrypt hashing.
- No common-password blocklist means `Welcome1!` is a valid password.

**Fix:**

- Increase minimum to 12 characters (NIST SP 800-63B).
- Add a maximum length of 64–128 characters to prevent DoS.
- Check passwords against a known-breached-password list (e.g., `haveibeenpwned` API or a local `zxcvbn` score check).

---

### VULN-12 — No Input `MaxLength` on `name` Field

**Severity:** MEDIUM
**CWE:** CWE-20 (Improper Input Validation)
**File:** `src/models/sign-up.model.ts` (lines 16–18)

```typescript
@IsString()
@IsNotEmpty()
@MinLength(3)
name: string;
```

**How it can be leveraged:**

- No `@MaxLength` decorator means an attacker can submit a multi-megabyte name, filling disk storage in the database and causing memory pressure when the field is read and serialized.
- Without character-set restrictions, a stored XSS payload in the name field will execute whenever the name is rendered without escaping (e.g., in admin dashboards or emails).

**Fix:**

- Add `@MaxLength(100)` and `@Matches(/^[a-zA-Z\s'-]+$/)` or similar sanitization.

---

### VULN-13 — `ValidationPipe` Missing `forbidNonWhitelisted`

**Severity:** MEDIUM
**CWE:** CWE-20 (Improper Input Validation)
**File:** `src/main.ts` (lines 15–18)

```typescript
new ValidationPipe({
  whitelist: true,
}),
```

**How it can be leveraged:**

- `whitelist: true` strips unknown fields, but without `forbidNonWhitelisted: true`, the request is still accepted silently.
- An attacker probing the API receives no error signal when sending unexpected fields, making enumeration easier.
- Some edge cases in NestJS version differences have allowed whitelisted stripping to be bypassed.

**Fix:**

- Add `forbidNonWhitelisted: true` and `transform: true` to the `ValidationPipe` options.

---

### VULN-14 — Unvalidated JSON Parsed from `localStorage`

**Severity:** MEDIUM
**CWE:** CWE-502 (Deserialization of Untrusted Data)
**File:** `client/src/providers/authContext.tsx` (line 38)

```typescript
setUser(JSON.parse(storedUser));
```

**How it can be leveraged:**

- `localStorage` can be written by any script running on the same origin, or poisoned via XSS.
- If a malicious user crafts a `user` object with unexpected fields (e.g., `isAdmin: true`), it is accepted without validation and stored in React state, potentially affecting client-side authorization checks.
- A malformed JSON string causes an uncaught `SyntaxError` that crashes the `AuthProvider`, locking all users out of the application.

**Fix:**

- Wrap in a `try/catch` and validate the shape of the parsed object before calling `setUser`.

---

### VULN-15 — No Logging or Security Monitoring

**Severity:** MEDIUM
**CWE:** CWE-778 (Insufficient Logging)
**OWASP:** A09:2021 – Security Logging and Monitoring Failures

**How it can be leveraged:**

- Failed login attempts, repeated sign-up requests, and invalid JWT usage generate no log entries.
- An ongoing brute-force or credential stuffing attack goes completely unnoticed until accounts are compromised.
- There is no audit trail to support incident response after a breach.

**Fix:**

- Add a NestJS logger or integrate Winston/Pino.
- Log failed authentication attempts (with IP, timestamp, and masked email).
- Set up alerts for anomalous patterns (>5 failed logins/minute from same IP).

---

## Low Severity

---

### VULN-16 — Unpinned Docker Base Images

**Severity:** LOW
**CWE:** CWE-829 (Inclusion of Functionality from Untrusted Control Sphere)
**File:** `Dockerfile` (line 1), `client/Dockerfile` (line 1)

```dockerfile
FROM node:20-alpine
```

**How it can be leveraged:**

- `node:20-alpine` is a mutable tag. A compromised or updated base image is silently pulled on the next `docker build`, potentially introducing vulnerabilities or malicious code.

**Fix:**

- Pin to a specific image digest: `FROM node:20.19.0-alpine3.21@sha256:<digest>`.

---

### VULN-17 — Swagger Exposes Internal `_id` Field

**Severity:** LOW
**CWE:** CWE-200 (Exposure of Sensitive Information)
**File:** `src/authenticate/authenticate.service.ts` (lines 73–81)

```typescript
_id: existingUser._id.toString(),
```

**How it can be leveraged:**

- The internal MongoDB ObjectId is returned to the frontend and exposed in the API schema.
- While ObjectIds are not secret, revealing internal database IDs helps attackers understand the data model and potentially craft more targeted attacks.

**Fix:**

- Use a separate public user identifier (UUID or opaque token) instead of returning `_id` directly.

---

### VULN-18 — No Environment Variable Validation at Startup

**Severity:** LOW
**CWE:** CWE-754 (Improper Check for Unusual or Exceptional Conditions)
**File:** `src/main.ts`, `src/app.module.ts`

**How it can be leveraged:**

- If `JWT_SECRET` is missing, NestJS starts successfully but the `JwtModule` falls back to an empty string or `undefined` as the signing key. Every token becomes trivially forgeable with an empty secret.
- If `DB_URL` is missing, the application starts but database operations throw runtime errors.

**Fix:**

- Use `@nestjs/config` with `validationSchema` (Joi) to enforce required environment variables at startup and crash-fast if they are missing.

---

## Fix Plan

### Phase 1 — Immediate (Before Next Deployment)

| #   | Action                                                            | Files                                                              |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Remove `.env` from git history, rotate DB password and JWT secret | `.env`, `.gitignore`                                               |
| 2   | Add `helmet()` middleware                                         | `src/main.ts`                                                      |
| 3   | Add `@nestjs/throttler` rate limiting to auth endpoints           | `src/authenticate/authenticate.controller.ts`, `src/app.module.ts` |
| 4   | Add `forbidNonWhitelisted: true` to `ValidationPipe`              | `src/main.ts`                                                      |
| 5   | Disable Swagger in production                                     | `src/main.ts`                                                      |

### Phase 2 — Short Term (Next Sprint)

| #   | Action                                                             | Files                                                                                 |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 6   | Migrate token storage from `localStorage` to `HttpOnly` cookies    | `src/authenticate/authenticate.service.ts`, `client/src/providers/authContext.tsx`    |
| 7   | Add CSRF protection via `csurf` or `SameSite=Strict`               | `src/main.ts`                                                                         |
| 8   | Implement server-side token denylist + `POST /authenticate/logout` | `src/authenticate/authenticate.*`, Redis or in-memory store                           |
| 9   | Reduce JWT expiry to 15 min, add refresh token endpoint            | `src/authenticate/authenticate.module.ts`, `src/authenticate/authenticate.service.ts` |
| 10  | Move all config to environment variables (CORS origin, API URL)    | `src/main.ts`, `client/config.ts`                                                     |
| 11  | Increase scrypt salt to `randomBytes(16)`                          | `src/authenticate/authenticate.service.ts`                                            |
| 12  | Add `@MaxLength` and character restrictions to `name` field        | `src/models/sign-up.model.ts`                                                         |
| 13  | Add max password length (128 chars) to prevent DoS                 | `src/utils/globals.ts`, `client/src/shared/globals.ts`                                |
| 14  | Wrap `JSON.parse(storedUser)` in try/catch with type validation    | `client/src/providers/authContext.tsx`                                                |

### Phase 3 — Medium Term

| #   | Action                                                              | Files                                                                 |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 15  | Add startup environment variable validation with Joi                | `src/app.module.ts`                                                   |
| 16  | Implement structured logging (Winston/Pino) with auth event logging | New `src/logger/` module                                              |
| 17  | Pin Docker base image versions with SHA digests                     | `Dockerfile`, `client/Dockerfile`                                     |
| 18  | Add password breach check (zxcvbn or HaveIBeenPwned)                | `src/authenticate/authenticate.service.ts`                            |
| 19  | Replace internal `_id` with public UUID in API responses            | `src/user/user.entity.ts`, `src/authenticate/authenticate.service.ts` |
| 20  | Add account lockout after N failed login attempts                   | `src/authenticate/authenticate.service.ts`                            |

---

## Summary

| Severity  | Count  |
| --------- | ------ |
| Critical  | 1      |
| High      | 5      |
| Medium    | 9      |
| Low       | 3      |
| **Total** | **18** |

The most dangerous combination is **VULN-01** (exposed JWT secret) + **VULN-03** (tokens in localStorage) + **VULN-02** (no rate limiting): an attacker can forge tokens using the known secret, or steal tokens via any XSS vector, and brute-force accounts with no resistance. These three issues should be resolved before the application handles any real user data.
