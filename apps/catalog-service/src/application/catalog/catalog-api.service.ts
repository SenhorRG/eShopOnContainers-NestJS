import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@catalog/prisma-client';
import { ProductPriceChangedIntegrationEvent } from '@eshop/integration-event-types';

import { CATALOG_PICS_PATH } from '../../infrastructure/pics-path.token';
import { CatalogAiOrchestrator } from '../../application/ai/catalog-ai.orchestrator';
import type { CatalogListFiltersDto, PaginationQueryDto } from '../../api/dto/catalog-pagination.dto';
import type { UpsertCatalogItemDto } from '../../api/dto/catalog-item-write.dto';
import { CatalogIntegrationEventService } from '../../integration/catalog-integration-event.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const itemInclude = { catalogBrand: true, catalogType: true } as const;

type ItemRow = Prisma.CatalogItemGetPayload<{ include: typeof itemInclude }>;

type CatalogDb = Pick<PrismaClient, '$executeRawUnsafe' | 'catalogItem'>;

@Injectable()
export class CatalogApiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: CatalogAiOrchestrator,
    private readonly integration: CatalogIntegrationEventService,
    @Inject(CATALOG_PICS_PATH) private readonly picsRoot: string,
  ) {}

  private static toNum(d: Prisma.Decimal | number): number {
    return typeof d === 'number' ? d : d.toNumber();
  }

  private mapItem(row: ItemRow) {
    return {
      Id: row.Id,
      Name: row.Name,
      Description: row.Description,
      Price: CatalogApiService.toNum(row.Price),
      PictureFileName: row.PictureFileName,
      CatalogTypeId: row.CatalogTypeId,
      CatalogBrandId: row.CatalogBrandId,
      AvailableStock: row.AvailableStock,
      RestockThreshold: row.RestockThreshold,
      MaxStockThreshold: row.MaxStockThreshold,
      OnReorder: row.OnReorder,
      CatalogBrand: row.catalogBrand
        ? { Id: row.catalogBrand.Id, Brand: row.catalogBrand.Brand }
        : null,
      CatalogType: row.catalogType
        ? { Id: row.catalogType.Id, Type: row.catalogType.Type }
        : null,
    };
  }

  private paginated<T>(pageIndex: number, pageSize: number, count: number, data: T[]) {
    return { PageIndex: pageIndex, PageSize: pageSize, Count: count, Data: data };
  }

  private buildWhere(filters: {
    namePrefix?: string;
    typeId?: number;
    brandId?: number;
  }): Prisma.CatalogItemWhereInput {
    const and: Prisma.CatalogItemWhereInput[] = [];
    if (filters.namePrefix) {
      and.push({ Name: { startsWith: filters.namePrefix, mode: 'insensitive' } });
    }
    if (filters.typeId != null) {
      and.push({ CatalogTypeId: filters.typeId });
    }
    if (filters.brandId != null) {
      and.push({ CatalogBrandId: filters.brandId });
    }
    return and.length ? { AND: and } : {};
  }

  async listItemsV1(pag: PaginationQueryDto) {
    return this.listItemsCore(pag, {});
  }

  async listItemsV2(pag: CatalogListFiltersDto) {
    return this.listItemsCore(pag, {
      namePrefix: pag.name,
      typeId: pag.type,
      brandId: pag.brand,
    });
  }

  private async listItemsCore(
    pag: PaginationQueryDto,
    filters: { namePrefix?: string; typeId?: number; brandId?: number },
  ) {
    const where = this.buildWhere(filters);
    const count = await this.prisma.catalogItem.count({ where });
    const rows = await this.prisma.catalogItem.findMany({
      where,
      include: itemInclude,
      orderBy: { Name: 'asc' },
      skip: pag.pageIndex * pag.pageSize,
      take: pag.pageSize,
    });
    return this.paginated(pag.pageIndex, pag.pageSize, count, rows.map((r) => this.mapItem(r)));
  }

  async listByNamePaginated(pag: PaginationQueryDto, name: string) {
    return this.listItemsCore(pag, { namePrefix: name });
  }

  async listByTypeBrand(pag: PaginationQueryDto, typeId: number, brandId?: number) {
    return this.listItemsCore(pag, { typeId, brandId });
  }

  async listByBrandOnly(pag: PaginationQueryDto, brandId?: number) {
    return this.listItemsCore(pag, { brandId });
  }

  async getItemsByIds(ids: number[]) {
    if (!ids.length) return [];
    const rows = await this.prisma.catalogItem.findMany({
      where: { Id: { in: ids } },
      include: itemInclude,
    });
    return rows.map((r) => this.mapItem(r));
  }

  async getItemById(id: number) {
    if (id <= 0) {
      throw new BadRequestException({ status: 400, detail: 'Id is not valid' });
    }
    const row = await this.prisma.catalogItem.findUnique({
      where: { Id: id },
      include: itemInclude,
    });
    if (!row) throw new NotFoundException();
    return this.mapItem(row);
  }

  async listTypes() {
    return this.prisma.catalogType.findMany({ orderBy: { Type: 'asc' } });
  }

  async listBrands() {
    return this.prisma.catalogBrand.findMany({ orderBy: { Brand: 'asc' } });
  }

  async semanticSearch(pag: PaginationQueryDto, text: string) {
    const vec = await this.ai.embeddingForSearchText(text);
    if (!vec) {
      return this.listByNamePaginated(pag, text);
    }

    const vecStr = `[${vec.join(',')}]`;
    const skip = pag.pageIndex * pag.pageSize;
    const take = pag.pageSize;

    const orderedIds = await this.prisma.$queryRawUnsafe<{ Id: number }[]>(
      `SELECT "Id" FROM "Catalog"
       WHERE "Embedding" IS NOT NULL
       ORDER BY "Embedding" <=> $1::vector ASC
       OFFSET $2 LIMIT $3`,
      vecStr,
      skip,
      take,
    );

    const totalItems = await this.prisma.catalogItem.count();
    const ids = orderedIds.map((x) => x.Id);
    if (!ids.length) {
      return this.paginated(pag.pageIndex, pag.pageSize, totalItems, []);
    }

    const rows = await this.prisma.catalogItem.findMany({
      where: { Id: { in: ids } },
      include: itemInclude,
    });
    const byId = new Map(rows.map((r) => [r.Id, r]));
    const data = ids
      .map((id) => byId.get(id))
      .filter((x): x is ItemRow => x != null)
      .map((r) => this.mapItem(r));
    return this.paginated(pag.pageIndex, pag.pageSize, totalItems, data);
  }

  private async persistEmbedding(tx: CatalogDb, id: number): Promise<void> {
    const row = await tx.catalogItem.findUnique({ where: { Id: id } });
    if (!row) return;
    const vec = await this.ai.embeddingForCatalogLine(row.Name, row.Description);
    if (!vec) return;
    const vecStr = `[${vec.join(',')}]`;
    await tx.$executeRawUnsafe(
      `UPDATE "Catalog" SET "Embedding" = $1::vector WHERE "Id" = $2::integer`,
      vecStr,
      id,
    );
  }

  async createItem(dto: UpsertCatalogItemDto) {
    const created = await this.prisma.catalogItem.create({
      data: {
        ...(dto.Id !== undefined ? { Id: dto.Id } : {}),
        Name: dto.Name,
        Description: dto.Description ?? null,
        Price: dto.Price,
        PictureFileName: dto.PictureFileName ?? undefined,
        CatalogTypeId: dto.CatalogTypeId,
        CatalogBrandId: dto.CatalogBrandId,
        AvailableStock: dto.AvailableStock,
        RestockThreshold: dto.RestockThreshold,
        MaxStockThreshold: dto.MaxStockThreshold,
        OnReorder: dto.OnReorder ?? false,
      },
      include: itemInclude,
    });

    mkdirSync(this.picsRoot, { recursive: true });
    if (!dto.PictureFileName) {
      await this.prisma.catalogItem.update({
        where: { Id: created.Id },
        data: { PictureFileName: `${created.Id}.webp` },
      });
    }

    await this.persistEmbedding(this.prisma, created.Id);

    const finalRow = await this.prisma.catalogItem.findUnique({
      where: { Id: created.Id },
      include: itemInclude,
    });
    return this.mapItem(finalRow!);
  }

  async updateItemRoute(idFromRoute: number, dto: UpsertCatalogItemDto) {
    if (idFromRoute <= 0) {
      throw new BadRequestException({ status: 400, detail: 'Id is not valid' });
    }
    return this.updateItemCore(idFromRoute, dto);
  }

  async updateItemV1(dto: UpsertCatalogItemDto) {
    if (dto.Id == null) {
      throw new BadRequestException({
        status: 400,
        detail: 'Item id must be provided in the request body.',
      });
    }
    return this.updateItemCore(dto.Id, dto);
  }

  private async updateItemCore(id: number, dto: UpsertCatalogItemDto) {
    const catalogItem = await this.prisma.catalogItem.findUnique({ where: { Id: id } });
    if (!catalogItem) {
      throw new NotFoundException({ status: 404, detail: `Item with id ${id} not found.` });
    }

    const originalPrice = catalogItem.Price;
    let priceEvent: ProductPriceChangedIntegrationEvent | undefined;

    await this.integration.withCatalogAndOutbox(async (tx, enqueue) => {
      await tx.catalogItem.update({
        where: { Id: id },
        data: {
          Name: dto.Name,
          Description: dto.Description ?? null,
          Price: dto.Price,
          PictureFileName: dto.PictureFileName ?? catalogItem.PictureFileName,
          CatalogTypeId: dto.CatalogTypeId,
          CatalogBrandId: dto.CatalogBrandId,
          AvailableStock: dto.AvailableStock,
          RestockThreshold: dto.RestockThreshold,
          MaxStockThreshold: dto.MaxStockThreshold,
          OnReorder: dto.OnReorder ?? catalogItem.OnReorder,
        },
      });
      await this.persistEmbedding(tx, id);

      if (!originalPrice.equals(new Prisma.Decimal(dto.Price))) {
        priceEvent = new ProductPriceChangedIntegrationEvent(
          id,
          dto.Price,
          CatalogApiService.toNum(originalPrice),
        );
        await enqueue(priceEvent);
      }
    });

    if (priceEvent) {
      await this.integration.publishThroughEventBusAsync(priceEvent);
    }

    const row = await this.prisma.catalogItem.findUnique({
      where: { Id: id },
      include: itemInclude,
    });
    return this.mapItem(row!);
  }

  async deleteItem(id: number) {
    const item = await this.prisma.catalogItem.findUnique({ where: { Id: id } });
    if (!item) {
      throw new NotFoundException();
    }
    await this.prisma.catalogItem.delete({ where: { Id: id } });
    if (item.PictureFileName) {
      const fp = join(this.picsRoot, item.PictureFileName);
      try {
        await unlink(fp);
      } catch {
        /* missing file tolerated */
      }
    }
  }
}
