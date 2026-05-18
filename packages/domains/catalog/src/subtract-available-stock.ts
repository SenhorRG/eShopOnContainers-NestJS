import { CatalogDomainException } from './catalog-domain.exception';

/** Mirrors `CatalogItem.RemoveStock` (`Model/CatalogItem.cs`). */
export function subtractAvailableStock(
  currentAvailable: number,
  quantityDesired: number,
  productName: string,
): number {
  if (currentAvailable === 0) {
    throw new CatalogDomainException(`Empty stock, product item ${productName} is sold out`);
  }
  if (quantityDesired <= 0) {
    throw new CatalogDomainException('Item units desired should be greater than zero');
  }
  return Math.min(quantityDesired, currentAvailable);
}
