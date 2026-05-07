import { FactoryProvider, NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient, Product } from '@prisma/client';
import { PRISMA } from '../prisma/prisma.service';
import type {
  CreateProductInput,
  PaginatedProducts,
  ProductsStats,
  SortOption,
  UpdateProductInput,
} from './products.model';

interface ProductsDeps {
  prisma: PrismaClient;
}

interface ListParams {
  cursor?: string;
  limit: number;
  q?: string;
  sort: SortOption;
  inStock?: boolean;
  category?: string;
}

const orderByForSort = (sort: SortOption): Prisma.ProductOrderByWithRelationInput[] => {
  switch (sort) {
    case 'priceAsc':
      return [{ priceCents: 'asc' }, { id: 'asc' }];
    case 'priceDesc':
      return [{ priceCents: 'desc' }, { id: 'desc' }];
    case 'nameAsc':
      return [{ name: 'asc' }, { id: 'asc' }];
    case 'newest':
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
  }
};

const buildWhere = (params: ListParams): Prisma.ProductWhereInput => {
  const conditions: Prisma.ProductWhereInput[] = [];

  if (params.q) {
    conditions.push({
      OR: [
        { name: { contains: params.q, mode: 'insensitive' } },
        { sku: { contains: params.q, mode: 'insensitive' } },
      ],
    });
  }
  if (params.inStock) {
    conditions.push({ stock: { gt: 0 } });
  }
  if (params.category) {
    conditions.push({ category: params.category });
  }

  return conditions.length === 0 ? {} : { AND: conditions };
};

async function listProducts(
  deps: ProductsDeps,
  params: ListParams,
): Promise<PaginatedProducts<Product>> {
  const { cursor, limit } = params;

  const args: Prisma.ProductFindManyArgs = {
    take: limit + 1,
    where: buildWhere(params),
    orderBy: orderByForSort(params.sort),
  };

  if (cursor) {
    args.cursor = { id: cursor };
    args.skip = 1;
  }

  const rows = await deps.prisma.product.findMany(args);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor, limit };
}

async function getProduct(deps: ProductsDeps, id: string): Promise<Product> {
  const product = await deps.prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundException(`Product ${id} not found`);
  }
  return product;
}

function createProduct(
  deps: ProductsDeps,
  input: CreateProductInput,
): Promise<Product> {
  return deps.prisma.product.create({ data: input });
}

async function updateProduct(
  deps: ProductsDeps,
  id: string,
  input: UpdateProductInput,
): Promise<Product> {
  await getProduct(deps, id);
  return deps.prisma.product.update({ where: { id }, data: input });
}

async function deleteProduct(
  deps: ProductsDeps,
  id: string,
): Promise<{ id: string }> {
  await getProduct(deps, id);
  await deps.prisma.product.delete({ where: { id } });
  return { id };
}

async function listCategories(
  deps: ProductsDeps,
): Promise<{ name: string; count: number }[]> {
  const rows = await deps.prisma.$queryRaw<
    { category: string; count: bigint }[]
  >`SELECT category, COUNT(*)::bigint AS count
    FROM products
    GROUP BY category
    ORDER BY category ASC`;
  return rows.map((r) => ({ name: r.category, count: Number(r.count) }));
}

async function getStats(deps: ProductsDeps): Promise<ProductsStats> {
  const [total, inStock, agg] = await Promise.all([
    deps.prisma.product.count(),
    deps.prisma.product.count({ where: { stock: { gt: 0 } } }),
    deps.prisma.product.aggregate({
      _min: { priceCents: true },
      _max: { priceCents: true },
    }),
  ]);
  return {
    total,
    inStock,
    minPriceCents: agg._min.priceCents ?? 0,
    maxPriceCents: agg._max.priceCents ?? 0,
  };
}

export const PRODUCTS_SERVICE = 'PRODUCTS_SERVICE';

export interface ProductsService {
  list: (params: ListParams) => Promise<PaginatedProducts<Product>>;
  get: (id: string) => Promise<Product>;
  create: (input: CreateProductInput) => Promise<Product>;
  update: (id: string, input: UpdateProductInput) => Promise<Product>;
  remove: (id: string) => Promise<{ id: string }>;
  stats: () => Promise<ProductsStats>;
  categories: () => Promise<{ name: string; count: number }[]>;
}

export const productsServiceProvider: FactoryProvider<ProductsService> = {
  provide: PRODUCTS_SERVICE,
  inject: [PRISMA],
  useFactory: (prisma: PrismaClient): ProductsService => {
    const deps: ProductsDeps = { prisma };
    return {
      list: (params) => listProducts(deps, params),
      get: (id) => getProduct(deps, id),
      create: (input) => createProduct(deps, input),
      update: (id, input) => updateProduct(deps, id, input),
      remove: (id) => deleteProduct(deps, id),
      stats: () => getStats(deps),
      categories: () => listCategories(deps),
    };
  },
};
