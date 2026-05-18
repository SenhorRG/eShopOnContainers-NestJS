export declare function withPublishRetry<T>(retryCount: number, fn: () => Promise<T>): Promise<T>;
