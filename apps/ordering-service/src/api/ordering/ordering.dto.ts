import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class BasketItemHttpDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsInt()
  productId!: number;

  @IsString()
  @MaxLength(500)
  productName!: string;

  @IsOptional()
  unitPrice?: number;

  @IsOptional()
  oldUnitPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  Quantity?: number;

  @IsOptional()
  @IsString()
  pictureUrl?: string;
}

export class CreateOrderDraftHttpDto {
  @IsDefined()
  @IsString()
  buyerId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BasketItemHttpDto)
  items!: BasketItemHttpDto[];
}

export class CreateOrderHttpDto {
  @IsString()
  userId!: string;

  @IsString()
  userName!: string;

  @IsString()
  city!: string;

  @IsString()
  street!: string;

  @IsString()
  state!: string;

  @IsString()
  country!: string;

  @IsString()
  zipCode!: string;

  @IsString()
  cardNumber!: string;

  @IsString()
  cardHolderName!: string;

  @IsDate()
  @Type(() => Date)
  cardExpiration!: Date;

  @IsString()
  cardSecurityNumber!: string;

  @IsInt()
  cardTypeId!: number;

  /** Ignored by the reference API but accepted for wire compatibility. */
  @IsOptional()
  @IsString()
  buyer?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BasketItemHttpDto)
  items!: BasketItemHttpDto[];
}

export class CancelOrShipHttpDto {
  @IsInt()
  orderNumber!: number;
}

export type OrderingCreateOrderPayload = {
  userId: string;
  userName: string;
  city: string;
  street: string;
  state: string;
  country: string;
  zipCode: string;
  cardNumber: string;
  cardHolderName: string;
  cardExpiration: Date;
  cardSecurityNumber: string;
  cardTypeId: number;
  items: OrderingCreateOrderItem[];
};

export type OrderingCreateOrderItem = {
  productId: number;
  productName: string;
  unitPrice: number;
  discount: number;
  pictureUrl: string;
  units: number;
};

export function mapCreateOrderHttpDto(dto: CreateOrderHttpDto): OrderingCreateOrderPayload {
  return {
    userId: dto.userId,
    userName: dto.userName,
    city: dto.city,
    street: dto.street,
    state: dto.state,
    country: dto.country,
    zipCode: dto.zipCode,
    cardNumber: dto.cardNumber,
    cardHolderName: dto.cardHolderName,
    cardExpiration: dto.cardExpiration,
    cardSecurityNumber: dto.cardSecurityNumber,
    cardTypeId: dto.cardTypeId,
    items: dto.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      unitPrice: it.unitPrice ?? 0,
      discount: 0,
      pictureUrl: it.pictureUrl ?? '',
      units: it.quantity ?? it.Quantity ?? 1,
    })),
  };
}
