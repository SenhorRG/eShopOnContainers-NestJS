import { IntegrationEvent, type IntegrationJson } from '@eshop/event-bus-amqp';

export class ProductPriceChangedIntegrationEvent extends IntegrationEvent {
  ProductId!: number;

  NewPrice!: number;

  OldPrice!: number;

  constructor(
    productId?: number,
    newPrice?: number,
    oldPrice?: number,
    id?: string,
    creationDate?: string,
  ) {
    super(id, creationDate);
    if (productId !== undefined) this.ProductId = productId;
    if (newPrice !== undefined) this.NewPrice = newPrice;
    if (oldPrice !== undefined) this.OldPrice = oldPrice;
  }

  static revive(json: IntegrationJson): ProductPriceChangedIntegrationEvent {
    const j = json as Record<string, unknown>;
    return new ProductPriceChangedIntegrationEvent(
      Number(j.ProductId),
      Number(j.NewPrice),
      Number(j.OldPrice),
      typeof j.Id === 'string' ? j.Id : undefined,
      typeof j.CreationDate === 'string'
        ? j.CreationDate
        : typeof j.creationDate === 'string'
          ? j.creationDate
          : undefined,
    );
  }
}
