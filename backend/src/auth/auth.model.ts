import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}
