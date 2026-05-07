'use client';

interface HeroProps {
  search: string;
  onSearchChange: (next: string) => void;
}

export function Hero({ search, onSearchChange }: HeroProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Live demo catalog
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Discover gear you&apos;ll actually use.
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Curated peripherals, accessories, and everyday items — searchable,
          filterable, infinite-scrollable.
        </p>
      </div>

      <label className="mt-6 relative block">
        <span className="sr-only">Search products</span>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or SKU…"
          className="field pl-11"
        />
      </label>
    </section>
  );
}
