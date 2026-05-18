import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  InternalServerErrorException,
  Logger,
  Put,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { OrderingAuthGuard } from './auth/ordering-auth.guard';
import {
  CancelOrShipHttpDto,
  CreateOrderDraftHttpDto,
  CreateOrderHttpDto,
  mapCreateOrderHttpDto,
} from './ordering.dto';
import {
  CancelPlainOrderCommand,
  CreateOrderDraftCqrsCommand,
  GetCardTypesQuery,
  GetOrderByIdQuery,
  GetOrdersForUserQuery,
  IdentifiedCancelOrderCommand,
  IdentifiedCreateOrderCommand,
  IdentifiedShipOrderCommand,
} from '../../application/ordering/ordering.cqrs';

type AuthedReq = Request & { user?: { sub?: string; username?: string } };

@ApiTags('Ordering')
@ApiBearerAuth()
@UseGuards(OrderingAuthGuard)
@Controller('orders')
export class OrdersHttpController {
  private readonly log = new Logger(OrdersHttpController.name);

  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Version('1')
  @Put('cancel')
  @HttpCode(200)
  @ApiHeader({ name: 'x-requestid', required: true, description: 'Idempotency / correlation GUID' })
  async cancel(
    @Headers('x-requestid') requestHeader: unknown,
    @Body() body: CancelOrShipHttpDto,
  ): Promise<void> {
    const rid = normalizeRequestGuid(requestHeader);

    const ok = await this.commands.execute(new IdentifiedCancelOrderCommand(rid, body.orderNumber));

    if (!ok) {
      throw new InternalServerErrorException('Cancel order failed to process.');
    }
  }

  @Version('1')
  @Put('ship')
  @HttpCode(200)
  @ApiHeader({ name: 'x-requestid', required: true })
  async ship(
    @Headers('x-requestid') requestHeader: unknown,
    @Body() body: CancelOrShipHttpDto,
  ): Promise<void> {
    const rid = normalizeRequestGuid(requestHeader);

    const ok = await this.commands.execute(new IdentifiedShipOrderCommand(rid, body.orderNumber));
    if (!ok) {
      throw new InternalServerErrorException('Ship order failed to process.');
    }
  }

  @Version('1')
  @Get('cardtypes')
  async cardTypes() {
    return await this.queries.execute(new GetCardTypesQuery());
  }

  @Version('1')
  @Get()
  async list(@Req() req: AuthedReq) {
    const sub = req.user?.sub;
    if (!sub) {
      throw new BadRequestException('User identity unavailable');
    }

    return await this.queries.execute(new GetOrdersForUserQuery(sub));
  }

  @Version('1')
  @Get(':orderId')
  async getOne(@Param('orderId') orderId: string) {
    const idNum = Number(orderId);
    if (!Number.isFinite(idNum)) {
      throw new BadRequestException('Invalid order id');
    }

    return await this.queries.execute(new GetOrderByIdQuery(idNum));
  }

  @Version('1')
  @Post('/draft')
  async draft(@Body() body: CreateOrderDraftHttpDto) {
    return await this.commands.execute(
      new CreateOrderDraftCqrsCommand(
        body.buyerId,
        body.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice ?? 0,
          pictureUrl: item.pictureUrl ?? '',
          quantity: item.quantity ?? item.Quantity ?? 1,
        })),
      ),
    );
  }

  @Version('1')
  @Post()
  @HttpCode(200)
  @ApiHeader({
    name: 'x-requestid',
    required: true,
    description: 'Correlation + idempotent create key (`x-requestid`)',
  })
  async create(@Headers('x-requestid') requestHeader: unknown, @Body() dto: CreateOrderHttpDto): Promise<void> {
    const rid = normalizeRequestGuid(requestHeader);

    const ok = await this.commands.execute(new IdentifiedCreateOrderCommand(rid, mapCreateOrderHttpDto(dto)));
    if (!ok) {
      this.log.warn(`CreateOrderCommand reported failure for RequestId=${rid}`);
    }
  }
}

/** Validates `x-requestid`; rejects missing or all-zero UUIDs. */
function normalizeRequestGuid(raw: unknown): string {
  const v = coerceHeader(raw);
  if (!v) {
    throw new BadRequestException('RequestId is missing.');
  }

  if (isEmptyUuid(v)) {
    throw new BadRequestException('Empty GUID is not valid for request ID');
  }

  return v;
}

function coerceHeader(header: unknown): string | undefined {
  if (typeof header === 'string') return header;
  if (Array.isArray(header) && typeof header[0] === 'string') return header[0];
  return undefined;
}

/** Accepts lowercase `00000000-0000-0000-0000-000000000000`. */
function isEmptyUuid(value: string): boolean {
  return /^(?:0{8}-(?:0{4}-){3}0{12})$/i.test(value.trim());
}
