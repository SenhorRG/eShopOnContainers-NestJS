const escapeIdent = (s: string): string => s.replace(/"/g, '""');

/** EF `ordering` schema uses quoted PascalCase identifiers; Catalog omits schema. */
export function qualifyIntegrationEventLogTable(schema?: string | null): string {
  const table = 'IntegrationEventLog';
  const safeTable = `"${escapeIdent(table)}"`;

  if (schema === undefined || schema === null || schema === '') {
    return safeTable;
  }

  return `"${escapeIdent(schema)}".${safeTable}`;
}
