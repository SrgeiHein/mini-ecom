import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

export const zParse = <T>(schema: ZodSchema<T>): PipeTransform<unknown, T> => ({
  transform(value: unknown): T {
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        issues: result.error.flatten(),
      });
    }
    return result.data;
  },
});
