import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { CATALOG_PAGE_SIZE, fetchCatalogBrands, fetchCatalogPageFiltered, fetchCatalogTypes } from '../../lib/catalog-api';
import type { CatalogBrandVm, CatalogItemVm, CatalogPageVm, CatalogTypeVm } from '../../lib/catalog-types';
import { useStorefrontUi } from '../../layout/storefront-ui-context';
import { CatalogPageLink } from '../../routes/catalog-page-link';
import { parseCatalogRouteSearch } from '../../routes/catalog-search-params';
import { CatalogListItem } from './catalog-list-item';
import { CatalogSearch } from './catalog-search';

export function CatalogPage() {
  const { setHeaderTitle, setHeaderSubtitle } = useStorefrontUi();
  const { search } = useLocation();

  const { page, brandId, typeId } = useMemo(() => parseCatalogRouteSearch(search), [search]);

  const [brands, setBrands] = useState<CatalogBrandVm[]>([]);
  const [types, setTypes] = useState<CatalogTypeVm[]>([]);
  const [result, setResult] = useState<CatalogPageVm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'AdventureWorks';
  }, []);

  useEffect(() => {
    setHeaderTitle('Ready for a new adventure?');
    setHeaderSubtitle('Start the season with the latest in clothing and equipment.');
    return () => {
      setHeaderTitle('');
      setHeaderSubtitle('');
    };
  }, [setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [b, t] = await Promise.all([fetchCatalogBrands(), fetchCatalogTypes()]);
        if (!cancelled) {
          setBrands(b);
          setTypes(t);
        }
      } catch {
        if (!cancelled) {
          setBrands([]);
          setTypes([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCatalogPageFiltered({
          page,
          pageSize: CATALOG_PAGE_SIZE,
          brandId,
          typeId,
        });
        if (!cancelled) setResult(data);
      } catch (e) {
        if (!cancelled) setError(String((e as Error).message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, brandId, typeId]);

  const pageIndexes = useMemo(() => {
    if (!result) return [] as number[];
    const total = Math.ceil(result.Count / CATALOG_PAGE_SIZE);
    return Array.from({ length: Math.max(1, total) }, (_, i) => i + 1);
  }, [result]);

  return (
    <div className="catalog">
      <div className="catalog-filter">
        <CatalogSearch brands={brands} types={types} brandId={brandId} typeId={typeId} />
      </div>
      <div>
        {loading && <p>Loading...</p>}
        {error && !loading ? <p>{error}</p> : null}
        {!loading && result && (
          <>
            <div className="catalog-items">
              {(result.Data as CatalogItemVm[]).map((item) => (
                <CatalogListItem key={item.Id} item={item} />
              ))}
            </div>
            <div className="page-links">
              {pageIndexes.map((idx) => (
                <CatalogPageLink key={idx} page={idx}>
                  {idx}
                </CatalogPageLink>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
