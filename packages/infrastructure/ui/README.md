# `@eshop/ui`

React building blocks in the **shadcn/ui** style (composition + Tailwind), shared by **`@eshop/storefront-web`** and **`@eshop/webhook-client`**.

## Theme tokens

Import shared HSL variables in each Vite app:

```css
@import '@eshop/ui/theme-tokens.css';
```

Override `:root` in the app when you need a dark storefront shell (see `apps/storefront-web/src/index.css`). The default export targets a **light lab** palette suitable for webhook-client forms.

| Token | Role |
|-------|------|
| `--background` / `--foreground` | Page shell |
| `--card` / `--border` | Cards and outlines |
| `--primary` | Primary actions |
| `--muted-foreground` | Secondary text |

## Tree shaking

The package exports **named** symbols so bundlers can drop unused components.

## Ladle

```bash
pnpm --filter @eshop/ui ladle
```

Stories sit next to components (`*.stories.tsx`). `src/ladle.css` mirrors Tailwind tokens for the preview shell.

## Primitives

`Button`, `Input`, `Label`, `Card`, `Badge`, `Separator`, `Alert` — extend under `src/components/` (one concern per file).
