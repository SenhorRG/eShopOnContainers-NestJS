import { afterEach, describe, expect, it } from 'vitest';

import { isOtelSdkDisabled } from './is-otel-sdk-disabled';

describe('isOtelSdkDisabled', () => {
  const previous = {
    sdk: process.env.OTEL_SDK_DISABLED,
    legacy: process.env.OTEL_DISABLED,
  };

  afterEach(() => {
    if (previous.sdk === undefined) delete process.env.OTEL_SDK_DISABLED;
    else process.env.OTEL_SDK_DISABLED = previous.sdk;
    if (previous.legacy === undefined) delete process.env.OTEL_DISABLED;
    else process.env.OTEL_DISABLED = previous.legacy;
  });

  it('returns false when flags are unset', () => {
    delete process.env.OTEL_SDK_DISABLED;
    delete process.env.OTEL_DISABLED;
    expect(isOtelSdkDisabled()).toBe(false);
  });

  it('returns true when OTEL_SDK_DISABLED is true', () => {
    process.env.OTEL_SDK_DISABLED = 'true';
    expect(isOtelSdkDisabled()).toBe(true);
  });

  it('returns true when OTEL_DISABLED is true', () => {
    process.env.OTEL_DISABLED = 'true';
    expect(isOtelSdkDisabled()).toBe(true);
  });
});
