import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { BasketItemDto, CustomerBasketDto } from '../../application/basket/basket.types';
import { BASKET_REPOSITORY } from '../../application/basket/basket.tokens';
import type { BasketRepositoryPort } from '../../application/basket/ports/basket-repository.port';

import { BasketAuthGuard } from './auth/basket-auth.guard';
import { UpdateBasketHttpDto } from './dto/update-basket-http.dto';

type AuthedReq = Request & { user?: { sub?: string } };

@ApiTags('Basket')
@ApiBearerAuth()
@UseGuards(BasketAuthGuard)
@Controller('api/basket')
export class BasketHttpController {
  constructor(@Inject(BASKET_REPOSITORY) private readonly repository: BasketRepositoryPort) {}

  @Get()
  async getBasket(@Req() req: AuthedReq): Promise<{ items: BasketItemDto[] }> {
    const buyerId = this.requireBuyerId(req);
    const data = await this.repository.getBasketAsync(buyerId);
    return { items: data?.Items ?? [] };
  }

  @Put()
  async updateBasket(
    @Req() req: AuthedReq,
    @Body() dto: UpdateBasketHttpDto,
  ): Promise<{ items: BasketItemDto[] }> {
    const buyerId = this.requireBuyerId(req);
    const customerBasket: CustomerBasketDto = {
      BuyerId: buyerId,
      Items: dto.items.map((item) => ({
        ProductId: item.productId,
        Quantity: item.quantity,
      })),
    };

    const response = await this.repository.updateBasketAsync(customerBasket);
    if (!response) {
      throw new NotFoundException(`Basket for buyer ${buyerId} could not be persisted`);
    }

    return { items: response.Items };
  }

  @Delete()
  @HttpCode(204)
  async deleteBasket(@Req() req: AuthedReq): Promise<void> {
    const buyerId = this.requireBuyerId(req);
    await this.repository.deleteBasketAsync(buyerId);
  }

  private requireBuyerId(req: AuthedReq): string {
    const sub = req.user?.sub?.trim() ?? '';
    if (!sub.length) {
      throw new UnauthorizedException('The caller is not authenticated.');
    }
    return sub;
  }
}
