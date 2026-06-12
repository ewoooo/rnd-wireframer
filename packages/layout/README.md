# @cx/layout

Screen chrome, layout primitives, layout pattern components, and layout catalog package.

## Directory Contract

```text
src/index.ts             public barrel
src/public/chrome.ts     public screen chrome components
src/public/catalog.ts    public layout catalog facade
src/public/components.ts public layout pattern component resolver
src/public/mutations.ts  public pure layout catalog mutation helpers
src/public/primitives.ts public Flex/Grid primitives
src/public/resolver.ts   public layout candidate resolver
src/public/style.ts      public layout style helper contract used by renderer
src/public/types.ts      public layout node and prop types
src/public/contract.ts   public runtime guards for layout DTOs
src/chrome/              chrome component implementations
src/components/primitives/ primitive component implementations
src/components/patterns/ layout pattern component implementations
src/catalog/             layout pattern catalog JSON
src/internal/            className, spacing, and fallback style implementation
src/pattern-internal/    catalog schema, store, matcher implementation
```

Public consumers should import from `@cx/layout`, `@cx/layout/catalog`, `@cx/layout/chrome`, `@cx/layout/components`, `@cx/layout/contract`, `@cx/layout/mutations`, `@cx/layout/primitives`, `@cx/layout/resolver`, `@cx/layout/style`, or `@cx/layout/types`.

Files under `src/internal/`, `src/chrome/`, `src/components/`, `src/catalog/`, and `src/pattern-internal/` are implementation details and should not be imported by other packages.

## Public API

```ts
import { AppScreen, Flex, Grid } from "@cx/layout";
import { listCatalog } from "@cx/layout/catalog";
import { resolveLayoutPatternCandidates } from "@cx/layout/resolver";
import { isScreenNode } from "@cx/layout/contract";
import type { ScreenNode } from "@cx/layout/types";
```

`@cx/layout/primitives` exposes only React primitives. Shared class and spacing helpers are exposed separately through `@cx/layout/style` so renderer code can depend on a deliberate style contract instead of primitive implementation files.

`@cx/layout/catalog` and `@cx/layout/resolver` are the public layout knowledge surface. Consumers request catalog lookup or candidate resolution through these subpaths instead of reading catalog JSON or internal matcher files directly.
