import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  loadStoredJwt,
  saveJwt,
} from '../lib/auth-token-storage';
import { isJwtExpired } from '../lib/jwt-parse';

type StorefrontUiState = {
  jwt: string;
  /** False until sessionStorage/localStorage JWT has been read once. */
  authHydrated: boolean;
  persistJwt: (value: string, remember?: boolean) => void;
  headerTitle: string;
  headerSubtitle: string;
  setHeaderTitle: (v: string) => void;
  setHeaderSubtitle: (v: string) => void;
};

const StorefrontUiContext = createContext<StorefrontUiState | null>(null);

export function StorefrontUiProvider({ children }: { children: ReactNode }) {
  const [jwt, setJwt] = useState('');
  const [authHydrated, setAuthHydrated] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [headerSubtitle, setHeaderSubtitle] = useState('');

  useEffect(() => {
    const stored = loadStoredJwt();
    if (stored.length && isJwtExpired(stored)) {
      saveJwt('', false);
      setJwt('');
    } else {
      setJwt(stored);
    }
    setAuthHydrated(true);
  }, []);

  const persistJwt = useCallback((value: string, remember = false) => {
    setJwt(value);
    saveJwt(value, remember);
  }, []);

  const value = useMemo(
    () => ({
      jwt,
      authHydrated,
      persistJwt,
      headerTitle,
      headerSubtitle,
      setHeaderTitle,
      setHeaderSubtitle,
    }),
    [jwt, authHydrated, persistJwt, headerTitle, headerSubtitle],
  );

  return <StorefrontUiContext.Provider value={value}>{children}</StorefrontUiContext.Provider>;
}

export function useStorefrontUi(): StorefrontUiState {
  const ctx = useContext(StorefrontUiContext);
  if (!ctx) throw new Error('useStorefrontUi must be used within StorefrontUiProvider');
  return ctx;
}
