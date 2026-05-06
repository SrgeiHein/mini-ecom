import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { zParse } from '../common/zod.pipe';
import {
  loginSchema,
  registerSchema,
  type JwtPayload,
  type LoginInput,
  type RegisterInput,
} from './auth.model';
import { AUTH_SERVICE, type AuthService } from './auth.service';
import { CurrentUser, JwtAuthGuard } from './jwt.guard';

const REFRESH_COOKIE = 'refresh_token';

const setRefreshCookie = (res: Response, token: string, maxAgeMs: number) =>
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth',
    maxAge: maxAgeMs,
  });

const clearRefreshCookie = (res: Response) =>
  res.clearCookie(REFRESH_COOKIE, { path: '/auth' });

const clientIp = (req: Request): string =>
  (req.ip ?? req.socket.remoteAddress ?? '0.0.0.0').toString();

@Controller('auth')
export class AuthController {
  constructor(@Inject(AUTH_SERVICE) private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  register(@Body(zParse(registerSchema)) body: RegisterInput) {
    return this.auth.register(body.email, body.password);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body(zParse(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = clientIp(req);
    const ua = req.headers['user-agent'] ?? undefined;
    const user = await this.auth.validateUser(body.email, body.password, ip);
    const tokens = await this.auth.issueTokens(user.id, user.email, ip, ua);
    setRefreshCookie(res, tokens.refreshToken, this.auth.refreshCookieMaxAgeMs());
    return {
      accessToken: tokens.accessToken,
      user: { id: user.id, email: user.email },
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const presented = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE
    ];
    if (!presented) throw new UnauthorizedException('Missing refresh token');
    const ip = clientIp(req);
    const ua = req.headers['user-agent'] ?? undefined;
    const tokens = await this.auth.rotateRefreshToken(presented, ip, ua);
    setRefreshCookie(res, tokens.refreshToken, this.auth.refreshCookieMaxAgeMs());
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const presented = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE
    ];
    if (presented) {
      await this.auth.revokeRefreshToken(presented);
    }
    clearRefreshCookie(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }
}
