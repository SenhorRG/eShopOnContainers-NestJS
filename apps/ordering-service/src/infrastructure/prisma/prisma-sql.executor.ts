import type { PrismaClient } from '@ordering/prisma-client';

import type { SqlExecutor } from '@eshop/outbox';

type RawClient = Pick<PrismaClient, '$executeRawUnsafe' | '$queryRawUnsafe'>;

export function prismaToSqlExecutor(tx: RawClient): SqlExecutor {
  return {
    async query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params?: unknown[]) {
      const p = params ?? [];
      const trimmed = sql.trimStart();
      if (/^insert/i.test(trimmed)) {
        await tx.$executeRawUnsafe(sql, ...p);
        return { rows: [] as T[] };
      }
      const rows = await tx.$queryRawUnsafe<T[]>(sql, ...p);
      return { rows: rows ?? [] };
    },
  };
}
