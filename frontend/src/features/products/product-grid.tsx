'use client';

import { useEffect, useRef } from 'react';
import { ProductCard } from './product-card';
import { useInfiniteProducts } from './use-infinite-products';
import type { ProductsFilters } from './types';

interface ProductGridProps {
  limit: number;
  filters: ProductsFilters;
}

const SkeletonCard = () => (
  <div className="h-full animate-pulse overflow-hidden rounded-2xl border border-zinc-200 bg-white">
    <div className="aspect-square w-full bg-zinc-100" />
    <div className="space-y-2 p-4">
      <div className="h-4 w-3/4 rounded bg-zinc-100" />
      <div className="h-3 w-1/3 rounded bg-zinc-100" />
      <div className="h-4 w-1/2 rounded bg-zinc-100" />
    </div>
  </div>
);

export function ProductGrid({ limit, filters }: ProductGridProps) {
  const {
    data,
    error,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteProducts(limit, filters);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: limit }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        <p>Could not load products: {error.message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-red-50"
        >
          Retry
        </button>
      </div>
    );
  }

  const items = data.pages.flatMap((p) => p.items);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        <p className="text-base font-medium text-zinc-700">
          No products match your filters
        </p>
        <p className="mt-1 text-zinc-500">
          Try clearing the search or turning off &quot;in stock only&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      {isFetchingNextPage && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
            <SkeletonCard key={`more-${i}`} />
          ))}
        </div>
      )}

      {!hasNextPage && (
        <p className="py-4 text-center text-xs text-zinc-500">
          You&apos;ve reached the end — {items.length} products shown.
        </p>
      )}
    </div>
  );
}
