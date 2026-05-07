'use client';

import Image from 'next/image';
import { getCategory, getCategoryColor } from './category';
import { formatPrice, type Product } from './types';

export function ProductCard({ product }: { product: Product }) {
  const category = getCategory(product);
  const color = getCategoryColor(category);
  const inStock = product.stock > 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-0 transition group-hover:opacity-100"
      />

      <div className="relative aspect-square w-full overflow-hidden bg-zinc-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
            No image
          </div>
        )}

        <div
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ${color.bg} ${color.text} ${color.ring}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
          {category}
        </div>

        {!inStock && (
          <div className="absolute right-3 top-3 rounded-full bg-zinc-900/80 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
            Sold out
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-900">
          {product.name}
        </h3>
        <p className="font-mono text-[11px] text-zinc-400">{product.sku}</p>

        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="text-base font-bold text-zinc-900">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          <span
            className={
              inStock
                ? 'text-[11px] font-medium text-emerald-600'
                : 'text-[11px] text-zinc-400'
            }
          >
            {inStock ? `${product.stock} in stock` : '—'}
          </span>
        </div>
      </div>
    </article>
  );
}
