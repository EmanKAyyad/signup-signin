# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Run both backend and frontend concurrently
npm run start

# Run backend only (with watch mode)
npm run backend

# Run frontend only
npm run frontend
```

### Build
```bash
npm run build          # Build NestJS backend
cd client && npm run build  # Build React frontend
```

### Testing
```bash
npm test               # Run all unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run end-to-end tests

# Run a single test file
npx jest src/authenticate/authenticate.controller.spec.ts
```

### Linting & Formatting
```bash
npm run lint           # ESLint with auto-fix (backend)
npm run format         # Prettier (backend src/ and test/)
cd client && npm run lint  # ESLint for frontend
```

## Architecture

### Overview
Full-stack authentication app: NestJS backend + React frontend, connected via REST API.

- **Backend** runs on port `4000`, **Frontend** on port `5173`
- MongoDB (Atlas) via TypeORM, JWT authentication
- Swagger docs at `http://localhost:4000/api`

### Backend (`src/`)

Two NestJS feature modules:

**`authenticate/`** — Auth logic
- `authenticate.controller.ts` — Public routes: `POST /authenticate` (login), `POST /authenticate/sign-up` (register)
- `authenticate.service.ts` — Password hashing uses `scrypt` with a random salt (format: `salt.hash`)
- `auth.guard.ts` — `JwtAuthGuard` validates `Authorization: Bearer <token>` header

**`user/`** — User data
- `user.controller.ts` — `GET /users` protected by `JwtAuthGuard`
- `user.entity.ts` — MongoDB document; `password` field excluded from queries by default

**Shared models** in `src/sign-up.model.ts` (DTOs with class-validator decorators):
- Password regex: letter + digit + special char, min 8 chars (also in `src/globals.ts`)

### Frontend (`client/src/`)

React Router SPA with three routes: `/login`, `/signup`, `/dashboard`.

**Auth state** managed in `providers/authContext.tsx` (`AuthProvider` + `useAuth()` hook):
- Persists token to `localStorage` with key prefix `$$sut`
- Provides `login()`, `logout()`, `isAuthenticated`, `token`, `user`

**`ProtectedRoute`** component wraps `/dashboard` — redirects unauthenticated users to `/login`.

**API base URL** configured in `client/config.ts` (`CONFIG.API_URL`).

### Environment Variables
Required in `.env` at project root:
```
PORT=4000
DB_URL=<mongodb-connection-string>
JWT_SECRET=<secret>
```

### Docker
`docker-compose.yml` orchestrates both containers on a shared `app-network`. The client uses `client/nginx.conf` for production serving.

## Logging Rules

All new backend actions **must** include logging using NestJS's `Logger` class. Follow these rules whenever adding a new controller route, service method, or guard:

### Required log levels per action type

| Action | Level | What to log |
|--------|-------|-------------|
| Incoming request (controller) | `info` | Action name + masked PII (use `maskEmail()` from `src/utils/mask-sensitive.ts`) |
| Successful operation (service) | `info` | Outcome + safe identifiers (e.g. `_id`, masked email) |
| Expected failure (wrong input, not found) | `warn` | Reason + masked PII — never raw passwords or tokens |
| Unexpected failure (DB error, unhandled exception) | `error` | `err.message` + `err.code` — never the full `err` object |
| Auth rejection (guard) | `warn` | Reason + `path` + `ip` — never the token value |
| Read-only / query endpoints | `debug` | Requesting userId + endpoint |

### Setup checklist for new classes

```typescript
// 1. Declare a logger at the top of every controller, service, or guard
private readonly logger = new Logger(MyClassName.name);

// 2. Import maskEmail for any log that involves an email address
import { maskEmail } from 'src/utils/mask-sensitive';
```

### What must never appear in logs

- Raw passwords
- Full JWT tokens (log only the `jti` claim)
- The `Authorization` header value
- Full user/document objects from the DB
- Environment secrets (`DB_URL`, `JWT_SECRET`)
