import { Address } from './address.vo';
import { Entity } from './entity';
import { OrderItem } from './order-item';
import { OrderStatus } from './order-status';
import { OrderingDomainException } from './ordering-domain.exception';

/** Row shape from Prisma (`ordering.orders` joined with items). Field names mirror DB columns. */
export type PersistedOrderingOrderRow = {
  Id: number;
  BuyerId: number | null;
  PaymentMethodId: number | null;
  OrderDate: Date;
  OrderStatus: string;
  Description: string | null;
  Street: string | null;
  City: string | null;
  State: string | null;
  Country: string | null;
  ZipCode: string | null;
  orderItems: Array<{
    Id: number;
    ProductId: number;
    ProductName: string;
    PictureUrl: string | null;
    UnitPrice: number;
    Discount: number;
    Units: number;
  }>;
};

export class Order extends Entity {
  private _id?: number;

  private _isDraft = false;

  orderDate: Date = new Date();

  address!: Address;

  buyerId?: number;

  paymentId?: number;

  orderStatus: OrderStatus = OrderStatus.Submitted;

  description = '';

  private readonly _orderItems: OrderItem[] = [];

  private constructor() {
    super();
  }

  get id(): number | undefined {
    return this._id;
  }

  setPersistedId(id: number): void {
    this._id = id;
  }

  get orderItems(): ReadonlyArray<OrderItem> {
    return this._orderItems;
  }

  static newDraft(): Order {
    const o = new Order();
    o._isDraft = true;
    o.orderStatus = OrderStatus.Submitted;
    return o;
  }

  /** Rebuild aggregate from DB row (ordering.orders + ordering.orderItems) for command handlers. */
  static hydrate(row: PersistedOrderingOrderRow): Order {
    const o = new Order();
    o._isDraft = false;
    o._id = row.Id;
    o.buyerId = row.BuyerId ?? undefined;
    o.paymentId = row.PaymentMethodId ?? undefined;
    o.orderStatus = row.OrderStatus as OrderStatus;
    o.description = row.Description ?? '';
    o.orderDate = row.OrderDate;
    o.address = new Address(
      row.Street ?? '',
      row.City ?? '',
      row.State ?? '',
      row.Country ?? '',
      row.ZipCode ?? '',
    );
    o._orderItems.length = 0;
    for (const it of row.orderItems) {
      const line = new OrderItem(
        it.ProductId,
        it.ProductName,
        it.UnitPrice,
        it.Discount,
        it.PictureUrl ?? '',
        it.Units,
      );
      line.id = it.Id;
      o._orderItems.push(line);
    }
    return o;
  }

  /**
   * Factory for a buyer-submitted order.
   * {@param persistedId} is set only after database insert (application assigns before domain dispatch).
   */
  static createSubmitted(params: {
    persistedId?: number;
    userId: string;
    userName: string;
    address: Address;
    cardTypeId: number;
    cardNumber: string;
    cardSecurityNumber: string;
    cardHolderName: string;
    cardExpiration: Date;
  }): Order {
    const o = new Order();
    o._isDraft = false;
    if (params.persistedId != null) o._id = params.persistedId;
    o.orderStatus = OrderStatus.Submitted;
    o.orderDate = new Date();
    o.address = params.address;

    o.addDomainEvent({
      type: 'OrderStartedDomainEvent',
      orderId: params.persistedId ?? -1,
      userId: params.userId,
      userName: params.userName,
      cardTypeId: params.cardTypeId,
      cardNumber: params.cardNumber,
      cardSecurityNumber: params.cardSecurityNumber,
      cardHolderName: params.cardHolderName,
      cardExpiration: params.cardExpiration,
    });
    return o;
  }

  /** Attach DB id post-insert and fix OrderStarted placeholder id. */
  attachPersistedIdentity(orderId: number): void {
    this._id = orderId;
    const queued = this.peekDomainEvents().filter((e) => e.type === 'OrderStartedDomainEvent');
    if (queued.length !== 1) return;
    const ev = queued[0];
    if (ev.type !== 'OrderStartedDomainEvent') return;
    (ev as { orderId: number }).orderId = orderId;
  }

  addOrderItem(productId: number, productName: string, unitPrice: number, discount: number, pictureUrl: string, units = 1): void {
    const existing = this._orderItems.find((o) => o.productId === productId);
    if (existing) {
      if (discount > existing.discount) existing.setNewDiscount(discount);
      existing.addUnits(units);
    } else {
      this._orderItems.push(new OrderItem(productId, productName, unitPrice, discount, pictureUrl, units));
    }
  }

  setPaymentMethodVerified(buyerId: number, paymentId: number): void {
    this.buyerId = buyerId;
    this.paymentId = paymentId;
  }

  setAwaitingValidationStatus(): void {
    if (this.orderStatus === OrderStatus.Submitted) {
      this.publishAwaitingValidation();
      this.orderStatus = OrderStatus.AwaitingValidation;
    }
  }

  setStockConfirmedStatus(): void {
    if (this.orderStatus === OrderStatus.AwaitingValidation) {
      const oid = this.requireId('SetStockConfirmed');
      this.addDomainEvent({ type: 'OrderStatusChangedToStockConfirmedDomainEvent', orderId: oid });
      this.orderStatus = OrderStatus.StockConfirmed;
      this.description = 'All the items were confirmed with available stock.';
    }
  }

  setPaidStatus(): void {
    if (this.orderStatus === OrderStatus.StockConfirmed) {
      const oid = this.requireId('SetPaid');
      const orderItems = this._orderItems.map((oi) => ({
        productId: oi.productId,
        units: oi.units,
      }));
      this.addDomainEvent({
        type: 'OrderStatusChangedToPaidDomainEvent',
        orderId: oid,
        orderItems,
      });
      this.orderStatus = OrderStatus.Paid;
      this.description = 'The payment was performed at a simulated "American Bank checking bank account ending on XX35071"';
    }
  }

  setShippedStatus(): void {
    if (this.orderStatus !== OrderStatus.Paid) {
      this.throwStatus(OrderStatus.Shipped);
    }
    const oid = this.requireId('SetShipped');
    this.orderStatus = OrderStatus.Shipped;
    this.description = 'The order was shipped.';
    this.addDomainEvent({
      type: 'OrderShippedDomainEvent',
      orderId: oid,
    });
  }

  setCancelledStatus(): void {
    if (this.orderStatus === OrderStatus.Paid || this.orderStatus === OrderStatus.Shipped) {
      this.throwStatus(OrderStatus.Cancelled);
    }

    const oid = this.requireId('SetCancelled');
    this.orderStatus = OrderStatus.Cancelled;
    this.description = 'The order was cancelled.';
    this.addDomainEvent({
      type: 'OrderCancelledDomainEvent',
      orderId: oid,
    });
  }

  setCancelledStatusWhenStockIsRejected(rejectedProductIds: Iterable<number>): void {
    if (this.orderStatus === OrderStatus.AwaitingValidation) {
      this.orderStatus = OrderStatus.Cancelled;
      const names = [...rejectedProductIds]
        .map((pid) => this._orderItems.find((oi) => oi.productId === pid)?.productName)
        .filter((n): n is string => Boolean(n));

      const desc = names.join(', ');
      this.description = `The product items don't have stock: (${desc}).`;
    }
  }

  getTotal(): number {
    return this._orderItems.reduce((acc, i) => acc + Number(i.units) * Number(i.unitPrice), 0);
  }

  private publishAwaitingValidation(): void {
    const oid = this.requireId('SetAwaitingValidation');
    const orderItems = this._orderItems.map((oi) => ({
      productId: oi.productId,
      units: oi.units,
      productName: oi.productName,
    }));
    this.addDomainEvent({
      type: 'OrderStatusChangedToAwaitingValidationDomainEvent',
      orderId: oid,
      orderItems,
    });
  }

  private requireId(where: string): number {
    if (this._id == null) {
      throw new OrderingDomainException(`Order id is unset before transition (${where})`);
    }

    return this._id;
  }

  private throwStatus(target: OrderStatus): never {
    throw new OrderingDomainException(`Is not possible to change the order status from ${this.orderStatus} to ${target}.`);
  }
}
