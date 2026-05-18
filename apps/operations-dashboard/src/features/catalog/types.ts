export type ComposeProfile = 'dev' | 'infra-only' | 'e2e' | 'stack';

export type NestServiceCatalogEntry = {
  id: string;
  title: string;
  otelServiceName: string;
  healthUrl: string;
  aliveUrl: string;
  port: number;
};

export type LocalResourceKind = 'service' | 'worker' | 'database' | 'cache' | 'message-bus' | 'observability' | 'ui';

export type LocalResource = {
  id: string;
  title: string;
  kind: LocalResourceKind;
  composeProfiles: ComposeProfile[];
  hostPort?: number;
  openUrl?: string;
};

export type ResourceEdge = {
  from: string;
  to: string;
  relation: string;
};

export type LocalResourceCatalog = {
  resources: LocalResource[];
  edges: ResourceEdge[];
};
