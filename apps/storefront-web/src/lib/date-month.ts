/** Convert `YYYY-MM` (month input) to end-of-month UTC instant for Ordering DTO. */

export function endOfMonthFromYearMonth(ym: string): Date {
  const [yRaw, mRaw] = ym.split('-');
  const y = Number(yRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return new Date();
  }
  return new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
}
