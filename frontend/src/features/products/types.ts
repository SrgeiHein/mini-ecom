export const MIN_LIMIT = 5;
export const MAX_LIMIT = 50;
export const DEFAULT_LIMIT = 20;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50] as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
  { value: 'nameAsc', label: 'Name: A → Z' },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsPage {
  items: Product[];
  nextCursor: string | null;
  limit: number;
}

export interface ProductsStats {
  total: number;
  inStock: number;
  minPriceCents: number;
  maxPriceCents: number;
}

export interface ProductsFilters {
  q?: string;
  sort: SortOption;
  inStock?: boolean;
  category?: string;
}

export interface CategoryEntry {
  name: string;
  count: number;
}

export const clampLimit = (n: number): number =>
  Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.trunc(n)));

export const formatPrice = (cents: number, currency: string): string =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(cents / 100);
