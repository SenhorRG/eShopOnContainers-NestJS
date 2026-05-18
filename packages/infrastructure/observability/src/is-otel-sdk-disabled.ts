export function isOtelSdkDisabled(): boolean {
  const disabled = String(process.env.OTEL_SDK_DISABLED ?? '').toLowerCase();
  const legacy = String(process.env.OTEL_DISABLED ?? '').toLowerCase();
  return disabled === 'true' || disabled === '1' || legacy === 'true' || legacy === '1';
}
