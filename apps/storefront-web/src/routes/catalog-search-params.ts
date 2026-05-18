/** Build `?page=&brand=&type=` like Blazor `NavigationManager.GetUriWithQueryParameters`. */

export type CatalogQueryPatch = Partial<{
  page: number | null;
  brand: number | null;
  type: number | null;
}>;

export function stringifyCatalogSearch(current: URLSearchParams, patch: CatalogQueryPatch): string {
  const p = new URLSearchParams(current.toString());
  if ('page' in patch) {
    if (patch.page == null || patch.page <= 1) p.delete('page');
    else p.set('page', String(patch.page));
  }
  if ('brand' in patch) {
    if (patch.brand == null) p.delete('brand');
    else p.set('brand', String(patch.brand));
  }
  if ('type' in patch) {
    if (patch.type == null) p.delete('type');
    else p.set('type', String(patch.type));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function parseCatalogRouteSearch(search: string): {
  page: number;
  brandId: number | null;
  typeId: number | null;
} {
  const p = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const pageRaw = p.get('page');
  const page = Math.max(1, Number(pageRaw ?? '1') || 1);
  const brandRaw = p.get('brand');
  const typeRaw = p.get('type');
  const brandId = brandRaw != null && brandRaw !== '' ? Number(brandRaw) : null;
  const typeId = typeRaw != null && typeRaw !== '' ? Number(typeRaw) : null;
  return {
    page,
    brandId: brandId != null && Number.isFinite(brandId) ? brandId : null,
    typeId: typeId != null && Number.isFinite(typeId) ? typeId : null,
  };
}
