'use client';

import { cn } from '@/lib/cn';
import { getCategoryColor } from './category';
import type { CategoryEntry } from './types';

interface CategorySidebarProps {
  categories: CategoryEntry[] | undefined;
  isLoading: boolean;
  selected: string | null;
  onSelect: (next: string | null) => void;
  inStock: boolean;
  onInStockChange: (next: boolean) => void;
}

export function CategorySidebar({
  categories,
  isLoading,
  selected,
  onSelect,
  inStock,
  onInStockChange,
}: CategorySidebarProps) {
  return (
    <aside className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <section>
        <header className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Categories
          </h2>
          {selected && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
            >
              Clear
            </button>
          )}
        </header>

        <ul className="mt-3 flex flex-col">
          <li>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition',
                selected === null
                  ? 'bg-indigo-50 font-semibold text-indigo-700'
                  : 'text-zinc-700 hover:bg-zinc-50',
              )}
            >
              <span>All categories</span>
            </button>
          </li>

          {isLoading && (
            <li className="px-2.5 py-2 text-xs text-zinc-400">Loading…</li>
          )}

          {categories?.map((cat) => {
            const active = selected === cat.name;
            const color = getCategoryColor(cat.name);
            return (
              <li key={cat.name}>
                <button
                  type="button"
                  onClick={() => onSelect(cat.name)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition',
                    active
                      ? 'bg-indigo-50 font-semibold text-indigo-700'
                      : 'text-zinc-700 hover:bg-zinc-50',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn('h-2 w-2 flex-none rounded-full', color.dot)}
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-[11px] tabular-nums text-zinc-400">
                    {cat.count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-t border-zinc-100 pt-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Filters
        </h2>
        <label className="mt-3 flex cursor-pointer items-center gap-2.5 px-1 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-0"
          />
          <span className="text-zinc-700">In stock only</span>
        </label>
      </section>
    </aside>
  );
}
