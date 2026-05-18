import type { LocalResource } from './types';
import { ExternalLink } from '../shared/external-link';

type LocalResourceTableProps = {
  resources: LocalResource[];
};

export function LocalResourceTable({ resources }: LocalResourceTableProps) {
  return (
    <table className="ops-table">
      <thead>
        <tr>
          <th>Resource</th>
          <th>Kind</th>
          <th>Profiles</th>
          <th>Host port</th>
          <th>Open</th>
        </tr>
      </thead>
      <tbody>
        {resources.map((resource) => (
          <tr key={resource.id}>
            <td>{resource.title}</td>
            <td>{resource.kind}</td>
            <td>{resource.composeProfiles.join(', ')}</td>
            <td>{resource.hostPort ?? '—'}</td>
            <td>
              {resource.openUrl ? <ExternalLink href={resource.openUrl}>Open</ExternalLink> : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
