export type AmqpConnectionConfig = {
    hostname: string;
    port: number;
    username: string;
    password: string;
    vhost?: string;
    heartbeatIntervalInSeconds?: number;
};
export type EventBusOptions = {
    subscriptionClientName: string;
    retryCount: number;
    connection: AmqpConnectionConfig;
    prefetch?: number;
};
export declare const defaultEventBusOptions: (partial: Partial<EventBusOptions> & Pick<EventBusOptions, "subscriptionClientName">) => EventBusOptions;
