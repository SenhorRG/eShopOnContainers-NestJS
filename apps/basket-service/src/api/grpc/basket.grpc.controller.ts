import { Controller, Inject, Logger } from '@nestjs/common';
import { Metadata, status as GrpcStatus } from '@grpc/grpc-js';
import type { BasketItemDto } from '../../application/basket/basket.types';
import { GrpcMethod, RpcException } from '@nestjs/microservices';

import { BASKET_REPOSITORY } from '../../application/basket/basket.tokens';
import type { BasketRepositoryPort } from '../../application/basket/ports/basket-repository.port';
import { BasketGrpcIdentityService } from './basket-grpc-identity.service';

type GrpcBasketItemSnake = {
  product_id?: number;
  quantity?: number;
};

type GrpcBasketRequestItems = {
  items?: ReadonlyArray<GrpcBasketItemSnake>;
};

@Controller()
export class BasketGrpcController {
  private readonly log = new Logger(BasketGrpcController.name);

  constructor(
    @Inject(BASKET_REPOSITORY)
    private readonly repository: BasketRepositoryPort,
    @Inject(BasketGrpcIdentityService)
    private readonly identity: BasketGrpcIdentityService,
  ) {}

  @GrpcMethod('Basket', 'GetBasket')
  async getBasket(_request: Record<string, never>, meta?: Metadata): Promise<{ items: GrpcBasketItemSnake[] }> {
    const userId = await this.identity.tryBuyerIdFromMetadata(meta);
    if (!userId) {
      return { items: [] };
    }

    const data = await this.repository.getBasketAsync(userId);
    if (!data) {
      return { items: [] };
    }

    return { items: this.mapToGrpcItems(data.Items) };
  }

  @GrpcMethod('Basket', 'UpdateBasket')
  async updateBasket(request: GrpcBasketRequestItems, meta?: Metadata): Promise<{ items: GrpcBasketItemSnake[] }> {
    const userId = await this.identity.tryBuyerIdFromMetadata(meta);
    if (!userId) {
      this.throwUnauthenticated();
    }

    this.log.debug(`UpdateBasket buyer ${userId}`);

    const customerBasket = this.mapToBasket(userId, request);
    const response = await this.repository.updateBasketAsync(customerBasket);
    if (!response) {
      this.throwNotFound(userId);
    }

    return { items: this.mapToGrpcItems(response.Items) };
  }

  @GrpcMethod('Basket', 'DeleteBasket')
  async deleteBasket(_request: Record<string, never>, meta?: Metadata): Promise<Record<string, never>> {
    const userId = await this.identity.tryBuyerIdFromMetadata(meta);
    if (!userId) {
      this.throwUnauthenticated();
    }

    await this.repository.deleteBasketAsync(userId);
    return {};
  }

  private mapToGrpcItems(items: ReadonlyArray<BasketItemDto>): GrpcBasketItemSnake[] {
    return items.map((it) => ({
      product_id: it.ProductId,
      quantity: it.Quantity,
    }));
  }

  private mapToBasket(userId: string, request: GrpcBasketRequestItems): { BuyerId: string; Items: BasketItemDto[] } {
    const items: BasketItemDto[] = [];

    if (request?.items) {
      let index = 0;
      for (const item of request.items) {
        const productIdRaw = Number(item.product_id ?? 0);
        const qtyRaw = Number(item.quantity ?? 0);
        if (!Number.isInteger(productIdRaw) || productIdRaw < 1) {
          throw new RpcException({
            code: GrpcStatus.INVALID_ARGUMENT,
            message: `Invalid product id at ${index}`,
          });
        }
        if (!Number.isInteger(qtyRaw) || qtyRaw < 1) {
          throw new RpcException({
            code: GrpcStatus.INVALID_ARGUMENT,
            message: `Invalid number of units (Quantity at ${index})`,
          });
        }

        items.push({
          ProductId: productIdRaw,
          Quantity: qtyRaw,
        });
        index += 1;
      }
    }

    return {
      BuyerId: userId,
      Items: items,
    };
  }

  /**
   * @throws { RpcException }
   */
  private throwUnauthenticated(): never {
    throw new RpcException({
      code: GrpcStatus.UNAUTHENTICATED,
      message: 'The caller is not authenticated.',
    });
  }

  /**
   * @throws { RpcException }
   */
  private throwNotFound(userId: string): never {
    throw new RpcException({
      code: GrpcStatus.NOT_FOUND,
      message: `Basket with buyer id ${userId} does not exist`,
    });
  }
}
