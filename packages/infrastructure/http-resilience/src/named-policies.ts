/** Presets for outbound integrations (webhooks, OpenAI embeddings, etc.). */
export const namedHttpPolicyPresets = {
  /** Short-lived HTTP deliveries (webhooks, grant URL probes). */
  webhookOutbound: {
    timeoutMs: 15_000,
    maxAttempts: 4,
    halfOpenAfterMs: 30_000,
    breakerOpenAfterConsecutiveFailures: 5,
    baseBackoffMs: 200,
  },
  /** Long-running LLM / embedding round-trips. */
  openAi: {
    timeoutMs: 120_000,
    maxAttempts: 3,
    halfOpenAfterMs: 60_000,
    breakerOpenAfterConsecutiveFailures: 3,
    baseBackoffMs: 500,
  },
  /** Mobile BFF reverse-proxy and outbound aggregation to catalog/ordering/identity. */
  bffUpstream: {
    timeoutMs: 120_000,
    maxAttempts: 2,
    halfOpenAfterMs: 30_000,
    breakerOpenAfterConsecutiveFailures: 5,
    baseBackoffMs: 300,
  },
} as const;

export type NamedHttpPolicyName = keyof typeof namedHttpPolicyPresets;
