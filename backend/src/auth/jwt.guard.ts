import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from './auth.model';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const header = req.headers.authorization;
    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice(7).trim();
    try {
      req.user = await this.jwt.verifyAsync<JwtPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    if (!req.user) {
      throw new Error('CurrentUser used on unauthenticated route');
    }
    return req.user;
  },
);
