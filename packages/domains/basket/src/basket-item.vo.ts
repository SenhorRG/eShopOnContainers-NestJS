export type BasketItemProps = {
  productId: number;
  quantity: number;
  unitPrice?: number;
};

export class BasketItem {
  readonly productId: number;

  readonly quantity: number;

  readonly unitPrice?: number;

  private constructor(props: BasketItemProps) {
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
  }

  static create(props: BasketItemProps): BasketItem {
    if (!Number.isInteger(props.productId) || props.productId <= 0) {
      throw new Error('Product id must be a positive integer.');
    }
    if (!Number.isInteger(props.quantity) || props.quantity <= 0) {
      throw new Error('Quantity must be a positive integer.');
    }
    return new BasketItem(props);
  }

  lineTotal(): number {
    if (this.unitPrice == null) {
      return 0;
    }
    return this.unitPrice * this.quantity;
  }
}
