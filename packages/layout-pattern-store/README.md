# @cx/layout-pattern-store

Layout pattern reference package.

## Directory Contract

```text
src/index.ts            runtime layout component registry barrel
src/public/catalog.ts   public catalog facade, store loader, lookup, preset, and summaries API
src/public/components.ts public runtime layout component registry API
src/public/mutations.ts public pure CRUD mutation API
src/public/resolver.ts  public pattern selection helpers
src/public/types.ts     package-owned pattern, preset, and resolver boundary types
src/catalog/            canonical pattern JSON files by target layer
src/internal/           raw JSON imports, zod schemas, cache, matcher, mutation implementation
```

`src/catalog/*.json` is the source of truth for pattern data. `@cx/layout-pattern-store` owns its local pattern types and runtime schemas; it does not depend on a shared `@cx/types` package. Do not add a separate static index JSON beside the catalog. If a searchable index or prompt summary is needed, derive it from `loadPatternStore()` or `listPatternSummaries()` so IDs, variants, and descriptions cannot drift from the canonical pattern records.

Public consumers should import catalog reads from `@cx/layout-pattern-store/catalog`, runtime layout components from `@cx/layout-pattern-store`, and supporting helpers from `@cx/layout-pattern-store/resolver`, `@cx/layout-pattern-store/mutations`, or `@cx/layout-pattern-store/types`. Files under `src/internal/` are implementation details and must not be imported by other packages.

## Public API

Read APIs expose normalized layout pattern data:

```ts
import {
	createCandidate,
	findPattern,
	getPatternPreset,
	getEntry,
	listCatalog,
	listCatalogIds,
	listPatternSummaries,
	listPatterns,
	loadPatternStore,
} from "@cx/layout-pattern-store/catalog";
```

Runtime layout component APIs are exposed from the package root:

```ts
import {
	findLayoutPatternComponent,
	findLayoutPatternComponentByLayoutId,
	listLayoutPatternComponents,
} from "@cx/layout-pattern-store";
```

Resolver APIs are exposed from a dedicated subpath so matching logic consumers are visible in import graphs:

```ts
import { resolveCompositePatternByComponentType } from "@cx/layout-pattern-store/resolver";
```

CRUD APIs are pure functions. They receive a `PatternStore`, return a new `PatternStore` in a result envelope, and do not write catalog JSON files:

```ts
import {
	createLayoutPattern,
	deleteLayoutPattern,
	readLayoutPattern,
	updateLayoutPattern,
	upsertLayoutPattern,
} from "@cx/layout-pattern-store/mutations";
```

Mutation functions return either `{ ok: true, store, pattern, changes }` or `{ ok: false, issues }`. File writes, approval workflow, and git changes belong outside this package.

## Schema Contract

The internal schema normalizes raw catalog records into the public `PatternStore` shape. It enforces:

- lowercase kebab-case pattern ids
- at least one variant per pattern
- `defaultVariant` must exist in `variants`
- matcher arrays must not be empty when present
- duplicate pattern ids are rejected at store level

Tests cover public catalog reads, CRUD mutation results, and schema validation separately under `src/__tests__/`.
