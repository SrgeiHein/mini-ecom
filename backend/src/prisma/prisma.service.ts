import { FactoryProvider } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export const PRISMA = 'PRISMA_CLIENT';

export type PrismaService = PrismaClient;

export function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
}

export const prismaProvider: FactoryProvider<PrismaClient> = {
  provide: PRISMA,
  useFactory: createPrismaClient,
};
