'use client';

import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { PAGE_SIZE_OPTIONS, type SortOption } from './types';

interface FilterBarProps {
  sort: SortOption;
  onSortChange: (next: SortOption) => void;
  resultsLabel: string;
  pageSize: number;
  onPageSizeChange: (next: number) => void;
}

const SORT_TABS: ReadonlyArray<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Latest' },
  { value: 'priceAsc', label: 'Price: Low' },
  { value: 'priceDesc', label: 'Price: High' },
  { value: 'nameAsc', label: 'Name A–Z' },
];

const PAGE_SIZE_OPTS = PAGE_SIZE_OPTIONS.map((n) => ({
  value: n,
  label: `${n} / page`,
}));

export function FilterBar({
  sort,
  onSortChange,
  resultsLabel,
  pageSize,
  onPageSizeChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:inline">
          Sort by
        </span>
        <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1">
          {SORT_TABS.map((tab) => {
            const active = sort === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onSortChange(tab.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition',
                  active
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500">{resultsLabel}</span>
        <div className="w-32">
          <Select<number>
            value={pageSize}
            options={PAGE_SIZE_OPTS}
            onChange={onPageSizeChange}
            ariaLabel="Items per page"
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
