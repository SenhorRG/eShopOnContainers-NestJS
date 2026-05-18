export type CatalogItemStockProps = {
  availableStock: number;
  restockThreshold: number;
  maxStockThreshold: number;
  onReorder: boolean;
};

export type CatalogItemProps = CatalogItemStockProps & {
  name: string;
  price: number;
};
