# Mini E-commerce

Senior-role technical exercise: an e-commerce catalog with secure authentication and an
infinite-scroll product listing. The full brief and acceptance criteria live in
[`PRD.md`](./PRD.md); this README covers architecture and how to run the app.

---

## Stack

| Layer    | Tech                                                                        |
|----------|-----------------------------------------------------------------------------|
| Frontend | Next.js 16 (App Router, TypeScript, Tailwind v4, TanStack Query, Zustand)   |
| Backend  | NestJS 11 (TypeScript), Prisma 7 (with `@prisma/adapter-pg`), JWT, bcrypt   |
| Database | PostgreSQL 16 (`docker-compose.yml` for local dev, `docker-compose.prod.yml` for production) |
| CI / CD  | GitHub Actions — build/test/lint, then build & push Docker images to GHCR and `docker compose up -d` over SSH |

## Repo Layout

```
mini-ecom/
├── backend/                       NestJS app
│   ├── prisma/                    schema, migrations, seed
│   └── src/
│       ├── auth/                  controller, service, model (Zod), JwtAuthGuard
│       ├── products/              controller, service, model — CRUD + cursor list + stats + categories
│       ├── prisma/                PrismaClient factory provider + module
│       ├── common/                shared helpers (Zod validation pipe)
│       └── app.module.ts          ConfigModule + ThrottlerModule (global rate limit)
├── frontend/                      Next.js app
│   └── src/
│       ├── app/
│       │   ├── (auth)/login/      split-screen sign-in
│       │   ├── (app)/             protected shell — top nav + catalog page
│       │   └── proxy.ts           cookie-based route gate (Next.js 16 renamed middleware → proxy)
│       ├── features/
│       │   ├── auth/              api, store, AuthProvider (idle timer + bootstrap refresh)
│       │   └── products/          api, hooks, hero, sidebar, filter bar, card, grid
│       ├── components/ui/         custom Select (no native <select>)
│       └── lib/                   apiClient (auto-refresh on 401), idle-timer, helpers
├── docker-compose.yml             Local-dev Postgres
├── docker-compose.prod.yml        Production stack (Postgres + backend + frontend)
├── backend/Dockerfile             multi-stage NestJS image
├── frontend/Dockerfile            multi-stage Next.js image (standalone output)
├── .github/workflows/
│   ├── ci.yml                     lint/typecheck/test/build + image build verify
│   └── deploy.yml                 build & push to GHCR, SSH `docker compose up`
├── PRD.md                         requirements
└── README.md
```

---

## Architecture decisions

### Backend

- **Feature-grouped modules** (`auth/`, `products/`) over type-grouped folders (`controllers/`,
  `services/`). At scale type-grouping causes shotgun surgery; feature folders keep each
  domain's controller, service, model, and module side-by-side.
- **Functional services with factory providers.** Each `*.service.ts` exports its logic as
  pure functions taking a `deps` object and a `FactoryProvider` that closes over the
  injected dependencies (Prisma, JwtService, ConfigService) and returns an object of bound
  methods. Avoids inheritance and class-state, keeps logic unit-testable in isolation.
- **Validation with Zod.** Each feature has a `*.model.ts` with Zod schemas + inferred
  types; a tiny `zParse(schema)` pipe validates request bodies and query strings. No
  `class-validator` / `class-transformer`.
- **Auth model** — short-lived access JWT (15 min) in the `Authorization` header,
  long-lived random refresh token in an `HttpOnly`, `SameSite=Lax`, `Secure`-in-prod cookie
  at `path=/`. The refresh token is a 96-byte random hex string; only its SHA-256 hash is
  stored, in a `refresh_tokens` table that records issuance, rotation (`replacedBy`),
  revocation, IP, and user-agent.
  - **Persistent session** = the cookie's max-age, not a session cookie.
  - **30-minute idle timeout** = sliding refresh expiry: every successful `/auth/refresh`
    issues a new token with another 30-minute window. Idle past 30 min, cookie is dead,
    user must re-auth.
- **Brute-force protection** — global `@nestjs/throttler` (60 rpm), tightened to **5 rpm
  per IP** on `/auth/login` via `@Throttle()`. Plus a `LoginAttempt` table that locks
  out an email after 5 failed attempts in 15 minutes (and an IP after 20).
- **Cursor pagination** — backend uses Prisma `cursor` + `take + 1` to detect a next page.
  Sort options each include `id` as a tiebreaker so the cursor is deterministic
  (`(createdAt desc, id desc)` for newest, `(priceCents asc, id asc)` for price-asc, etc.).
  No duplicate or skipped rows when products are inserted mid-scroll.
- **`limit` clamped server-side to `[5, 50]`** in the Zod schema, regardless of what the
  client sends.
- **Search & filter on real columns** — the `Product` table has indexed `category` and
  `(createdAt, id)` columns; search runs case-insensitive `contains` against `name` and
  `sku`; the category filter is an exact match against the indexed column.
- **Prisma 7 with driver adapter.** `prisma.config.ts` holds the datasource URL (Prisma 7
  no longer accepts `url` in `schema.prisma`); the runtime client is built via a
  `FactoryProvider` that constructs `PrismaClient` with `new PrismaPg({ connectionString })`.
  `OnApplicationShutdown` calls `$disconnect()`.

### Frontend

- **App Router with route groups.** `(auth)` for unauthenticated routes, `(app)` for
  authenticated. The `(app)` layout mounts `AuthProvider` which (a) bootstraps the session
  by calling `/auth/refresh` on mount and (b) runs the idle timer.
- **`proxy.ts`** (Next.js 16 renamed `middleware.ts` → `proxy.ts`) does a cheap cookie
  presence check. If `refresh_token` is missing on a protected route, redirect to
  `/login?next=…`. Backend remains the single source of authority — the proxy just
  prevents protected UI from flashing.
- **Access token in memory** — Zustand store, never `localStorage` (XSS-safe).
- **Refresh handled by `apiClient`** — wraps `fetch`, attaches the access token, retries
  once on 401 by calling `/auth/refresh`, and gives up on a second 401 (clears session).
  Single-flight guard prevents N concurrent refreshes.
- **Idle timer** listens to mousedown/keydown/scroll/touchstart/visibility events,
  rate-limited to one tick per 30 s. Every active period also pings `/auth/refresh`
  silently so the server-side cookie window keeps sliding. After 30 min without activity
  it calls `/auth/logout` and redirects to login.
- **TanStack Query** for `useInfiniteQuery` (cursor concatenation), request de-duplication,
  cache between filter changes, and built-in loading/error states. Without it the same
  hook is ~50 lines of careful `useState`/`useEffect`.
- **URL-state-driven filters.** `?q=`, `?sort=`, `?inStock=`, `?category=`, `?limit=` —
  every filter is a query-param so links are shareable and back/forward navigation works.
- **Custom `<Select>`** (`components/ui/select.tsx`) — accessible button + listbox + option
  pattern with keyboard navigation, hover/active state, click-outside dismiss. Replaces the
  native `<select>` for a consistent look across browsers.
- **Global `.field` class** — every text input/search/email/password shares one set of
  styles (font, font-size, radius, focus state) so the form layer is uniform.
- **Responsive grid** — `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`, sticky sidebar on
  `lg+`. Tested at 375 / 768 / 1280 px.
- **Performance** — debounced search (300 ms), TanStack Query de-duplicates concurrent
  requests, cursor pagination keeps payloads small. List virtualisation was tried with
  `useWindowVirtualizer` but added more fragility than it earned for a 75-product demo;
  ripped out and noted as a future optimisation.

---

## Local setup

### Prerequisites

- Node.js 20+
- npm 10+
- Docker (for Postgres) — or a local Postgres 16 instance

### Steps

```bash
# 1. Env files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Postgres
docker compose up -d

# 3. Install deps
(cd backend && npm install)
(cd frontend && npm install)

# 4. Database — apply migrations + seed 75 products and the demo user
cd backend
npx prisma migrate deploy
npx prisma db seed

# 5. Run apps (two terminals)
cd backend  && npm run start:dev   # http://localhost:4000
cd frontend && npm run dev         # http://localhost:3000
```

### Demo credentials

```
demo@mini-ecom.test   /   Demo!Pass123
```

---

## API surface

| Method | Path                       | Auth     | Notes                                                                 |
|--------|----------------------------|----------|-----------------------------------------------------------------------|
| POST   | `/auth/register`           | -        | rate-limited 10/min/IP                                                |
| POST   | `/auth/login`              | -        | rate-limited 5/min/IP, sets `refresh_token` cookie + returns access JWT |
| POST   | `/auth/refresh`            | cookie   | rotates the refresh cookie + returns new access JWT                   |
| POST   | `/auth/logout`             | cookie   | revokes refresh token + clears cookie                                 |
| GET    | `/auth/me`                 | bearer   | echoes `{ sub, email }`                                               |
| GET    | `/products`                | -        | `?cursor=&limit=&q=&sort=&inStock=&category=`; `limit` clamped `[5,50]` |
| GET    | `/products/stats`          | -        | totals + price min/max                                                |
| GET    | `/products/categories`     | -        | distinct categories with counts                                       |
| GET    | `/products/:id`            | -        |                                                                       |
| POST   | `/products`                | bearer   | full create                                                           |
| PUT    | `/products/:id`            | bearer   | partial update                                                        |
| DELETE | `/products/:id`            | bearer   |                                                                       |

---

## CI / CD

Both CI and CD run on GitHub Actions. **CD ships Docker images** (no PM2, no SSH-build).

### CI — `.github/workflows/ci.yml`

Runs on every push and PR to `main`. Three parallel jobs:

- **Frontend** — `npm ci` → `lint` → `tsc --noEmit` → `next build`.
- **Backend** — Postgres 16 service container → `npm ci` → `prisma generate` → `lint` →
  `tsc --noEmit` → `jest --passWithNoTests` → `nest build`.
- **`docker-images`** — depends on the two above; runs `docker buildx` against both
  Dockerfiles to verify the production images build cleanly. Uses GHA cache so subsequent
  runs are fast.

### CD — `.github/workflows/deploy.yml`

Triggers on push to `main` (or manual dispatch).

1. **`build-and-push`** — builds backend + frontend images and pushes to **GHCR**
   (`ghcr.io/<owner>/<repo>/{backend,frontend}`) tagged with both the short commit SHA and
   `latest`. `NEXT_PUBLIC_API_URL` is baked into the frontend image at build time from a
   GitHub secret, since Next.js needs public env vars at build time.
2. **`deploy`** — SSHes into the host, logs Docker into GHCR with a PAT (read:packages),
   runs `docker compose -f docker-compose.prod.yml pull && up -d --remove-orphans`, then
   prunes dangling images.

The **server only needs Docker, Docker Compose, git, and a checkout of the repo at
`DEPLOY_PATH`** — no Node, no PM2.

### Required GitHub secrets

| Secret                | What                                               |
|-----------------------|----------------------------------------------------|
| `DEPLOY_HOST`         | server hostname or IP                              |
| `DEPLOY_USER`         | SSH user                                           |
| `DEPLOY_SSH_KEY`      | private key authorised on the host                 |
| `DEPLOY_PATH`         | path to the repo on the server (e.g. `/opt/mini-ecom`) |
| `DEPLOY_PORT`         | SSH port (optional, default 22)                    |
| `GHCR_USER`           | the user that owns the PAT below                   |
| `GHCR_TOKEN`          | classic PAT with `read:packages` scope             |
| `NEXT_PUBLIC_API_URL` | the public API URL the built frontend should hit   |

The deploy workflow itself uses the auto-injected `GITHUB_TOKEN` to push to GHCR; the PAT
above is only for the *server* to pull.

### Server prerequisites (one-time)

```bash
# As the deploy user
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER && newgrp docker

# Clone the repo at the configured DEPLOY_PATH
git clone <repo-url> /opt/mini-ecom
cd /opt/mini-ecom

# Create a .env file next to docker-compose.prod.yml with:
#   POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
#   JWT_ACCESS_SECRET
#   CORS_ORIGIN
#   BACKEND_IMAGE=ghcr.io/<owner>/<repo>/backend
#   FRONTEND_IMAGE=ghcr.io/<owner>/<repo>/frontend
#   IMAGE_TAG=latest    # the deploy workflow overrides this with the SHA
```

After that, every push to `main` triggers the workflow → images get built → pushed →
server pulls → containers reload. Backend container runs `prisma migrate deploy` on
startup so schema changes apply automatically.

### Local production smoke test

```bash
# Build and run the production stack locally (uses Dockerfiles directly)
docker compose -f docker-compose.prod.yml --build up -d
```

Or, against pre-built GHCR images: log in (`docker login ghcr.io …`), set the env vars
above, and `docker compose -f docker-compose.prod.yml up -d`.

---

## Out of scope

Per the PRD: checkout, payments, order management, admin/CMS surface, production
deployment infrastructure beyond CI.
