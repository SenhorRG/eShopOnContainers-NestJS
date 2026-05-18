import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const SNAPSHOT_DIR = join(ROOT, 'contracts', 'openapi', 'nest');

export const SNAPSHOT_FILES = [
  'catalog-service.openapi.json',
  'ordering-service.openapi.json',
  'webhooks-service.openapi.json',
  'identity-service.openapi.json',
  'basket-service.openapi.json',
  'mobile-bff.openapi.json',
];

/** Live Swagger JSON export targets (mobile-bff is static-only). */
export const LIVE_EXPORTS = [
  {
    file: 'identity-service.openapi.json',
    defaultUrl: 'http://127.0.0.1:5051/api/docs-json',
    envKey: 'OPENAPI_IDENTITY_URL',
  },
  {
    file: 'catalog-service.openapi.json',
    defaultUrl: 'http://127.0.0.1:5052/api/docs-json',
    envKey: 'OPENAPI_CATALOG_URL',
  },
  {
    file: 'ordering-service.openapi.json',
    defaultUrl: 'http://127.0.0.1:5053/api/docs-json',
    envKey: 'OPENAPI_ORDERING_URL',
  },
  {
    file: 'basket-service.openapi.json',
    defaultUrl: 'http://127.0.0.1:5054/api/docs-json',
    envKey: 'OPENAPI_BASKET_URL',
  },
  {
    file: 'webhooks-service.openapi.json',
    defaultUrl: 'http://127.0.0.1:5055/api/docs-json',
    envKey: 'OPENAPI_WEBHOOKS_URL',
  },
];

export function snapshotPath(file) {
  return join(SNAPSHOT_DIR, file);
}

export function readSnapshot(file) {
  const raw = readFileSync(snapshotPath(file), 'utf8');
  return JSON.parse(raw);
}

export function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export function stableJson(value) {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}

export function resolveLiveUrl(entry) {
  const override = process.env[entry.envKey];
  return (override?.trim() || entry.defaultUrl).replace(/\/$/, '');
}
