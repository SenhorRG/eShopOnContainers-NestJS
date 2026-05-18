import { useEffect } from 'react';

import type { LogRow } from './logs-types';

type LogDetailModalProps = {
  row: LogRow | null;
  onClose: () => void;
};

function formatModalBody(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function LogDetailModal({ row, onClose }: LogDetailModalProps) {
  useEffect(() => {
    if (!row) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, row]);

  if (!row) {
    return null;
  }

  const body = formatModalBody(row.raw);

  return (
    <div className="ops-modal" role="presentation" onClick={onClose}>
      <div
        className="ops-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ops-log-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ops-modal__header">
          <div>
            <h2 id="ops-log-modal-title">Log details</h2>
            <p className="ops-muted">
              {row.timestamp} · {row.service} ·{' '}
              <span className={`ops-log-level ops-log-level--${row.level}`}>{row.level}</span>
            </p>
          </div>
          <button type="button" className="ops-button ops-button--ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <section className="ops-modal__section">
          <h3>Message</h3>
          <pre className="ops-modal__pre">{row.body}</pre>
        </section>
        <section className="ops-modal__section">
          <h3>Context</h3>
          <pre className="ops-modal__pre">{row.context}</pre>
        </section>
        <section className="ops-modal__section">
          <h3>Route</h3>
          <pre className="ops-modal__pre">{row.route}</pre>
        </section>
        <section className="ops-modal__section">
          <h3>Raw payload</h3>
          <pre className="ops-modal__pre ops-modal__pre--raw">{body}</pre>
        </section>
      </div>
    </div>
  );
}
