import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getUserManager, isOidcConfigured } from '../../lib/oidc-user-manager';

export function OidcCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOidcConfigured()) {
      void navigate('/', { replace: true });
      return;
    }
    const mgr = getUserManager();
    if (!mgr) {
      void navigate('/', { replace: true });
      return;
    }
    void mgr
      .signinRedirectCallback()
      .then((user) => {
        const st = typeof user.state === 'string' && user.state.startsWith('/') ? user.state : '/';
        void navigate(st, { replace: true });
      })
      .catch(() => void navigate('/user/login', { replace: true }));
  }, [navigate]);

  return (
    <div className="auth-page">
      <p>Completing sign-in…</p>
    </div>
  );
}
