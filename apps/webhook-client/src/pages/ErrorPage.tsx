import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function ErrorPage() {
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Error';
    setRequestId(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : null);
  }, []);

  return (
    <>
      <h1 className="text-danger">Error.</h1>
      <h2 className="text-danger">An error occurred while processing your request.</h2>
      {requestId ? (
        <p>
          <strong>Request ID:</strong> <code>{requestId}</code>
        </p>
      ) : null}
      <h3>Development Mode</h3>
      <p>
        Swapping to <strong>Development</strong> environment will display more detailed information about the error
        that occurred.
      </p>
      <p>
        <strong>The Development environment shouldn&apos;t be enabled for deployed applications.</strong> It can
        result in displaying sensitive information from exceptions to end users. For local debugging, enable the{' '}
        <strong>Development</strong> environment by setting the <strong>NODE_ENV</strong> environment variable to{' '}
        <strong>development</strong> and restarting the app.
      </p>
      <p>
        <Link to="/" className="action">
          Home
        </Link>
      </p>
    </>
  );
}
