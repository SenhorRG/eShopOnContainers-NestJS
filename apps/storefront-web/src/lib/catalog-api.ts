import type { CatalogBrandVm, CatalogItemVm, CatalogPageVm, CatalogTypeVm } from './catalog-types';
import { apiBase } from './env';

const CATALOG_PAGE_SIZE_DEFAULT = 9;

function catalogOrigin(): string {
  return apiBase(import.meta.env.VITE_ESHOP_CATALOG_ORIGIN, 'http://127.0.0.1:5052');
}

export function catalogListUrl(): string {
  const base = catalogOrigin();
  const params = new URLSearchParams({
    'api-version': '1.0',
    pageSize: '12',
    pageIndex: '0',
  });
  return `${base}/api/catalog/items?${params.toString()}`;
}

export function catalogItemPicUrl(itemId: number): string {
  const base = catalogOrigin();
  return `${base}/api/catalog/items/${String(itemId)}/pic?api-version=1.0`;
}

export async function fetchCatalogPage(): Promise<CatalogPageVm> {
  const res = await fetch(catalogListUrl());
  if (!res.ok) {
    throw new Error(`catalog ${String(res.status)}`);
  }
  return (await res.json()) as CatalogPageVm;
}

export async function fetchCatalogPageFiltered(params: {
  page: number;
  pageSize?: number;
  brandId?: number | null;
  typeId?: number | null;
}): Promise<CatalogPageVm> {
  const base = catalogOrigin();
  const pageSize = params.pageSize ?? CATALOG_PAGE_SIZE_DEFAULT;
  const pageIndex = Math.max(0, params.page - 1);
  const qs = new URLSearchParams({
    'api-version': '2.0',
    pageIndex: String(pageIndex),
    pageSize: String(pageSize),
  });
  if (params.brandId != null) qs.set('brand', String(params.brandId));
  if (params.typeId != null) qs.set('type', String(params.typeId));
  const res = await fetch(`${base}/api/catalog/items?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`catalog ${String(res.status)}`);
  }
  return (await res.json()) as CatalogPageVm;
}

export async function fetchCatalogBrands(): Promise<CatalogBrandVm[]> {
  const res = await fetch(`${catalogOrigin()}/api/catalog/catalogbrands`);
  if (!res.ok) throw new Error(`brands ${String(res.status)}`);
  const raw = (await res.json()) as unknown[];
  if (!Array.isArray(raw)) return [];
  return raw.map((o) => {
    const r = o as Record<string, unknown>;
    return { Id: Number(r.Id ?? r.id), Brand: String(r.Brand ?? r.brand ?? '') };
  });
}

export async function fetchCatalogTypes(): Promise<CatalogTypeVm[]> {
  const res = await fetch(`${catalogOrigin()}/api/catalog/catalogtypes`);
  if (!res.ok) throw new Error(`types ${String(res.status)}`);
  const raw = (await res.json()) as unknown[];
  if (!Array.isArray(raw)) return [];
  return raw.map((o) => {
    const r = o as Record<string, unknown>;
    return { Id: Number(r.Id ?? r.id), Type: String(r.Type ?? r.type ?? '') };
  });
}

export async function fetchCatalogItemById(id: number): Promise<CatalogItemVm> {
  const res = await fetch(`${catalogOrigin()}/api/catalog/items/${String(id)}`);
  if (res.status === 404) {
    throw new Error('404');
  }
  if (!res.ok) throw new Error(`item ${String(res.status)}`);
  return (await res.json()) as CatalogItemVm;
}

export const CATALOG_PAGE_SIZE = CATALOG_PAGE_SIZE_DEFAULT;
