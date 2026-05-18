import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pageIndex = 0;
}

export class CatalogListFiltersDto extends PaginationQueryDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  type?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brand?: number;
}
