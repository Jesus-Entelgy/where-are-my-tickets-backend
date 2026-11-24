import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../users/user.entity.js';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export function isAuthTokenPayload(
  payload: unknown,
): payload is AuthTokenPayload {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('sub' in payload) ||
    !('email' in payload) ||
    !('role' in payload)
  ) {
    return false;
  }

  return (
    typeof payload.sub === 'string' &&
    payload.sub.length > 0 &&
    typeof payload.email === 'string' &&
    payload.email.length > 0 &&
    (payload.role === UserRole.USER || payload.role === UserRole.ADMIN)
  );
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  validate(payload: unknown): AuthTokenPayload {
    if (!isAuthTokenPayload(payload)) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
