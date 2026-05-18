/** Wire shape compatible with reference `CustomerBasket` + `BasketItem` (System.Text.Json PascalCase keys). */

export interface BasketItemDto {
  ProductId: number;
  Quantity: number;
  Id?: string;
  ProductName?: string;
  UnitPrice?: number;
  OldUnitPrice?: number;
  PictureUrl?: string;
}

export interface CustomerBasketDto {
  BuyerId: string;
  Items: BasketItemDto[];
}
