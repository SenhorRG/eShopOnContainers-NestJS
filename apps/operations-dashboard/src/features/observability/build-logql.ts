import { isAllServices, type ServiceScopeEntry } from '../shared/service-scope';

export type LogLevelFilter = 'all' | 'error' | 'warn' | 'info' | 'debug';

export type BuildLogQueryInput = {
  serviceKey: string;
  catalog: ServiceScopeEntry[];
  level: LogLevelFilter;
  search: string;
};

function escapeLogqlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeRegexFragment(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function levelLabelMatcher(level: LogLevelFilter): string | null {
  switch (level) {
    case 'error':
      return 'level=~"ERROR|FATAL|error|fatal"';
    case 'warn':
      return 'level=~"WARN|warn"';
    case 'info':
      return 'level=~"INFO|info"';
    case 'debug':
      return 'level=~"DEBUG|TRACE|debug|trace"';
    default:
      return null;
  }
}

function withLevelLabel(selector: string, level: LogLevelFilter): string {
  const matcher = levelLabelMatcher(level);
  if (!matcher) {
    return selector;
  }
  return selector.replace(/\}$/, `, ${matcher}}`);
}

function appendSearchPipeline(query: string, search: string): string {
  const trimmedSearch = search.trim();
  if (!trimmedSearch) {
    return query;
  }
  return `${query} |= "${escapeLogqlString(trimmedSearch)}"`;
}

function buildStreamSelectors(catalog: ServiceScopeEntry[], serviceKey: string): string[] {
  if (isAllServices(serviceKey)) {
    const serviceNames = catalog.map((entry) => escapeRegexFragment(entry.otelServiceName)).join('|');
    const composeKeys = catalog
      .flatMap((entry) => [entry.id, entry.otelServiceName])
      .map(escapeRegexFragment)
      .join('|');
    return [`{service_name=~"${serviceNames}"}`, `{compose_service=~"${composeKeys}"}`];
  }

  const entry = catalog.find((item) => item.otelServiceName === serviceKey);
  if (!entry) {
    return [`{service_name="${serviceKey}"}`];
  }

  return [
    `{service_name="${entry.otelServiceName}"}`,
    `{compose_service=~"${escapeRegexFragment(entry.id)}|${escapeRegexFragment(entry.otelServiceName)}"}`,
  ];
}

/** Loki 3 does not allow `{a} or {b}` stream selectors; run each selector as its own query. */
export function buildServiceLogQueries(input: BuildLogQueryInput): string[] {
  const selectors = buildStreamSelectors(input.catalog, input.serviceKey);
  return selectors.map((selector) => appendSearchPipeline(withLevelLabel(selector, input.level), input.search));
}

export function buildServiceLogQuery(input: BuildLogQueryInput): string {
  return buildServiceLogQueries(input)[0] ?? `{service_name=~".+"}`;
}
