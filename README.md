# Mini E-commerce

Senior-role technical exercise: a small e-commerce catalog with secure authentication and an
infinite-scroll product listing. See [`PRD.md`](./PRD.md) for the full brief and acceptance
criteria.

## Stack
- **Frontend:** Next.js (App Router, TypeScript, Tailwind) — `frontend/`
- **Backend:** NestJS (TypeScript) — `backend/`
- **Database:** PostgreSQL 16 (via `docker-compose.yml`)
- **CI:** GitHub Actions — `.github/workflows/ci.yml`

## Repo Layout
```
mini-ecom/
├── frontend/          # Next.js app
├── backend/           # NestJS app
├── docker-compose.yml # Postgres for local dev
├── .github/workflows  # CI pipeline
├── PRD.md             # Product requirements
└── README.md
```

## Prerequisites
- Node.js 20+
- npm 10+
- Docker (for Postgres) — or a local Postgres 16 instance

## Local Setup

```bash
# 1. Copy env files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Start Postgres
docker compose up -d

# 3. Install deps
(cd backend && npm install)
(cd frontend && npm install)

# 4. Run apps (in two terminals)
cd backend  && npm run start:dev   # http://localhost:3001
cd frontend && npm run dev         # http://localhost:3000
```

## Architectural Choices (planned)

- **Monorepo with two independent apps.** `frontend/` and `backend/` keep their own
  `package.json`, lint config, and CI job, so each can evolve without coupling.
- **Auth = short-lived access JWT + rotating refresh token.**
  - Refresh token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie that survives browser
    restart → satisfies *persistent sessions*.
  - Refresh token TTL is bumped on every authenticated request and capped at
    `INACTIVITY_TIMEOUT_MINUTES=30` → satisfies *30-min idle timeout*.
- **Brute-force protection** via per-IP and per-account rate limiting on the login route, with
  progressive lockout. CAPTCHA hook left as a configurable middleware.
- **Cursor-based pagination** for the catalog, server-clamps `limit` to `[5, 50]` regardless
  of what the client sends.
- **Infinite scroll** on the frontend with TanStack Query `useInfiniteQuery` +
  `IntersectionObserver` sentinel; list virtualisation to keep large lists smooth.
- **CI** runs lint, typecheck, test, and build for both apps in parallel jobs; backend job
  spins up a Postgres service container for integration tests.

## Status
Project scaffolding only — `PRD.md` is the source of truth for what's being built next.
