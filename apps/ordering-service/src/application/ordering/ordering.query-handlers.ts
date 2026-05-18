import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';

import {
  GetCardTypesQuery,
  GetOrderByIdQuery,
  GetOrdersForUserQuery,
  type CardTypeVm,
  type HttpOrderVm,
  type OrderSummaryVm,
} from './ordering.cqrs';

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdHandler implements IQueryHandler<GetOrderByIdQuery, HttpOrderVm> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(q: GetOrderByIdQuery): Promise<HttpOrderVm> {
    const row = await this.prisma.orderingOrder.findUnique({
      where: { Id: q.orderId },
      include: { orderItems: true },
    });
    if (!row) {
      throw new NotFoundException();
    }

    const total = row.orderItems.reduce((acc, li) => acc + Number(li.UnitPrice) * Number(li.Units), 0);

    return {
      orderNumber: row.Id,
      date: row.OrderDate.toISOString(),
      status: row.OrderStatus,
      description: row.Description ?? '',
      street: row.Street,
      city: row.City,
      state: row.State,
      zipcode: row.ZipCode,
      country: row.Country,
      orderItems: row.orderItems.map((li) => ({
        productName: li.ProductName,
        units: li.Units,
        unitPrice: Number(li.UnitPrice),
        pictureUrl: li.PictureUrl,
      })),
      total,
    };
  }
}

@QueryHandler(GetOrdersForUserQuery)
export class GetOrdersForUserHandler implements IQueryHandler<GetOrdersForUserQuery, OrderSummaryVm[]> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(q: GetOrdersForUserQuery): Promise<OrderSummaryVm[]> {
    const rows = await this.prisma.orderingOrder.findMany({
      where: {
        buyer: { IdentityGuid: q.userId },
      },
      include: { orderItems: true },
      orderBy: { OrderDate: 'desc' },
    });

    return rows.map((row) => ({
      orderNumber: row.Id,
      date: row.OrderDate.toISOString(),
      status: row.OrderStatus,
      total: row.orderItems.reduce((acc, li) => acc + Number(li.UnitPrice) * Number(li.Units), 0),
    }));
  }
}

@QueryHandler(GetCardTypesQuery)
export class GetCardTypesHandler implements IQueryHandler<GetCardTypesQuery, CardTypeVm[]> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<CardTypeVm[]> {
    const rows = await this.prisma.orderingCardType.findMany({ orderBy: { Id: 'asc' } });
    return rows.map((c) => ({ id: c.Id, name: c.Name }));
  }
}
