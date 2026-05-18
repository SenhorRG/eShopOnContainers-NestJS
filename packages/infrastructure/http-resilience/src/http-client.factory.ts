import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import {
  ConsecutiveBreaker,
  ExponentialBackoff,
  TimeoutStrategy,
  type IDefaultPolicyContext,
  type IPolicy,
  circuitBreaker,
  handleAll,
  handleWhen,
  retry,
  timeout,
  wrap,
} from 'cockatiel';

import { namedHttpPolicyPresets, type NamedHttpPolicyName } from './named-policies';

/** Cockatiel v3 predicates only receive real `Error` instances — axios errors comply. */
const retryableFailures = handleWhen((error: Error) => {
  if (!axios.isAxiosError(error)) return true;
  const status = error.response?.status;
  if (!status) return true;
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
});

export function describeNamedHttpPreset(name: NamedHttpPolicyName) {
  return namedHttpPolicyPresets[name];
}

export interface ResilientAxiosPolicy {
  combined: IPolicy<IDefaultPolicyContext>;
  axios: AxiosInstance;
}

/** Retry (exponential) → breaker (consecutive faults) → aggressive timeout wrapper. */
export function createResilientAxios(
  name: NamedHttpPolicyName,
  axiosBaseConfig?: AxiosRequestConfig,
): ResilientAxiosPolicy {
  const preset = namedHttpPolicyPresets[name];

  const retryPol = retry(retryableFailures, {
    maxAttempts: preset.maxAttempts,
    backoff: new ExponentialBackoff({
      initialDelay: preset.baseBackoffMs,
      maxDelay: 60_000,
      exponent: 2,
    }),
  });

  const breaker = circuitBreaker(handleAll, {
    halfOpenAfter: preset.halfOpenAfterMs,
    breaker: new ConsecutiveBreaker(preset.breakerOpenAfterConsecutiveFailures),
  });

  const timePol = timeout(preset.timeoutMs, TimeoutStrategy.Aggressive);

  const combined = wrap(retryPol, breaker, timePol);

  const instance = axios.create({
    timeout: preset.timeoutMs,
    validateStatus: (s) => s >= 200 && s < 300,
    ...axiosBaseConfig,
  });

  return { combined, axios: instance };
}

export async function axiosWithPolicy<T = unknown>(
  client: ResilientAxiosPolicy,
  config: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  return client.combined.execute(() => client.axios.request<T>({ ...config }));
}
