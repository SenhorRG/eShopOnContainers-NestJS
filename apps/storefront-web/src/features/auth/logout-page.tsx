import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getUserManager, isOidcConfigured } from '../../lib/oidc-user-manager';
import { useStorefrontUi } from '../../layout/storefront-ui-context';

export function LogoutPage() {
  const { persistJwt } = useStorefrontUi();
  const navigate = useNavigate();

  useEffect(() => {
    persistJwt('');
    const mgr = getUserManager();
    if (mgr && isOidcConfigured()) {
      void mgr.signoutRedirect().catch(() => void navigate('/'));
      return;
    }
    void navigate('/');
  }, [navigate, persistJwt]);

  return (
    <div className="auth-page">
      <p>Signing out…</p>
    </div>
  );
}
