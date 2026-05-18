import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { registerAccount } from '../../lib/identity-api';
import { useIsAuthenticated } from '../../lib/use-access-token';
import { useStorefrontUi } from '../../layout/storefront-ui-context';

export function RegisterPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { persistJwt } = useStorefrontUi();
  const isAuthenticated = useIsAuthenticated();
  const returnUrl = sp.get('returnUrl') && sp.get('returnUrl')!.startsWith('/') ? sp.get('returnUrl')! : '/';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      void navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, returnUrl]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const token = await registerAccount({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });
      persistJwt(token.access_token);
      void navigate(returnUrl, { replace: true });
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Create account</h1>
      <p>Create an account to sign in to the store. Password must be at least 8 characters.</p>
      <form className="form" onSubmit={(e) => void submit(e)}>
        <div className="form-section">
          <label>
            Display name
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          {error ? <p className="validation-message">{error}</p> : null}
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>
      <p className="auth-footer-link">
        Already have an account? <Link to={`/user/login?returnUrl=${encodeURIComponent(returnUrl)}`}>Sign in</Link>
      </p>
    </div>
  );
}
