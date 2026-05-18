import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));

/** Route/manifest regression without spinning HTTP/DB. */
describe('Orders HTTP surface (manifest)', () => {
  const src = readFileSync(join(dir, '..', 'src', 'api', 'ordering', 'orders-http.controller.ts'), 'utf8');

  test('defines cancel, ship, cardtypes, list, detail, draft, submit; idempotency header', () => {
    expect(src).toContain("@Put('cancel')");
    expect(src).toContain("@Put('ship')");
    expect(src).toContain("@Get('cardtypes')");
    expect(src).toContain('@Get()');
    expect(src).toContain("@Get(':orderId')");
    expect(src).toContain("@Post('/draft')");
    expect(src).toContain('@Post()');
    expect(src).toMatch(/x-requestid/i);
    expect(src).toContain("@Version('1')");
  });
});
