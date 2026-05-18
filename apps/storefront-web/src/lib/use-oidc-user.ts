import { useEffect, useState } from 'react';
import type { User } from 'oidc-client-ts';

import { getUserManager, isOidcConfigured } from './oidc-user-manager';

export function useOidcUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isOidcConfigured()) {
      setUser(null);
      return undefined;
    }
    const mgr = getUserManager();
    if (!mgr) return undefined;
    const refresh = () => void mgr.getUser().then(setUser);
    refresh();
    const onLoad = () => refresh();
    const onUnload = () => refresh();
    mgr.events.addUserLoaded(onLoad);
    mgr.events.addUserUnloaded(onUnload);
    return () => {
      mgr.events.removeUserLoaded(onLoad);
      mgr.events.removeUserUnloaded(onUnload);
    };
  }, []);

  return user;
}
