import { useCallback, useEffect, useState } from 'react';

export function ErrorUiBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onError = () => setVisible(true);
    const onRejection = () => setVisible(true);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <div id="blazor-error-ui" className={visible ? 'eshop-error-ui--visible' : undefined}>
      An unhandled error has occurred.
      <a href="" className="reload" onClick={(e) => { e.preventDefault(); reload(); }}>
        Reload
      </a>
      <a className="dismiss" onClick={(e) => { e.preventDefault(); dismiss(); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismiss(); } }}>
        🗙
      </a>
    </div>
  );
}
