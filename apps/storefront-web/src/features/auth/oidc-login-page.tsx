import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getUserManager, isOidcConfigured } from '../../lib/oidc-user-manager';

export function OidcLoginPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const returnUrl = sp.get('returnUrl') && sp.get('returnUrl')!.startsWith('/') ? sp.get('returnUrl')! : '/';
  const redirectStarted = useRef(false);

  useEffect(() => {
    if (!isOidcConfigured()) {
      void navigate('/user/login', { replace: true });
      return;
    }
    const mgr = getUserManager();
    if (!mgr || redirectStarted.current) return;
    redirectStarted.current = true;
    void mgr.signinRedirect({ state: returnUrl });
  }, [navigate, returnUrl]);

  return (
    <div className="auth-page">
      <p>Redirecting to the identity provider…</p>
    </div>
  );
}
