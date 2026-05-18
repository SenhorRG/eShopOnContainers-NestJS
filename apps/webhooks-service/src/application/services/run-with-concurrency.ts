/** Bounded parallel execution (worker pool). */

export async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const n = items.length;
  if (n === 0) return;

  const workers = Math.max(1, Math.min(concurrency, n));
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= n) return;
      await fn(items[index] as T, index);
    }
  };

  await Promise.all(Array.from({ length: workers }, () => worker()));
}
