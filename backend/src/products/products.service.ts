import { FactoryProvider, NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient, Product } from '@prisma/client';
import { PRISMA } from '../prisma/prisma.service';
import type {
  CreateProductInput,
  PaginatedProducts,
  UpdateProductInput,
} from './products.model';

interface ProductsDeps {
  prisma: PrismaClient;
}

async function listProducts(
  deps: ProductsDeps,
  params: { cursor?: string; limit: number },
): Promise<PaginatedProducts<Product>> {
  const { cursor, limit } = params;

  const args: Prisma.ProductFindManyArgs = {
    take: limit + 1,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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

async function getProduct(
  deps: ProductsDeps,
  id: string,
): Promise<Product> {
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

export const PRODUCTS_SERVICE = 'PRODUCTS_SERVICE';

export interface ProductsService {
  list: (params: {
    cursor?: string;
    limit: number;
  }) => Promise<PaginatedProducts<Product>>;
  get: (id: string) => Promise<Product>;
  create: (input: CreateProductInput) => Promise<Product>;
  update: (id: string, input: UpdateProductInput) => Promise<Product>;
  remove: (id: string) => Promise<{ id: string }>;
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
    };
  },
};
