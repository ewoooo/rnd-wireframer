# @cx/pattern-store

Layout pattern reference package.

## Directory Contract

```text
src/catalog/   canonical pattern JSON files by target layer
src/schema.ts  compatibility re-export for @cx/types pattern schemas
src/store.ts   public store loader, lookup, and derived summaries
src/resolver.ts pattern selection helpers
src/data.ts    compatibility exports for canonical JSON sets
```

`src/catalog/*.json` is the source of truth for pattern data. Pattern store types and runtime schemas are owned by `@cx/types`. Do not add a separate static index JSON beside the catalog. If a searchable index or prompt summary is needed, derive it from `loadPatternStore()` or `listPatternSummaries()` so IDs, variants, and descriptions cannot drift from the canonical pattern records.
