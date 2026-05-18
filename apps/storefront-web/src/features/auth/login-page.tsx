import { Alert, AlertDescription } from '@eshop/ui';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { DEV_DEFAULT_USERS_LOGIN_HINT } from '../../lib/dev-default-users-hint';
import { loginWithPassword } from '../../lib/identity-api';
import { loadRememberLogin } from '../../lib/auth-token-storage';
import { isOidcConfigured } from '../../lib/oidc-user-manager';
import { useIsAuthenticated } from '../../lib/use-access-token';
import { useStorefrontUi } from '../../layout/storefront-ui-context';

export function LoginPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { persistJwt } = useStorefrontUi();
  const isAuthenticated = useIsAuthenticated();
  const returnUrl = sp.get('returnUrl') && sp.get('returnUrl')!.startsWith('/') ? sp.get('returnUrl')! : '/';

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => loadRememberLogin());

  useEffect(() => {
    if (isAuthenticated) {
      void navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, returnUrl]);

  useEffect(() => {
    if (!isOidcConfigured()) return;
    void navigate(`/user/login/oidc?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
  }, [navigate, returnUrl]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const token = await loginWithPassword(userName.trim(), password);
      persistJwt(token.access_token, rememberMe);
      void navigate(returnUrl, { replace: true });
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Sign in</h1>
      {import.meta.env.DEV ? <p className="auth-hint">{DEV_DEFAULT_USERS_LOGIN_HINT}</p> : null}
      <form className="form" onSubmit={(e) => void submit(e)}>
        <div className="form-section">
          <label>
            User name
            <input
              type="text"
              autoComplete="username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label className="auth-remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          {error ? (
            <Alert variant="destructive" className="auth-alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
      <p className="auth-footer-link">
        No account? <Link to={`/user/register?returnUrl=${encodeURIComponent(returnUrl)}`}>Create one</Link>
      </p>
    </div>
  );
}
