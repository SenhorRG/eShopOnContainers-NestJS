import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertCatalogItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  Id?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  Name!: string;

  @IsOptional()
  @IsString()
  Description?: string;

  @IsNumber()
  Price!: number;

  @IsOptional()
  @IsString()
  PictureFileName?: string;

  @Type(() => Number)
  @IsInt()
  CatalogTypeId!: number;

  @Type(() => Number)
  @IsInt()
  CatalogBrandId!: number;

  @Type(() => Number)
  @IsInt()
  AvailableStock!: number;

  @Type(() => Number)
  @IsInt()
  RestockThreshold!: number;

  @Type(() => Number)
  @IsInt()
  MaxStockThreshold!: number;

  @IsOptional()
  @IsBoolean()
  OnReorder?: boolean;
}
