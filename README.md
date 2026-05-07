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

### Steps

```bash
# 1. Env files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Postgres
docker compose up -d

# 3. Install
(cd backend  && npm install)
(cd frontend && npm install)

# 4. Database — apply migrations + seed 75 products and the demo user
cd backend
npx prisma migrate deploy
npx prisma db seed

# 5. Run apps (in two terminals)
cd backend  && npm run start:dev   # http://localhost:4000
cd frontend && npm run dev         # http://localhost:3000
```

Open http://localhost:3000 and sign in with:

```
demo@mini-ecom.test   /   Demo!Pass123
```

## Architectural choices

**Layout.** Monorepo with two independent apps. **Feature-grouped folders** (`auth/`, `products/`) rather than type-grouped (`controllers/`, `services/`, `models/`) — keeps everything for a domain in one place, scales cleaner.

**Backend (NestJS).**

- Functional services + factory providers — pure functions take a `deps` object; the provider closes over Prisma/Jwt/Config and returns bound methods. No inheritance.
- Validation with **Zod** (`*.model.ts`) + a tiny `zParse(schema)` pipe. No `class-validator`.
- **Auth:** short-lived access JWT (15 min) + opaque rotating refresh token in an `HttpOnly`, `SameSite=Lax`, `path=/` cookie. Sliding 30-minute expiry covers both *persistent session* and *idle timeout*. Refresh tokens stored only as SHA-256 hashes with rotation/revocation tracking.
- **Brute-force protection:** global rate limit + 5 rpm on `/auth/login`, plus a `LoginAttempt` table that locks email/IP after repeated failures.
- **Cursor pagination** with `id` tiebreaker → no duplicates when products are inserted mid-scroll. `limit` clamped server-side to `[5, 50]`.
- **Search & filter on real columns:** indexed `category` and `(createdAt, id)`; search is case-insensitive `contains` on `name` + `sku`.
- **Prisma 7 with driver adapter:** datasource URL in `prisma.config.ts`; runtime client built via factory provider with `new PrismaPg({ connectionString })`.

**Frontend (Next.js).**

- App Router with `(auth)` / `(app)` route groups. The `(app)` layout's `AuthProvider` bootstraps the session and runs the idle timer.
- **`proxy.ts`** (Next.js 16 renamed `middleware.ts` → `proxy.ts`) gates protected routes by cookie presence; backend stays the single source of authority.
- Access token kept **in memory only** (Zustand) — never `localStorage`.
- **`apiClient`** retries once on 401 via `/auth/refresh`, with a single-flight guard so N concurrent 401s share one refresh.
- **Idle timer** listens to mousedown/keydown/scroll/touchstart/visibility, rate-limited to one tick per 30 s. Active periods ping `/auth/refresh` to slide the cookie; 30 min idle → `logout` + redirect.
- **TanStack Query** for `useInfiniteQuery` (cursor concatenation, de-dup, cache).
- **URL-state-driven filters:** `?q=`, `?sort=`, `?inStock=`, `?category=`, `?limit=` — links are shareable, back/forward works.
- Custom `<Select>` (proper `button + listbox` ARIA, keyboard nav) + global `.field` style for consistent inputs.
- Responsive grid: `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`, sticky sidebar on `lg+`.

**CI.** `.github/workflows/ci.yml` runs on every push and PR: parallel frontend (`lint → tsc → next build`) and backend (`prisma generate → lint → tsc → jest → nest build`) jobs against a Postgres 16 service container. Fails on any lint, type, test, or build error.

## Out of scope

Per the PRD: checkout, payments, orders, admin/CMS, production deployment beyond CI.
