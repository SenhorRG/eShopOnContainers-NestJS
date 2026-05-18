import { Injectable } from '@nestjs/common';
import type { Prisma } from '@ordering/prisma-client';
import { Order, type OrderItem, type PersistedOrderingOrderRow } from '@eshop/ordering-domain';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class OrderingPersistenceFacade {
  constructor(private readonly prisma: PrismaService) {}

  async loadOrderAggregate(prismaTx: Prisma.TransactionClient, orderId: number): Promise<Order | null> {
    const row = await prismaTx.orderingOrder.findUnique({
      where: { Id: orderId },
      include: { orderItems: true },
    });
    if (!row) return null;

    return Order.hydrate(this.toHydrateShape(row));
  }

  /** Used by CQRS handlers after querying with the pooled Prisma client (read-only snapshots). */
  async loadOrderAggregateDefault(orderId: number): Promise<Order | null> {
    return this.loadOrderAggregate(this.prisma, orderId);
  }

  async insertSubmittedOrder(prismaTx: Prisma.TransactionClient, order: Order): Promise<number> {
    const created = await prismaTx.orderingOrder.create({
      data: {
        BuyerId: null,
        PaymentMethodId: null,
        OrderDate: order.orderDate,
        OrderStatus: order.orderStatus,
        Description: order.description || null,
        Street: order.address.street,
        City: order.address.city,
        State: order.address.state,
        Country: order.address.country,
        ZipCode: order.address.zipCode,
        orderItems: {
          createMany: {
            data: order.orderItems.map((oi: OrderItem) => ({
              Discount: oi.discount,
              PictureUrl: oi.pictureUrl || null,
              ProductName: oi.productName,
              UnitPrice: oi.unitPrice,
              Units: oi.units,
              ProductId: oi.productId,
            })),
          },
        },
      },
      select: { Id: true },
    });

    return created.Id;
  }

  /** Replace line items in one update (simpler than per-line merge). */
  async persistOrderAggregate(tx: Prisma.TransactionClient, aggregate: Order): Promise<void> {
    const oid = aggregate.id;
    if (oid == null) throw new Error('persistOrderAggregate requires persisted order id');

    await tx.orderingOrder.update({
      where: { Id: oid },
      data: {
        OrderStatus: aggregate.orderStatus,
        Description: aggregate.description ?? null,
        BuyerId: aggregate.buyerId ?? null,
        PaymentMethodId: aggregate.paymentId ?? null,
      },
    });

    await tx.orderingOrderItem.deleteMany({ where: { OrderId: oid } });

    await tx.orderingOrderItem.createMany({
      data: aggregate.orderItems.map((oi: OrderItem) => ({
        OrderId: oid,
        Discount: oi.discount,
        PictureUrl: oi.pictureUrl || null,
        ProductName: oi.productName,
        UnitPrice: oi.unitPrice,
        Units: oi.units,
        ProductId: oi.productId,
      })),
    });
  }

  private toHydrateShape(row: {
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
      UnitPrice: unknown;
      Discount: unknown;
      Units: number;
    }>;
  }): PersistedOrderingOrderRow {
    return {
      Id: row.Id,
      BuyerId: row.BuyerId,
      PaymentMethodId: row.PaymentMethodId,
      OrderDate: row.OrderDate,
      OrderStatus: row.OrderStatus,
      Description: row.Description ?? null,
      Street: row.Street ?? '',
      City: row.City ?? '',
      State: row.State ?? '',
      Country: row.Country ?? '',
      ZipCode: row.ZipCode ?? '',
      orderItems: row.orderItems.map((it) => ({
        Id: it.Id,
        ProductId: Number(it.ProductId),
        ProductName: String(it.ProductName),
        PictureUrl: it.PictureUrl == null ? null : String(it.PictureUrl),
        UnitPrice: Number(it.UnitPrice),
        Discount: Number(it.Discount),
        Units: Number(it.Units),
      })),
    };
  }

}
