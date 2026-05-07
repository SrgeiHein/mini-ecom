import {
  FactoryProvider,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PRISMA } from '../prisma/prisma.service';
import type { AuthTokens, JwtPayload } from './auth.model';

const FAILED_WINDOW_MINUTES = 15;
const FAILED_THRESHOLD = 5;
const BCRYPT_ROUNDS = 12;

interface AuthDeps {
  prisma: PrismaClient;
  jwt: JwtService;
  config: ConfigService;
}

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const inactivityMs = (deps: AuthDeps): number => {
  const minutes = parseInt(
    deps.config.get<string>('INACTIVITY_TIMEOUT_MINUTES') ?? '30',
    10,
  );
  return minutes * 60 * 1000;
};

async function register(
  deps: AuthDeps,
  email: string,
  password: string,
): Promise<{ id: string; email: string }> {
  const normalised = email.toLowerCase();
  const existing = await deps.prisma.user.findUnique({
    where: { email: normalised },
  });
  if (existing) {
    throw new ForbiddenException('Email already registered');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return deps.prisma.user.create({
    data: { email: normalised, passwordHash },
    select: { id: true, email: true },
  });
}

async function assertNotLockedOut(
  deps: AuthDeps,
  email: string,
  ip: string,
): Promise<void> {
  const since = new Date(Date.now() - FAILED_WINDOW_MINUTES * 60 * 1000);
  const [emailFails, ipFails] = await Promise.all([
    deps.prisma.loginAttempt.count({
      where: { email, successful: false, createdAt: { gte: since } },
    }),
    deps.prisma.loginAttempt.count({
      where: { ip, successful: false, createdAt: { gte: since } },
    }),
  ]);
  if (emailFails >= FAILED_THRESHOLD || ipFails >= FAILED_THRESHOLD * 4) {
    throw new ForbiddenException(
      `Too many failed attempts. Try again in ${FAILED_WINDOW_MINUTES} minutes.`,
    );
  }
}

async function validateUser(
  deps: AuthDeps,
  email: string,
  password: string,
  ip: string,
): Promise<{ id: string; email: string }> {
  const normalised = email.toLowerCase();
  await assertNotLockedOut(deps, normalised, ip);

  const user = await deps.prisma.user.findUnique({
    where: { email: normalised },
  });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;

  await deps.prisma.loginAttempt.create({
    data: {
      email: normalised,
      ip,
      successful: !!ok && !!user,
      userId: user?.id ?? null,
    },
  });

  if (!user || !ok) {
    throw new UnauthorizedException('Invalid credentials');
  }
  return { id: user.id, email: user.email };
}

async function issueTokens(
  deps: AuthDeps,
  userId: string,
  email: string,
  ip?: string,
  userAgent?: string,
): Promise<AuthTokens> {
  const accessToken = await deps.jwt.signAsync({
    sub: userId,
    email,
  } satisfies JwtPayload);

  const refreshToken = randomBytes(48).toString('hex');
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + inactivityMs(deps));

  await deps.prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt, ip, userAgent },
  });

  return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
}

async function rotateRefreshToken(
  deps: AuthDeps,
  presentedToken: string,
  ip?: string,
  userAgent?: string,
): Promise<AuthTokens> {
  const tokenHash = hashToken(presentedToken);
  const stored = await deps.prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  const newTokens = await issueTokens(
    deps,
    stored.userId,
    stored.user.email,
    ip,
    userAgent,
  );
  const newHash = hashToken(newTokens.refreshToken);

  await deps.prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedBy: newHash },
  });

  return newTokens;
}

async function revokeRefreshToken(
  deps: AuthDeps,
  presentedToken: string,
): Promise<void> {
  const tokenHash = hashToken(presentedToken);
  await deps.prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface AuthService {
  register: (email: string, password: string) => Promise<{ id: string; email: string }>;
  validateUser: (
    email: string,
    password: string,
    ip: string,
  ) => Promise<{ id: string; email: string }>;
  issueTokens: (
    userId: string,
    email: string,
    ip?: string,
    userAgent?: string,
  ) => Promise<AuthTokens>;
  rotateRefreshToken: (
    presentedToken: string,
    ip?: string,
    userAgent?: string,
  ) => Promise<AuthTokens>;
  revokeRefreshToken: (presentedToken: string) => Promise<void>;
  refreshCookieMaxAgeMs: () => number;
}

export const authServiceProvider: FactoryProvider<AuthService> = {
  provide: AUTH_SERVICE,
  inject: [PRISMA, JwtService, ConfigService],
  useFactory: (
    prisma: PrismaClient,
    jwt: JwtService,
    config: ConfigService,
  ): AuthService => {
    const deps: AuthDeps = { prisma, jwt, config };
    return {
      register: (email, password) => register(deps, email, password),
      validateUser: (email, password, ip) =>
        validateUser(deps, email, password, ip),
      issueTokens: (userId, email, ip, userAgent) =>
        issueTokens(deps, userId, email, ip, userAgent),
      rotateRefreshToken: (token, ip, userAgent) =>
        rotateRefreshToken(deps, token, ip, userAgent),
      revokeRefreshToken: (token) => revokeRefreshToken(deps, token),
      refreshCookieMaxAgeMs: () => inactivityMs(deps),
    };
  },
};
