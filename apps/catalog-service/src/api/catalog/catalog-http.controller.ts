import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';
import { ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CatalogListFiltersDto, PaginationQueryDto } from '../../api/dto/catalog-pagination.dto';
import { UpsertCatalogItemDto } from '../../api/dto/catalog-item-write.dto';
import { CatalogApiService } from '../../application/catalog/catalog-api.service';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogHttpController {
  constructor(private readonly catalog: CatalogApiService) {}

  private parseOptionalInt(raw?: string): number | undefined {
    if (raw === undefined || raw === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }

  private parseIdsCsv(csv?: string): number[] {
    if (!csv) return [];
    return csv
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  }

  /* --- versioning: items list --- */

  @Get('items')
  @Version('1.0')
  async listV1(@Query() pag: PaginationQueryDto) {
    return this.catalog.listItemsV1(pag);
  }

  @Get('items')
  @Version('2.0')
  async listV2(@Query() pag: CatalogListFiltersDto) {
    return this.catalog.listItemsV2(pag);
  }

  /* --- versioning: semantic search --- */

  @ApiQuery({ name: 'pageIndex', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @Get('items/withsemanticrelevance/:text')
  @Version('1.0')
  async semanticV1(@Param('text') text: string, @Query() pag: PaginationQueryDto) {
    return this.catalog.semanticSearch(pag, text);
  }

  @ApiQuery({ name: 'text', required: true })
  @Get('items/withsemanticrelevance')
  @Version('2.0')
  async semanticV2(@Query('text') text: string, @Query() pag: PaginationQueryDto) {
    if (!text?.trim()) {
      throw new BadRequestException({ status: 400, detail: 'Missing search text.' });
    }
    return this.catalog.semanticSearch(pag, text);
  }

  /* --- v1 typed filters --- */

  @Version('1.0')
  @Get('items/by/:name')
  async itemsBySegmentName(@Param('name') name: string, @Query() pag: PaginationQueryDto) {
    return this.catalog.listByNamePaginated(pag, name);
  }

  @Version('1.0')
  @Get(['items/type/:typeId/brand/:brandId', 'items/type/:typeId/brand'])
  async byTypeBrand(
    @Param('typeId', ParseIntPipe) typeId: number,
    @Param('brandId') brandIdRaw: string | undefined,
    @Query() pag: PaginationQueryDto,
  ) {
    return this.catalog.listByTypeBrand(pag, typeId, this.parseOptionalInt(brandIdRaw));
  }

  @Version('1.0')
  @Get(['items/type/all/brand/:brandId', 'items/type/all/brand'])
  async byBrandOnly(@Param('brandId') brandIdRaw: string | undefined, @Query() pag: PaginationQueryDto) {
    return this.catalog.listByBrandOnly(pag, this.parseOptionalInt(brandIdRaw));
  }

  /* --- neutral endpoints --- */

  @Version(VERSION_NEUTRAL)
  @Get('items/by')
  @ApiProduces('application/json')
  batchByIds(@Query('ids') idsCsv?: string) {
    return this.catalog.getItemsByIds(this.parseIdsCsv(idsCsv));
  }

  @Version(VERSION_NEUTRAL)
  @Get('items/:id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.getItemById(id);
  }

  @Version(VERSION_NEUTRAL)
  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: UpsertCatalogItemDto, @Res({ passthrough: false }) res: Response) {
    const item = await this.catalog.createItem(body);
    res
      .status(HttpStatus.CREATED)
      .location(`/api/catalog/items/${item.Id}`)
      .json(item);
  }

  @Version('1.0')
  @Put('items')
  @HttpCode(HttpStatus.CREATED)
  async updateV1(@Body() body: UpsertCatalogItemDto, @Res({ passthrough: false }) res: Response) {
    const item = await this.catalog.updateItemV1(body);
    res.status(HttpStatus.CREATED).location(`/api/catalog/items/${item.Id}`).json(item);
  }

  @Version('2.0')
  @Put('items/:id')
  @HttpCode(HttpStatus.CREATED)
  async updateV2(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpsertCatalogItemDto,
    @Res({ passthrough: false }) res: Response,
  ) {
    const item = await this.catalog.updateItemRoute(id, body);
    res.status(HttpStatus.CREATED).location(`/api/catalog/items/${id}`).json(item);
  }

  @Version(VERSION_NEUTRAL)
  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.catalog.deleteItem(id);
  }

  @Version(VERSION_NEUTRAL)
  @Get('catalogtypes')
  listTypes() {
    return this.catalog.listTypes();
  }

  @Version(VERSION_NEUTRAL)
  @Get('catalogbrands')
  listBrands() {
    return this.catalog.listBrands();
  }
}
