import { useNavigate } from 'react-router-dom';

import { clearWebhookJwt, readWebhookJwt } from '../lib/jwt-session';

export function UserMenu() {
  const navigate = useNavigate();
  const jwt = readWebhookJwt();

  if (jwt.length > 0) {
    return (
      <>
        <strong>Authenticated</strong>
        <button
          type="button"
          className="action"
          onClick={() => {
            clearWebhookJwt();
            void navigate('/', { replace: true });
          }}
        >
          Log out
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      className="action"
      onClick={() => {
        void navigate(`/login?returnUrl=${encodeURIComponent('/')}`);
      }}
    >
      Log in
    </button>
  );
}
