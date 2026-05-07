import {
  Global,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { PrismaClient } from '@prisma/client';
import { PRISMA, prismaProvider } from './prisma.service';

@Global()
@Module({
  providers: [prismaProvider],
  exports: [PRISMA],
})
export class PrismaModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown() {
    const client = this.moduleRef.get<PrismaClient>(PRISMA, { strict: false });
    await client.$disconnect();
  }
}
