import { useMemo } from 'react';

import { loadLocalResourceCatalog } from '../catalog/load-local-resource-catalog';
import { LocalResourceTable } from '../catalog/local-resource-table';
import { PageHeader } from '../shared/page-header';

export function PlatformPage() {
  const resources = useMemo(() => loadLocalResourceCatalog().resources, []);

  return (
    <section className="ops-page">
      <PageHeader
        title="Platform"
        description="Nest services, workers, and Compose resources (databases, broker, observability consoles) on the host."
      />
      <LocalResourceTable resources={resources} />
    </section>
  );
}
