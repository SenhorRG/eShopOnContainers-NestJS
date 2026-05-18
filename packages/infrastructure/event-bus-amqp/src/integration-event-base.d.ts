export declare abstract class IntegrationEvent {
    Id: string;
    CreationDate: string;
    protected constructor(id?: string, creationDate?: string);
    get routingKey(): string;
    toJSON(): Record<string, unknown>;
}
