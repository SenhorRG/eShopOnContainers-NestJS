import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription, Button, Input, Label } from '@eshop/ui';

import { DEV_DEFAULT_USERS_LOGIN_HINT } from '../lib/dev-default-users-hint';
import { readDevLoginEmail } from '../lib/dev-login-env';
import { loginWithPassword } from '../lib/identity-api';
import { readWebhookJwt, writeWebhookJwt } from '../lib/jwt-session';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnUrl = searchParams.get('returnUrl') ?? '/';
  const safeReturn = returnUrl.startsWith('/') ? returnUrl : '/';

  const [email, setEmail] = useState(() => readDevLoginEmail());
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Log in';
    if (readWebhookJwt().trim().length > 0) {
      void navigate(safeReturn, { replace: true });
    }
  }, [navigate, safeReturn]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const token = await loginWithPassword(email.trim(), password);
      writeWebhookJwt(token.access_token);
      void navigate(safeReturn, { replace: true });
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2>Log in</h2>
      {import.meta.env.DEV ? <p className="login-hint">{DEV_DEFAULT_USERS_LOGIN_HINT}</p> : null}
      <div className="webhook-ui-panel">
        <form
          className="login-form"
          onSubmit={(e) => {
            void submit(e);
          }}
        >
          <div className="ui-field">
            <Label htmlFor="email">Email or alias</Label>
            <Input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="ui-field">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={busy} className="mt-2">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </>
  );
}
