# Mini E-commerce

A small e-commerce catalog built for the senior technical exercise — secure auth, infinite-scroll product listing, search & category filters. Full brief in [`PRD.md`](./PRD.md).

## Stack

- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind v4, TanStack Query, Zustand)
- **Backend:** NestJS 11 (TypeScript), Prisma 7
- **Database:** PostgreSQL 16
- **CI:** GitHub Actions

## Run locally

### Prerequisites

- Node.js 20+
- Docker (for Postgres) — or a local Postgres 16

### 1. Env files

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

The defaults expect a Postgres reachable at `localhost:5432` with:

```
user:     username
password: password
db:       mini-ecom
```

### 2. Postgres — pick **one**

**Option A — Docker (recommended, zero install):**

```bash
docker compose up -d
```

**Option B — Use your existing local Postgres** (skip if you used Docker)

Make sure your Postgres server is running on `localhost:5432`, then create the user and database. Either via **pgAdmin**

Either way, the `DATABASE_URL` in `backend/.env` (`postgresql://username:password@localhost:5432/mini-ecom`) connects to it.

### 3. Install dependencies

```bash
(cd backend  && npm install)
(cd frontend && npm install)
```

### 4. Database — apply migrations + seed 75 products and the demo user

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Run the apps (two terminals)

```bash
cd backend  && npm run start:dev   # http://localhost:4000
cd frontend && npm run dev         # http://localhost:3000
```

Open http://localhost:3000 and sign in with:

```
demo@mini-ecom.test   /   Demo!Pass123
```

## Architectural choices

**Layout.** Monorepo with two independent apps. **Feature-grouped folders** (`auth/`, `products/`) rather than type-grouped (`controllers/`, `services/`, `models/`) — keeps everything for a domain in one place, scales cleaner.

**Backend (NestJS).** Functional services with deps injected via factory providers, validated with Zod. Auth uses a short-lived access JWT plus an opaque rotating refresh token in an `HttpOnly` cookie with a sliding 30-min window — covers both persistent session and idle timeout. Brute-force protection via global rate limit, tighter limit on `/auth/login`, and per-account/IP lockout. Catalog uses cursor pagination clamped server-side to `[5, 50]`, with `id` as a tiebreaker so concurrent inserts never produce duplicates.

**Frontend (Next.js).** App Router with `(auth)` / `(app)` route groups; `proxy.ts` gates protected routes by cookie presence. Access token lives in memory (Zustand) — never `localStorage`. The `apiClient` retries once on 401 via `/auth/refresh`; an idle timer hard-logs out at 30 min. Catalog uses TanStack Query `useInfiniteQuery` for cursor-based infinite scroll, with all filters in the URL so links are shareable. Custom `<Select>` and a global `.field` style keep forms consistent. Responsive grid: 2 / 3 / 4 columns at sm / md / xl.

**CI.** `.github/workflows/ci.yml` runs on every push and PR: parallel frontend (`lint → tsc → next build`) and backend (`prisma generate → lint → tsc → jest → nest build`) jobs against a Postgres 16 service container. Fails on any lint, type, test, or build error.

## Out of scope

Per the PRD: checkout, payments, orders, admin/CMS, production deployment beyond CI.
