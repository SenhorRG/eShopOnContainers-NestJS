import type { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';

type JwtRequestUser = { sub?: string };

@Injectable()
export class BasketAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const bypass = normalizeBool(process.env.ESHOP_BASKET_AUTH_BYPASS);
    if (!bypass) {
      return super.canActivate(context) as boolean | Promise<boolean> | Observable<boolean>;
    }

    const req = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    req.user ??= {};
    req.user.sub = process.env.ESHOP_BASKET_DEV_USER_SUB ?? 'demo-basket-sub';
    return true;
  }
}

function normalizeBool(raw?: string): boolean {
  const v = (raw ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}
