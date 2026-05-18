import { useCallback, useEffect, useRef, useState } from 'react';

export type ObservabilityLoadOptions = {
  signal?: AbortSignal;
};

export function useObservabilityFilterPanel(
  load: (options: ObservabilityLoadOptions) => Promise<void>,
  watchDeps: readonly unknown[],
) {
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;
  const manualAbortRef = useRef<AbortController | null>(null);
  const requestGenRef = useRef(0);

  const execute = useCallback(async () => {
    const generation = ++requestGenRef.current;
    manualAbortRef.current?.abort();
    const controller = new AbortController();
    manualAbortRef.current = controller;
    setLoading(true);

    try {
      await loadRef.current({ signal: controller.signal });
      if (generation === requestGenRef.current) {
        setLastRefreshedAt(new Date());
      }
    } catch (cause) {
      if ((cause as Error).name === 'AbortError') {
        return;
      }
      throw cause;
    } finally {
      if (generation === requestGenRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const executeRef = useRef(execute);
  executeRef.current = execute;

  useEffect(() => {
    void executeRef.current();
  }, watchDeps);

  const refreshNow = useCallback(() => {
    void execute();
  }, [execute]);

  return {
    loading,
    lastRefreshedAt,
    refreshNow,
  };
}
