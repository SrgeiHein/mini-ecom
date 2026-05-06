# Product Requirements Document — E-commerce Mini-App

## 1. Project Overview
Build a functional e-commerce product catalog with a focus on security, performance, and a
seamless user experience. The exercise targets a senior engineering role, so the evaluation
emphasises high-quality architectural decisions, clean code, and attention to edge cases.

- **Suggested time:** 3 hours
- **Deadline:** 3 days from receipt of the brief

## 2. Technical Stack
| Layer    | Technology |
|----------|------------|
| Frontend | Next.js (App Router, React, TypeScript) |
| Backend  | NestJS (TypeScript) |
| Database | PostgreSQL |

## 3. Functional Requirements

### 3.1 Authentication & Session Management
- **Secure login screen** with built-in spam and brute-force protection
  (e.g. rate limiting per IP/account, exponential back-off, optional CAPTCHA hook).
- **Persistent sessions:** users must remain logged in across tab close and browser restart.
- **Inactivity timeout:** sessions must automatically invalidate after **30 minutes** of
  inactivity, requiring the user to re-authenticate.
- Passwords stored using a strong, salted hash (bcrypt/argon2). No plaintext credentials in
  logs or responses.

### 3.2 Product Catalog & Infinite Scroll
- **Infinite scroll** on the product listing for a smooth browsing experience.
- **Configurable page size** controlled by the client, bounded server-side to
  `min = 5`, `max = 50` items per request.
- **Performance:** the frontend must render large lists without UI lag (virtualisation or
  windowed rendering, debounced fetches, request de-duplication).
- Stable, deterministic pagination (e.g. cursor-based) so duplicates do not appear when new
  products are inserted during scroll.

### 3.3 CI/CD Pipeline
- A basic pipeline demonstrating modern development workflow understanding:
  install → lint → typecheck → test → build, run on push and pull request.

## 4. Non-Functional Requirements
- **Security:** input validation, parameterised queries (no string-built SQL), HTTP-only
  cookies for session tokens, CSRF protection on state-changing routes, secure headers.
- **Observability:** structured logs, health check endpoint.
- **DX:** typed end-to-end (TypeScript), reproducible local setup, seed data for the catalog.
- **Code quality:** ESLint + Prettier, unit tests for critical logic.

## 5. Architectural Decisions (high level)
- **Monorepo layout** with `frontend/` (Next.js) and `backend/` (NestJS) so the two apps can
  evolve independently while sharing tooling and CI.
- **Auth model:** access token (short-lived JWT) + refresh token (long-lived, rotating,
  HTTP-only cookie). 30-minute idle timeout enforced by sliding refresh-token expiry that is
  bumped on each authenticated request; persistence across browser restarts comes from the
  refresh-token cookie surviving session close.
- **Brute-force protection:** per-IP and per-account rate limiting with progressive lockout.
- **Pagination:** cursor-based (`?cursor=&limit=`) with server-side clamp to `[5, 50]`.
- **Database access:** an ORM (Prisma or TypeORM) with migrations; seed script for products.
- **Frontend data layer:** TanStack Query `useInfiniteQuery` + an `IntersectionObserver`
  sentinel for infinite scroll, plus list virtualisation for large datasets.
- **CI:** GitHub Actions running install/lint/typecheck/test/build for both apps in parallel
  jobs against a Postgres service container.

## 6. Out of Scope (for this exercise)
- Checkout, payments, order management.
- Admin/CMS surface for managing products.
- Production deployment infrastructure beyond the CI pipeline.

## 7. Acceptance Criteria
- A user can register/log in; repeated failed logins are throttled.
- After closing and reopening the browser, the user is still authenticated — unless 30 minutes
  of inactivity have elapsed, in which case they must log in again.
- The catalog loads more items as the user scrolls; the page size respects the `[5, 50]` bound
  on both client and server.
- CI runs on every push and PR and fails the build on lint/type/test errors.
- README documents architecture and local setup steps.
