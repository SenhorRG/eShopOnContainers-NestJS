import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { readWebhookJwt } from '../lib/jwt-session';
import { listWebhookSubscriptions, type WebhookSubscriptionRow } from '../lib/webhooks-api';

function receiverOrigin(): string {
  const raw = import.meta.env.VITE_WEBHOOK_RECEIVER_ORIGIN;
  const v = typeof raw === 'string' && raw.trim().length ? raw.trim() : 'http://127.0.0.1:8788';
  return v.replace(/\/$/, '');
}

type LastPayload = { receivedAt?: string | null; body?: unknown };

export function HomePage() {
  const jwt = readWebhookJwt();
  const authed = jwt.trim().length > 0;

  const [rows, setRows] = useState<WebhookSubscriptionRow[] | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [last, setLast] = useState<LastPayload | null>(null);

  const pollUrl = useMemo(() => `${receiverOrigin()}/api/last`, []);

  const refreshHooks = useCallback(() => {
    if (!authed) {
      setRows(null);
      return;
    }
    void listWebhookSubscriptions(jwt)
      .then((r) => {
        setRows(r);
        setListErr(null);
      })
      .catch((e: unknown) => {
        setListErr(String((e as Error).message ?? e));
        setRows([]);
      });
  }, [authed, jwt]);

  useEffect(() => {
    refreshHooks();
  }, [refreshHooks]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(pollUrl);
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as LastPayload;
        if (!cancelled) setLast(body);
      } catch {
        /* receiver offline */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollUrl]);

  useEffect(() => {
    document.title = 'Order management';
  }, []);

  return (
    <>
      <h2>Registered webhooks</h2>
      {authed ? (
        <>
          {rows === null ? (
            <div className="grid-placeholder">Loading...</div>
          ) : listErr ? (
            <p className="error-message">{listErr}</p>
          ) : rows.length > 0 ? (
            <table className="quickgrid">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Destination</th>
                  <th>Token</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.date).toLocaleString()}</td>
                    <td>{r.destUrl}</td>
                    <td>{r.token ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid-placeholder">None registered</div>
          )}
          <p>
            <Link className="action" to="/add-webhook">
              Add webhook registration
            </Link>
          </p>
        </>
      ) : (
        <div className="grid-placeholder">Log in to view or edit webhook registrations</div>
      )}

      <h2>Webhook messages received (orders paid)</h2>
      {last?.body != null ? (
        <table className="quickgrid">
          <thead>
            <tr>
              <th>When</th>
              <th>Data</th>
              <th>Token</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{last.receivedAt ?? '—'}</td>
              <td>
                <code>{JSON.stringify(last.body)}</code>
              </td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <>
          <div className="grid-placeholder">
            <div>None yet received</div>
          </div>
          <p>
            Webhook messages will appear once a webhook is registered and an order transitions into &quot;paid&quot;
            status.
          </p>
        </>
      )}
    </>
  );
}
