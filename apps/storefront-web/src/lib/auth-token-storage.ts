const JWT_SESSION_KEY = 'eshop_storefront_jwt';
const JWT_PERSISTENT_KEY = 'eshop_storefront_jwt_persistent';
const REMEMBER_LOGIN_KEY = 'eshop_remember_login';

export function loadRememberLogin(): boolean {
  try {
    return localStorage.getItem(REMEMBER_LOGIN_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveRememberLogin(remember: boolean): void {
  try {
    if (remember) {
      localStorage.setItem(REMEMBER_LOGIN_KEY, '1');
    } else {
      localStorage.removeItem(REMEMBER_LOGIN_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function loadStoredJwt(): string {
  try {
    const persistent = localStorage.getItem(JWT_PERSISTENT_KEY);
    if (persistent?.trim().length) {
      return persistent;
    }

    const session = sessionStorage.getItem(JWT_SESSION_KEY);
    return session?.trim().length ? session : '';
  } catch {
    return '';
  }
}

export function saveJwt(value: string, remember: boolean): void {
  const token = value.trim();

  try {
    if (!token.length) {
      sessionStorage.removeItem(JWT_SESSION_KEY);
      localStorage.removeItem(JWT_PERSISTENT_KEY);
      localStorage.removeItem(REMEMBER_LOGIN_KEY);
      return;
    }

    saveRememberLogin(remember);

    if (remember) {
      localStorage.setItem(JWT_PERSISTENT_KEY, token);
      sessionStorage.removeItem(JWT_SESSION_KEY);
      return;
    }

    sessionStorage.setItem(JWT_SESSION_KEY, token);
    localStorage.removeItem(JWT_PERSISTENT_KEY);
  } catch {
    /* ignore */
  }
}
