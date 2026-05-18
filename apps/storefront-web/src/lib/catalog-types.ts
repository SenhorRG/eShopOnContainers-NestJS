export type CatalogItemVm = {
  Id: number;
  Name: string;
  Description?: string | null;
  Price: number;
  PictureFileName?: string | null;
  CatalogBrandId?: number | null;
  CatalogTypeId?: number | null;
  AvailableStock?: number;
  MaxStockThreshold?: number;
  CatalogBrand?: { Id: number; Brand: string } | null;
  CatalogType?: { Id: number; Type: string } | null;
};

export type CatalogPageVm = {
  PageIndex: number;
  PageSize: number;
  Count: number;
  Data: CatalogItemVm[];
};

export type CatalogBrandVm = { Id: number; Brand: string };
export type CatalogTypeVm = { Id: number; Type: string };
