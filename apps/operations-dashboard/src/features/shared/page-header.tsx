import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="ops-page__header">
      <div>
        <h1>{title}</h1>
        <p className="ops-muted">{description}</p>
      </div>
      {actions ? <div className="ops-page__header-actions">{actions}</div> : null}
    </header>
  );
}
