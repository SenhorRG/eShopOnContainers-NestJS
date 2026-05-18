import type { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';

type JwtRequestUser = { sub?: string };

/**
 * Mirrors optional dev bypass flags used elsewhere (`ESHOP_*_AUTH_BYPASS`).
 * Prefer short-lived bearer tokens minted alongside `ESHOP_ORDERING_JWT_SECRET` outside local-only flows.
 */
@Injectable()
export class OrderingAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const bypass = normalizeBool(process.env.ESHOP_ORDERING_AUTH_BYPASS);
    if (!bypass) {
      return super.canActivate(context) as boolean | Promise<boolean> | Observable<boolean>;
    }

    const req = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();

    req.user ??= {};
    req.user.sub = process.env.ESHOP_ORDERING_DEV_USER_SUB ?? 'demo-ordering-sub';
    (req.user as JwtRequestUser & { username?: string }).username ??=
      process.env.ESHOP_ORDERING_DEV_USERNAME ?? 'Demo Ordering User';

    return true;
  }
}

function normalizeBool(raw?: string): boolean {
  const v = (raw ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}
