import { Suspense } from 'react';
import { LoginForm } from './login-form';

const FEATURES = [
  'Cursor-paginated infinite scroll',
  'Server-driven search & filters',
  'Secure, persistent sessions',
] as const;

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-white md:flex-row">
      {/* Brand panel */}
      <aside className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-12 text-center text-white md:w-1/2 md:px-10 md:py-14 lg:px-16">
        <div
          aria-hidden="true"
          className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl"
        />

        <div className="relative flex w-full max-w-sm flex-col items-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 backdrop-blur">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M3 7h18l-1.5 11.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 7Z"
                  strokeLinejoin="round"
                />
                <path d="M8 7V5a4 4 0 0 1 8 0v2" strokeLinejoin="round" />
              </svg>
            </span>
            Mini E-commerce
          </div>

          <h2 className="mt-8 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Shopping that feels
            <br />
            instant.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Browse, search, and scroll without ever waiting on the page.
          </p>

          <ul className="mt-8 flex flex-col items-start gap-2 text-sm">
            {FEATURES.map((label) => (
              <li key={label} className="flex items-center gap-2.5 text-white/90">
                <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-white/15 ring-1 ring-white/20">
                  <svg
                    aria-hidden="true"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      d="m4 10 4 4 8-8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 md:py-14">
        <Suspense
          fallback={<div className="text-sm text-zinc-500">Loading…</div>}
        >
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
