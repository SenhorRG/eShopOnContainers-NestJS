export type OpsTabId =
  | 'overview'
  | 'platform'
  | 'traces'
  | 'metrics'
  | 'logs'
  | 'environment';

type NavTabsProps = {
  activeTab: OpsTabId;
  onChange: (tab: OpsTabId) => void;
};

const TABS: Array<{ id: OpsTabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'platform', label: 'Platform' },
  { id: 'traces', label: 'Traces' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'logs', label: 'Logs' },
  { id: 'environment', label: 'Environment' },
];

export function NavTabs({ activeTab, onChange }: NavTabsProps) {
  return (
    <nav className="ops-nav" aria-label="Operations sections">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={tab.id === activeTab ? 'ops-nav__item ops-nav__item--active' : 'ops-nav__item'}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
