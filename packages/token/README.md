# @cx/tokens

`@cx/tokens` owns the foundation and semantic design token source of truth for the screen generator.

Use this package for values shared by apps, layout primitives, component implementations, generated screens, and AI vocabulary.

## Public Surface

Use only the package exports declared in `package.json`.

```ts
import { Spacing12, ColorTextNeutralPrimary } from "@cx/tokens";
```

```css
@import "@cx/tokens/variables.css";
@import "@cx/tokens/tailwind.css";
```

Public exports:

| Export | Purpose |
|---|---|
| `@cx/tokens` | TypeScript token constants for tooling, audits, and generated context |
| `@cx/tokens/variables.css` | CSS custom properties such as `--skt-color-*`, `--skt-radius-*`, `--skt-spacing-*`, and `--skt-typography-*` |
| `@cx/tokens/tailwind.css` | Tailwind v4 `@theme` mapping for token-backed utilities such as `gap-cx-12` |

Do not import generated files directly.

If a generated token or theme value is needed by consumers, expose it through `@cx/tokens`, `@cx/tokens/variables.css`, or `@cx/tokens/tailwind.css` instead of importing files under `generated/`.

## Directory Responsibilities

```text
packages/token/src/
  index.ts       public TypeScript entrypoint
  variables.css  public CSS variable entrypoint
  tailwind.css   public Tailwind v4 theme entrypoint
  generated/     generated token artifacts, not imported directly by consumers
  internal/      import, normalization, validation, and generation internals
```

### `generated/`

Generated artifacts are package internals. They may be rewritten by token generation tools.

Current artifacts:

- `tokens.ts`: foundation and semantic token constants.
- `variables.css`: foundation and semantic CSS custom properties.
- `tailwind-theme.css`: Tailwind v4 spacing `@theme` mapping.

### `internal/`

Internal code may parse source token files, normalize names, validate token shape, and write generated artifacts.

Do not export internal helpers from the package.

## Ownership Boundary

`@cx/tokens` owns:

- color palette tokens
- semantic color tokens
- radius tokens
- spacing tokens
- typography tokens
- Tailwind token utility mapping

`@cx/components` owns component token aliases such as `--skt-component-button-*`. Component aliases must reference `@cx/tokens` values instead of redefining raw colors, spacing, radius, or typography.
