const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function isTransientPublishError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = String((error as Error).name ?? '');
  const message = String((error as Error).message ?? '').toLowerCase();

  const transientTokens = ['econnreset', 'etimedout', 'broker', 'socket', 'connection', 'unreachable'];

  return transientTokens.some((t) => message.includes(t) || name.toLowerCase().includes(t));
}

export async function withPublishRetry<T>(retryCount: number, fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retryCount || !isTransientPublishError(error)) {
        throw error;
      }
      const delaySeconds = Math.pow(2, attempt);
      await sleep(delaySeconds * 1000);
      attempt++;
    }
  }
}
