export function buildJaegerSearchUrl(baseUrl: string, serviceName: string, lookbackHours = 1): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  const lookbackMs = lookbackHours * 60 * 60 * 1000;
  const params = new URLSearchParams({
    service: serviceName,
    lookback: String(lookbackMs),
  });
  return `${trimmed}/search?${params.toString()}`;
}
