export function buildLogsEmptyMessage(loading: boolean): string {
  if (loading) {
    return 'Loading logs...';
  }
  return 'No logs to show for the current filters';
}
