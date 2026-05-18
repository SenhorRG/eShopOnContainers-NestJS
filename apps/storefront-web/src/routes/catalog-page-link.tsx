import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { stringifyCatalogSearch } from './catalog-search-params';

type Props = {
  page: number;
  children: ReactNode;
};

export function CatalogPageLink({ page, children }: Props) {
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const currentPage = Math.max(1, Number(sp.get('page') ?? '1') || 1);
  const active = currentPage === page;
  const nextSearch = stringifyCatalogSearch(sp, { page: page <= 1 ? null : page });
  return (
    <Link className={active ? 'active-page' : undefined} to={{ pathname: '/', search: nextSearch }}>
      {/* react-router-dom may resolve older @types/react than the app; children are valid at runtime. */}
      {children as never}
    </Link>
  );
}
