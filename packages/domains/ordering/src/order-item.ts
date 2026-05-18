import { OrderingDomainException } from './ordering-domain.exception';

/** Child entity persisted by the Order aggregate boundary. */
export class OrderItem {
  id?: number;

  readonly productId: number;

  productName: string;

  pictureUrl: string;

  unitPrice: number;

  discount: number;

  units: number;

  constructor(productId: number, productName: string, unitPrice: number, discount: number, pictureUrl: string, units = 1) {
    if (units <= 0) throw new OrderingDomainException('Invalid number of units');

    const total = Number(unitPrice) * units;
    if (total < discount) {
      throw new OrderingDomainException('The total of order item is lower than applied discount');
    }

    this.productId = productId;
    this.productName = productName;
    this.unitPrice = Number(unitPrice);
    this.discount = Number(discount);
    this.pictureUrl = pictureUrl;
    this.units = units;
  }

  setNewDiscount(discount: number): void {
    if (discount < 0) throw new OrderingDomainException('Discount is not valid');

    this.discount = Number(discount);
  }

  addUnits(units: number): void {
    if (units < 0) throw new OrderingDomainException('Invalid units');

    this.units += units;
  }
}
