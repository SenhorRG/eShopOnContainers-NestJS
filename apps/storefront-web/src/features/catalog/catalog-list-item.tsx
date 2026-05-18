import { Link } from 'react-router-dom';

import { catalogItemPicUrl } from '../../lib/catalog-api';
import type { CatalogItemVm } from '../../lib/catalog-types';

export function CatalogListItem({ item }: { item: CatalogItemVm }) {
  return (
    <div className="catalog-item">
      <Link className="catalog-product" to={`/item/${String(item.Id)}`}>
        <span className="catalog-product-image">
          <img alt={item.Name} src={catalogItemPicUrl(item.Id)} width={200} height={200} decoding="async" />
        </span>
        <span className="catalog-product-content">
          <span className="name">{item.Name}</span>
          <span className="price">${item.Price.toFixed(2)}</span>
        </span>
      </Link>
    </div>
  );
}
