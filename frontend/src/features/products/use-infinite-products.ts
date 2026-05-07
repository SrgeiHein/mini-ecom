'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchProducts, fetchProductsStats } from './api';
import type {
  CategoryEntry,
  ProductsFilters,
  ProductsPage,
  ProductsStats,
} from './types';

export const useInfiniteProducts = (limit: number, filters: ProductsFilters) =>
  useInfiniteQuery<
    ProductsPage,
    Error,
    { pages: ProductsPage[]; pageParams: (string | undefined)[] },
    [string, number, ProductsFilters],
    string | undefined
  >({
    queryKey: ['products', limit, filters],
    queryFn: ({ pageParam }) => fetchProducts({ cursor: pageParam, limit, filters }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const useProductsStats = () =>
  useQuery<ProductsStats>({
    queryKey: ['products', 'stats'],
    queryFn: fetchProductsStats,
    staleTime: 5 * 60 * 1000,
  });

export const useCategories = () =>
  useQuery<CategoryEntry[]>({
    queryKey: ['products', 'categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
