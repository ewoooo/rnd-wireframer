# @cx/layout

Screen chrome and layout primitive package.

## Directory Contract

```text
src/index.ts             public barrel
src/public/chrome.ts     public screen chrome components
src/public/primitives.ts public Flex/Grid primitives
src/public/style.ts      public layout style helper contract used by renderer
src/public/types.ts      public layout node and prop types
src/public/contract.ts   public runtime guards for layout DTOs
src/chrome/              chrome component implementations
src/primitives/          primitive component implementations
src/internal/            className, spacing, and fallback style implementation
```

Public consumers should import from `@cx/layout`, `@cx/layout/chrome`, `@cx/layout/primitives`, `@cx/layout/style`, `@cx/layout/types`, or `@cx/layout/contract`.

Files under `src/internal/`, `src/chrome/`, and `src/primitives/` are implementation details and should not be imported by other packages.

## Public API

```ts
import { AppScreen, Flex, Grid } from "@cx/layout";
import { isScreenNode } from "@cx/layout/contract";
import type { ScreenNode } from "@cx/layout/types";
```

`@cx/layout/primitives` exposes only React primitives. Shared class and spacing helpers are exposed separately through `@cx/layout/style` so renderer code can depend on a deliberate style contract instead of primitive implementation files.
