export type ProcessedEventsPrismaDelegate = {
  processedIntegrationEventRow: {
    deleteMany: (args: {
      where: { processedAt: { lt: Date } };
    }) => Promise<{ count: number }>;
  };
};

export function resolveProcessedEventsRetentionDays(raw: string | undefined): number {
  const n = Number(raw ?? 90);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 90;
}

/** Deletes inbox ledger rows older than the retention window (Postgres Prisma services). */
export async function pruneProcessedIntegrationEvents(
  prisma: ProcessedEventsPrismaDelegate,
  retentionDays?: number,
): Promise<number> {
  const days =
    retentionDays ??
    resolveProcessedEventsRetentionDays(process.env.ESHOP_PROCESSED_EVENTS_RETENTION_DAYS);
  const cutoff = new Date(Date.now() - days * 86400000);
  const res = await prisma.processedIntegrationEventRow.deleteMany({
    where: { processedAt: { lt: cutoff } },
  });
  return res.count;
}
