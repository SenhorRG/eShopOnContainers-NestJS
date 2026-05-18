import { CatalogDomainException } from './catalog-domain.exception';
import type { CatalogItemProps, CatalogItemStockProps } from './catalog-item.props';

export function assertValidCatalogItem(props: CatalogItemProps): void {
  const name = props.name.trim();
  if (!name) {
    throw new CatalogDomainException('Catalog item name is required.');
  }
  if (props.price < 0) {
    throw new CatalogDomainException('Catalog item price cannot be negative.');
  }
  assertValidStockThresholds(props);
}

export function assertValidStockThresholds(props: CatalogItemStockProps): void {
  if (props.availableStock < 0) {
    throw new CatalogDomainException('Available stock cannot be negative.');
  }
  if (props.restockThreshold < 0 || props.maxStockThreshold < 0) {
    throw new CatalogDomainException('Stock thresholds cannot be negative.');
  }
  if (props.restockThreshold > props.maxStockThreshold) {
    throw new CatalogDomainException('Restock threshold cannot exceed max stock threshold.');
  }
}

/** Returns whether stock is at or below restock threshold (reference reorder signal). */
export function shouldReorder(props: CatalogItemStockProps): boolean {
  return props.availableStock <= props.restockThreshold;
}
