import type { ReactNode } from 'react';

type DataPanelProps = {
  children: ReactNode;
  className?: string;
};

export function DataPanel({ children, className }: DataPanelProps) {
  const classes = ['ops-panel', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}
