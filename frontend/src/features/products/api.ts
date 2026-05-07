import { apiFetch } from '@/lib/api-client';
import type {
  CategoryEntry,
  ProductsFilters,
  ProductsPage,
  ProductsStats,
} from './types';

export const fetchProducts = (params: {
  cursor?: string;
  limit: number;
  filters: ProductsFilters;
}): Promise<ProductsPage> =>
  apiFetch<ProductsPage>('/products', {
    auth: false,
    query: {
      cursor: params.cursor,
      limit: params.limit,
      q: params.filters.q,
      sort: params.filters.sort,
      inStock: params.filters.inStock ? 'true' : undefined,
      category: params.filters.category,
    },
  });

export const fetchProductsStats = (): Promise<ProductsStats> =>
  apiFetch<ProductsStats>('/products/stats', { auth: false });

export const fetchCategories = (): Promise<CategoryEntry[]> =>
  apiFetch<CategoryEntry[]>('/products/categories', { auth: false });
