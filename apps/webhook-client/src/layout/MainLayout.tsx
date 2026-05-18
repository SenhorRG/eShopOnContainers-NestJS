import { Link, Outlet } from 'react-router-dom';

import { UserMenu } from './UserMenu';

export function MainLayout() {
  return (
    <>
      <header>
        <h1>
          <Link to="/">Order management</Link>
        </h1>
        <div className="user-info">
          <UserMenu />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <div id="blazor-error-ui">
        An unhandled error has occurred.
        <Link to="/" replace className="reload">
          Reload
        </Link>
        <span className="dismiss" role="button" tabIndex={0} aria-label="Dismiss">
          🗙
        </span>
      </div>
    </>
  );
}
