import { z } from 'zod';

export const MIN_LIMIT = 5;
export const MAX_LIMIT = 50;
export const DEFAULT_LIMIT = 20;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50] as const;

export const SORT_OPTIONS = [
  'newest',
  'priceAsc',
  'priceDesc',
  'nameAsc',
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

const clampLimit = (n: number) =>
  Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.trunc(n)));

const numberFromQuery = z.preprocess(
  (v) => (typeof v === 'string' ? Number(v) : v),
  z.number(),
);

const booleanFromQuery = z.preprocess(
  (v) => (typeof v === 'string' ? v === 'true' : v),
  z.boolean(),
);

export const listProductsQuerySchema = z.object({
  cursor: z.string().min(1).max(64).optional(),
  limit: numberFromQuery
    .pipe(z.number().int())
    .optional()
    .transform((n) => clampLimit(n ?? DEFAULT_LIMIT)),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(SORT_OPTIONS).optional().default('newest'),
  inStock: booleanFromQuery.optional(),
  category: z.string().trim().min(1).max(50).optional(),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const createProductSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  category: z.string().min(1).max(50),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default('USD'),
  imageUrl: z.string().url().max(2048).optional(),
  stock: z.number().int().nonnegative().default(0),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export interface PaginatedProducts<T> {
  items: T[];
  nextCursor: string | null;
  limit: number;
}

export interface ProductsStats {
  total: number;
  inStock: number;
  minPriceCents: number;
  maxPriceCents: number;
}
