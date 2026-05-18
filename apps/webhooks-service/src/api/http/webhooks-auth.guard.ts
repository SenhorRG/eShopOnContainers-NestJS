import {
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';

type JwtRequestUser = { sub?: string; username?: string };

function normalizeBool(raw?: string): boolean {
  const v = (raw ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Optional dev bypass aligned with other `@eshop/*` HTTP services. */
@Injectable()
export class WebhooksAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    if (!normalizeBool(process.env.ESHOP_WEBHOOKS_AUTH_BYPASS)) {
      return super.canActivate(context) as boolean | Promise<boolean> | Observable<boolean>;
    }

    const req = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    req.user ??= {};
    req.user.sub = process.env.ESHOP_WEBHOOKS_DEV_USER_SUB ?? 'demo-webhooks-sub';
    req.user.username ??= process.env.ESHOP_WEBHOOKS_DEV_USERNAME ?? 'Demo Webhooks User';

    return true;
  }
}
