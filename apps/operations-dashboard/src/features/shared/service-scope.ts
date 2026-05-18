export const ALL_SERVICES = '__all__';

export type ServiceScopeEntry = {
  id: string;
  otelServiceName: string;
};

export function isAllServices(value: string): boolean {
  return value === ALL_SERVICES;
}
