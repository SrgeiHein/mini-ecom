'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CategorySidebar } from '@/features/products/category-sidebar';
import { FilterBar } from '@/features/products/filter-bar';
import { Hero } from '@/features/products/hero';
import { ProductGrid } from '@/features/products/product-grid';
import {
  DEFAULT_LIMIT,
  SORT_OPTIONS,
  clampLimit,
  type ProductsFilters,
  type SortOption,
} from '@/features/products/types';
import { useCategories } from '@/features/products/use-infinite-products';
import { useDebouncedValue } from '@/lib/use-debounced-value';

const isSort = (value: string | null): value is SortOption =>
  !!value && SORT_OPTIONS.some((o) => o.value === value);

export function CatalogContent() {
  const router = useRouter();
  const params = useSearchParams();

  const limit = useMemo(() => {
    const raw = params.get('limit');
    if (!raw) return DEFAULT_LIMIT;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? clampLimit(parsed) : DEFAULT_LIMIT;
  }, [params]);

  const sort: SortOption = useMemo(() => {
    const raw = params.get('sort');
    return isSort(raw) ? raw : 'newest';
  }, [params]);

  const inStock = params.get('inStock') === 'true';

  const { data: categories, isPending: categoriesPending } = useCategories();
  const validCategoryNames = useMemo(
    () => new Set((categories ?? []).map((c) => c.name)),
    [categories],
  );

  const rawCategory = params.get('category');
  const category =
    rawCategory && validCategoryNames.has(rawCategory) ? rawCategory : null;

  const initialQ = params.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(initialQ);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);

  const filters: ProductsFilters = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      sort,
      inStock: inStock || undefined,
      category: category ?? undefined,
    }),
    [debouncedSearch, sort, inStock, category],
  );

  const updateParams = (mutator: (usp: URLSearchParams) => void) => {
    const usp = new URLSearchParams(params.toString());
    mutator(usp);
    const qs = usp.toString();
    router.replace(qs ? `/?${qs}` : '/');
  };

  const setSort = (next: SortOption) =>
    updateParams((usp) => {
      if (next === 'newest') usp.delete('sort');
      else usp.set('sort', next);
    });

  const setInStock = (next: boolean) =>
    updateParams((usp) => {
      if (next) usp.set('inStock', 'true');
      else usp.delete('inStock');
    });

  const setCategory = (next: string | null) =>
    updateParams((usp) => {
      if (next) usp.set('category', next);
      else usp.delete('category');
    });

  const setPageSize = (next: number) =>
    updateParams((usp) => {
      const clamped = clampLimit(next);
      if (clamped === DEFAULT_LIMIT) usp.delete('limit');
      else usp.set('limit', String(clamped));
    });

  useEffect(() => {
    const current = params.get('q') ?? '';
    if (current === debouncedSearch) return;
    updateParams((usp) => {
      if (debouncedSearch) usp.set('q', debouncedSearch);
      else usp.delete('q');
    });
    // updateParams reads `params` & `router`, which are stable per render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const resultsLabel = filters.q
    ? `Results for "${filters.q}"`
    : filters.category
      ? `Showing ${filters.category}`
      : filters.inStock
        ? 'Showing in-stock items'
        : 'Showing all products';

  return (
    <div className="space-y-6">
      <Hero search={searchInput} onSearchChange={setSearchInput} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="lg:w-64 lg:flex-none">
          <div className="lg:sticky lg:top-20">
            <CategorySidebar
              categories={categories}
              isLoading={categoriesPending}
              selected={category}
              onSelect={setCategory}
              inStock={inStock}
              onInStockChange={setInStock}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <FilterBar
            sort={sort}
            onSortChange={setSort}
            resultsLabel={resultsLabel}
            pageSize={limit}
            onPageSizeChange={setPageSize}
          />
          <ProductGrid limit={limit} filters={filters} />
        </div>
      </div>
    </div>
  );
}
