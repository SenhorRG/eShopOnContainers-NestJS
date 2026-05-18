import type { CustomerBasketDto } from '../basket.types';

export interface BasketRepositoryPort {
  getBasketAsync(customerId: string): Promise<CustomerBasketDto | null>;
  updateBasketAsync(basket: CustomerBasketDto): Promise<CustomerBasketDto | null>;
  deleteBasketAsync(customerId: string): Promise<boolean>;
}
