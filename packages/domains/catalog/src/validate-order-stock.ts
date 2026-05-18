export type OrderStockLine = {
  productId: number;
  units: number;
};

export type CatalogStockSnapshot = {
  productId: number;
  availableStock: number;
};

export type StockConfirmationLine = {
  productId: number;
  hasStock: boolean;
};

/**
 * Validates saga stock lines against catalog snapshots (reference `Catalog.API` stock check).
 * Missing catalog rows are skipped (upstream treats unknown products as non-blocking in some paths).
 */
export function validateOrderStockLines(
  lines: readonly OrderStockLine[],
  snapshots: ReadonlyMap<number, CatalogStockSnapshot>,
): StockConfirmationLine[] {
  const confirmed: StockConfirmationLine[] = [];

  for (const line of lines) {
    const snapshot = snapshots.get(line.productId);
    if (!snapshot) continue;
    confirmed.push({
      productId: snapshot.productId,
      hasStock: snapshot.availableStock >= line.units,
    });
  }

  return confirmed;
}

export function orderStockHasRejection(confirmations: readonly StockConfirmationLine[]): boolean {
  return confirmations.some((c) => !c.hasStock);
}
