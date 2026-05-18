type GhostButtonLinkProps = {
  href: string;
  children: string;
};

export function GhostButtonLink({ href, children }: GhostButtonLinkProps) {
  return (
    <a className="ops-button ops-button--ghost" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}
