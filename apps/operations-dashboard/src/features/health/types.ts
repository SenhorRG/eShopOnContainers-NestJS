export type HealthStatus = 'ok' | 'fail' | 'pending';

export type HealthProbeResult = {
  id: string;
  status: HealthStatus;
  rttMs: number | null;
};
