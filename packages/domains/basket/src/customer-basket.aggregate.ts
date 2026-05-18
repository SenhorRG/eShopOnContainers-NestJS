import { BasketDomainException } from './basket-domain.exception';
import { BasketItem, type BasketItemProps } from './basket-item.vo';

export class CustomerBasket {
  readonly buyerId: string;

  private readonly items: BasketItem[] = [];

  private constructor(buyerId: string) {
    this.buyerId = buyerId;
  }

  static create(buyerId: string): CustomerBasket {
    const id = buyerId.trim();
    if (!id) {
      throw new BasketDomainException('Buyer id is required.');
    }
    return new CustomerBasket(id);
  }

  static fromItems(buyerId: string, itemProps: BasketItemProps[]): CustomerBasket {
    const basket = CustomerBasket.create(buyerId);
    for (const props of itemProps) {
      basket.addItem(props);
    }
    return basket;
  }

  get lineItems(): ReadonlyArray<BasketItem> {
    return this.items;
  }

  addItem(props: BasketItemProps): void {
    const existing = this.items.find((i) => i.productId === props.productId);
    if (existing) {
      throw new BasketDomainException(`Product ${props.productId} is already in the basket.`);
    }
    this.items.push(BasketItem.create(props));
  }

  removeItem(productId: number): void {
    const index = this.items.findIndex((i) => i.productId === productId);
    if (index < 0) {
      throw new BasketDomainException(`Product ${productId} is not in the basket.`);
    }
    this.items.splice(index, 1);
  }

  total(): number {
    return this.items.reduce((sum, item) => sum + item.lineTotal(), 0);
  }
}
