import { ExecutionContext, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.entity.js';
import type { AuthTokenPayload } from './jwt.strategy.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

class AdminOnlyHandler {
  @Roles(UserRole.ADMIN)
  handle(this: void): void {}
}

class UnrestrictedHandler {
  handle(this: void): void {}
}

function createExecutionContext(
  user: Pick<AuthTokenPayload, 'role'> | undefined,
  handler: () => void,
  controller: Type<unknown>,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows a user whose role is required by the handler', () => {
    const context = createExecutionContext(
      { role: UserRole.ADMIN },
      AdminOnlyHandler.prototype.handle,
      AdminOnlyHandler,
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies a user whose role is not required by the handler', () => {
    const context = createExecutionContext(
      { role: UserRole.USER },
      AdminOnlyHandler.prototype.handle,
      AdminOnlyHandler,
    );

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies a request without an authenticated user when roles are required', () => {
    const context = createExecutionContext(
      undefined,
      AdminOnlyHandler.prototype.handle,
      AdminOnlyHandler,
    );

    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows a handler without role metadata', () => {
    const context = createExecutionContext(
      undefined,
      UnrestrictedHandler.prototype.handle,
      UnrestrictedHandler,
    );

    expect(guard.canActivate(context)).toBe(true);
  });
});
