import { DataPanel } from '../shared/data-panel';
import { formatContextRoute } from './format-context-route';
import type { LogRow } from './logs-types';

type LogsTableProps = {
  rows: LogRow[];
  emptyMessage: string;
  onViewRow: (row: LogRow) => void;
};

export function LogsTable({ rows, emptyMessage, onViewRow }: LogsTableProps) {
  return (
    <DataPanel className="ops-panel--logs">
      {rows.length > 0 ? <p className="ops-muted">{rows.length} lines (newest first)</p> : null}
      <div className="ops-log-viewer" role="region" aria-label="Logs table">
        <table className="ops-table ops-table--compact ops-table--sticky ops-log-table ops-log-table--actions-sticky">
          <thead>
            <tr>
              <th>Time</th>
              <th>Service</th>
              <th>Level</th>
              <th>Message</th>
              <th>Context/Route</th>
              <th className="ops-log-actions-header" aria-label="Actions">
                View
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="ops-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="ops-log-time">{row.timestamp}</td>
                  <td className="ops-log-service">{row.service}</td>
                  <td>
                    <span className={`ops-log-level ops-log-level--${row.level}`}>{row.level}</span>
                  </td>
                  <td className="ops-log-message">{row.body}</td>
                  <td className="ops-log-context-route">{formatContextRoute(row.context, row.route)}</td>
                  <td className="ops-log-actions">
                    <button
                      type="button"
                      className="ops-button ops-button--ghost ops-button--small"
                      onClick={() => onViewRow(row)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DataPanel>
  );
}
