# Contributing

- **Project overview and local setup:** root [README.md](./README.md).  
- **Architecture decisions (ADRs):** [docs/README.md](./docs/README.md).  
- **Security:** [SECURITY.md](./SECURITY.md).  
- **Community standards:** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).  
- **CI:** [.github/workflows/eshop-nest-ci.yml](./.github/workflows/eshop-nest-ci.yml).  

The workspace root is `"private": true` in `package.json` to prevent accidental publishing.

## Pull requests

- Use short-lived branches and focused changes.  
- Before opening a PR, run at least `pnpm check` (lint + build) and `pnpm test:unit`. For CI parity (needs Docker): `pnpm ci`. Add integration/E2E only when your change touches persistence, messaging, or browser flows.  

## Logging

- Application code under `apps/` and `packages/` should use `@eshop/observability` / Pino—not `console.log` on hot paths.  
- Tests must never print secrets, bearer tokens, or webhook signing material.  

## Local environment

Copy [`.env.example`](./.env.example) to `.env`. Never commit `.env`.

## Quick validation

```bash
pnpm build
pnpm test:unit
```

Per-package scripts: `pnpm --filter <workspace-name> run <script>` (see each `package.json`).
