/**
 * Optional delay before command handlers proceed (simulated slow path).
 * Recommended local value: `ESHOP_ORDERING_COMMAND_DELAY_MS=0`.
 * Default 10000 ms matches the sample’s artificial pause; set `0` or empty to skip.
 */
export async function orderingCommandDelay(): Promise<void> {
  const raw = process.env.ESHOP_ORDERING_COMMAND_DELAY_MS;
  const ms = raw !== undefined && raw.trim() !== '' ? Number(raw) : 10000;
  if (!Number.isFinite(ms) || ms <= 0) return;

  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
