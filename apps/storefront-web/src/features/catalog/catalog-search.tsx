import { Link, useLocation } from 'react-router-dom';

import type { CatalogBrandVm, CatalogTypeVm } from '../../lib/catalog-types';
import { stringifyCatalogSearch } from '../../routes/catalog-search-params';

type Props = {
  brands: CatalogBrandVm[];
  types: CatalogTypeVm[];
  brandId: number | null;
  typeId: number | null;
};

export function CatalogSearch({ brands, types, brandId, typeId }: Props) {
  const { search } = useLocation();
  const sp = new URLSearchParams(search);

  return (
    <div className="catalog-search">
      <div className="catalog-search-header">
        <img role="presentation" src="/icons/filters.svg" alt="" />
        Filters
      </div>
      <div className="catalog-search-types">
        <div className="catalog-search-group">
          <h3>Brand</h3>
          <div className="catalog-search-group-tags">
            <Link
              className={`catalog-search-tag${brandId == null ? ' active' : ''}`}
              to={{ pathname: '/', search: stringifyCatalogSearch(sp, { page: null, brand: null }) }}
            >
              All
            </Link>
            {brands.map((b) => (
              <Link
                key={b.Id}
                className={`catalog-search-tag${brandId === b.Id ? ' active' : ''}`}
                to={{ pathname: '/', search: stringifyCatalogSearch(sp, { page: null, brand: b.Id }) }}
              >
                {b.Brand}
              </Link>
            ))}
          </div>
        </div>
        <div className="catalog-search-group">
          <h3>Type</h3>
          <div className="catalog-search-group-tags">
            <Link
              className={`catalog-search-tag${typeId == null ? ' active' : ''}`}
              to={{ pathname: '/', search: stringifyCatalogSearch(sp, { page: null, type: null }) }}
            >
              All
            </Link>
            {types.map((t) => (
              <Link
                key={t.Id}
                className={`catalog-search-tag${typeId === t.Id ? ' active' : ''}`}
                to={{ pathname: '/', search: stringifyCatalogSearch(sp, { page: null, type: t.Id }) }}
              >
                {t.Type}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
