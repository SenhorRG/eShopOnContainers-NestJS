import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';

export class BasketItemHttpDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateBasketHttpDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BasketItemHttpDto)
  items!: BasketItemHttpDto[];
}
