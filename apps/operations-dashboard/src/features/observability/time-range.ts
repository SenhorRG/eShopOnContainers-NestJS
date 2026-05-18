export type TimeRangePreset = '15m' | '1h' | '6h' | '24h';

const PRESET_MS: Record<TimeRangePreset, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

export function resolveTimeWindow(preset: TimeRangePreset, endMs = Date.now()): { startMs: number; endMs: number } {
  return { startMs: endMs - PRESET_MS[preset], endMs };
}

export function toLokiNanoseconds(epochMs: number): string {
  return (BigInt(Math.trunc(epochMs)) * 1_000_000n).toString();
}

export function toPrometheusSeconds(epochMs: number): string {
  return (epochMs / 1000).toFixed(3);
}

export function jaegerLookbackFromPreset(preset: TimeRangePreset): string {
  return preset;
}

export function lookbackHoursFromPreset(preset: TimeRangePreset): number {
  if (preset === '15m') {
    return 0.25;
  }
  if (preset === '6h') {
    return 6;
  }
  if (preset === '24h') {
    return 24;
  }
  return 1;
}
