import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, Button, Input, Label } from '@eshop/ui';

import { readWebhookJwt } from '../lib/jwt-session';
import { createWebhookSubscription } from '../lib/webhooks-api';

function receiverOrigin(): string {
  const raw = import.meta.env.VITE_WEBHOOK_RECEIVER_ORIGIN;
  const v = typeof raw === 'string' && raw.trim().length ? raw.trim() : 'http://127.0.0.1:8788';
  return v.replace(/\/$/, '');
}

export function AddWebhookPage() {
  const navigate = useNavigate();
  const jwt = readWebhookJwt();
  const base = useMemo(() => `${receiverOrigin()}/`, []);

  const defaultToken =
    (typeof import.meta.env.VITE_WEBHOOK_DEFAULT_TOKEN === 'string' && import.meta.env.VITE_WEBHOOK_DEFAULT_TOKEN) ||
    '';

  const [token, setToken] = useState(defaultToken);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Add webhook';
  }, []);

  const register = async () => {
    if (!token.trim()) return;
    setMessage(null);
    try {
      await createWebhookSubscription({
        accessToken: jwt.trim().length ? jwt : null,
        url: `${base}webhook-received`,
        grantUrl: `${base}check`,
        token: token.trim(),
        event: 'OrderPaid',
      });
      void navigate('/', { replace: true });
    } catch (e) {
      setMessage(String((e as Error).message ?? e));
    }
  };

  return (
    <>
      <h2>Register a new webhook</h2>
      <p>
        This page registers the &quot;OrderPaid&quot; Webhook by sending a POST to the WebHooks API. Once the Webhook
        is set, you will be able to see new paid orders from the{' '}
        <Link to="/">home</Link> page.
      </p>
      <p>
        Destination and grant URLs default to <code>{base}</code> (same host as <code>VITE_WEBHOOK_RECEIVER_ORIGIN</code>
        ) so <code>pnpm demo:webhook-receiver</code> can satisfy the grant probe.
      </p>
      <div className="webhook-ui-panel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void register();
          }}
        >
          <div className="ui-field">
            <Label htmlFor="webhook-token">Token</Label>
            <Input
              id="webhook-token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token"
            />
          </div>
          {message ? (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit">Register</Button>
        </form>
      </div>
    </>
  );
}
