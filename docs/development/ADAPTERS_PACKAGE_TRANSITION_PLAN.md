# Adapters Package Transition Plan

## Purpose

Move scattered pure conversion logic into one bounded adapter layer.

`@cx/adapters` owns format-to-format conversion. It does not execute IO, AI, React rendering, validation policy, or database writes.

Target conversions:

```text
Markdown client input -> SourceSpec
DB/table rows -> RenderTree
RenderTree -> DB/table row projection
RenderTree -> Puck editable data
Puck editable data -> RenderTree candidate
```

## Decision

Create `packages/adapters` as `@cx/adapters`.

Use subpaths to keep the broad package name from becoming a catch-all.

```text
@cx/adapters/markdown
@cx/adapters/table
@cx/adapters/puck
```

Do not move execution responsibilities into this package.

## Target Public API

```ts
import { parseMarkdownSourceBundle } from "@cx/adapters/markdown";
import { materializeRenderScreenFromRows } from "@cx/adapters/table";
import { renderTreeToTableGenerationResult } from "@cx/adapters/table";
import {
	applyPuckAreaData,
	applyPuckScreenData,
	renderTreeToPuckAreaData,
	renderTreeToPuckScreenData,
} from "@cx/adapters/puck";
```

Names may change during implementation, but the responsibility split should not change.

## Required Responsibilities

`@cx/adapters` should:

- Convert already-loaded Markdown/client input into `SourceSpec`.
- Convert screen DB/table read model rows into `RenderTreeScreenNodeContract`.
- Project `RenderTree` into table/write-model rows or table generation contracts.
- Convert `RenderTree` nodes into Puck editable data.
- Convert Puck editable data back into immutable RenderTree candidates.
- Return diagnostics for missing references, unsupported children, invalid editable props, and lossy projection.
- Use `@cx/schema` as the DTO and RenderTree contract source.
- Keep all conversion functions pure.
- Expose conversion boundaries through subpaths.

## Forbidden Responsibilities

`@cx/adapters` must not:

- Read or write files.
- Call Supabase, PostgREST, or any database client.
- Insert, update, delete, or migrate database rows.
- Execute Claude, local agents, or remote AI APIs.
- Own pipeline stage order, retry policy, approval policy, or artifact storage.
- Run schema validation policy or quality review rules.
- Render React.
- Render Puck UI.
- Own component catalog values.
- Own layout or pattern recommendation.
- Mutate source JSON, source Markdown, or accepted generation artifacts.
- Hide relational parent-child order inside JSONB.

## Package Impact

| Package/App | Result |
|---|---|
| `@cx/schema` | Keep DTO, RenderTree constants, and guards as SSOT. Do not add conversion logic. |
| Legacy parser package | Removed after consumers migrated to `@cx/adapters/markdown`. |
| Legacy table materializer package | Removed after consumers migrated to `@cx/adapters/table`. |
| `@cx/pipeline` | Calls `@cx/adapters/markdown`; no longer owns parser/materializer/projection implementation. |
| `@cx/renderer` | No behavior change. Continue to accept RenderTree JSON only. |
| `@cx/validation` | No ownership change. May validate adapter output but does not live inside adapters. |
| `@cx/orchestration` | No ownership change. Continue to provide pure planning helpers. |
| `apps/web` | Move Puck adapter logic out of `apps/web/src/lib`; keep UI and REST/DB facade in the app. |
| `apps/smoke` | Use adapter subpaths for Markdown parsing and future `final-result.json -> DB rows` projection. |

## Source Move Map

| Current Location | Target Location | Notes |
|---|---|---|
| `packages/parser/src/public/*` | `packages/adapters/src/markdown/*` | Keep parser result envelope and Markdown diagnostics. |
| Legacy row materializer implementation | `packages/adapters/src/table/table-to-render-tree.ts` | Rename around rows-to-tree semantics. |
| Legacy row materializer types | `packages/adapters/src/table/types.ts` | Keep row contracts until DB package boundary is clearer. |
| `packages/pipeline/src/public/render-tree-to-tables.ts` | `packages/adapters/src/table/render-tree-to-table.ts` | Keep as projection only. No file IO or DB writes. |
| `apps/web/src/lib/puck-screen-adapter.ts` | `packages/adapters/src/puck/*` | Keep Puck UI components in `apps/web`. |

## Completion Status

All transition phases are complete. The historical phase plan below is kept as a record of the migration sequence and verification gates.

### Phase 1 - Create Adapter Package Shell

Status: Complete.

Created `packages/adapters` with package metadata, README, and public subpath placeholders.

Expected files:

```text
packages/adapters/package.json
packages/adapters/README.md
packages/adapters/src/index.ts
packages/adapters/src/markdown/index.ts
packages/adapters/src/table/index.ts
packages/adapters/src/puck/index.ts
packages/adapters/src/__tests__/public-api.test.ts
```

Acceptance checks:

```bash
npm test -- --run packages/adapters/src/__tests__/public-api.test.ts
npx tsc --noEmit --pretty false --incremental false
npm run lint
```

Commit:

```text
chore(adapters): add package shell and public subpaths
```

### Phase 2 - Move Markdown Adapter

Status: Complete.

Moved Markdown parsing from the legacy parser package to `@cx/adapters/markdown`, then removed the compatibility package after internal consumers migrated.

Required changes:

- Move implementation and tests. Done.
- Update `@cx/pipeline` markdown parse command imports. Done.
- Update `packages/pipeline/README.md`.
- Update `PACKAGE_MAP.md` and `PROJECT_STRUCTURE.md`.
- Remove the legacy parser package and workspace/lockfile references. Done.

Acceptance checks:

```bash
npm test -- --run packages/adapters/src/__tests__/markdown.test.ts packages/pipeline/src/__tests__/public-api.test.ts
npx tsc --noEmit --pretty false --incremental false
npm run lint
```

Commit:

```text
refactor(adapters): move markdown source parsing
```

### Phase 3 - Move Table To RenderTree Adapter

Status: Complete.

Moved row materialization into `@cx/adapters/table`, then removed the compatibility package once consumers migrated.

Required changes:

- Move `materializeRenderScreenFromRows()`.
- Move row and diagnostic types.
- Preserve DB row type -> RenderTree node type contract tables.
- Update `apps/web/src/lib/screen-db-loader.ts`.
- Update `/api/screens/*` tests if imports change.
- Update DB transition plan references.

Acceptance checks:

```bash
npm test -- --run packages/adapters/src/__tests__/table-to-render-tree.test.ts apps/web/src/lib/screen-db-loader.test.ts
npx tsc --noEmit --pretty false --incremental false
npm run lint
```

Commit:

```text
refactor(adapters): move table rows to rendertree materializer
```

### Phase 4 - Move RenderTree To Table Projection

Status: Complete.

Moved RenderTree projection from `@cx/pipeline` to `@cx/adapters/table`.

Required changes:

- Move `renderTreeToTableGenerationResult()`. Done.
- Keep `@cx/pipeline` as runtime/stage owner only. Done.
- Update tests/imports to consume `@cx/adapters/table`. Done.
- Ensure projection returns diagnostics/warnings without DB writes. Done.
- Keep direct DB apply as a future command outside adapters.

Acceptance checks:

```bash
npm test -- --run packages/adapters/src/__tests__/render-tree-to-table.test.ts packages/pipeline/src/__tests__/public-api.test.ts
npx tsc --noEmit --pretty false --incremental false
npm run lint
```

Commit:

```text
refactor(adapters): move rendertree to table projection
```

### Phase 5 - Move Puck Adapter

Status: Complete.

Moved Puck editable conversion from `apps/web` to `@cx/adapters/puck`.

Required changes:

- Move `puck-screen-adapter.ts` implementation and tests.
- Keep `ScreenPuckEditor` and `AreaPuckEditor` in `apps/web`.
- Update Web imports to `@cx/adapters/puck`.
- Keep API save route as Web-owned IO.
- Ensure adapter output is an immutable RenderTree candidate.

Acceptance checks:

```bash
npm test -- --run packages/adapters/src/__tests__/puck.test.ts apps/web/src/components/App.test.tsx
npx tsc --noEmit --pretty false --incremental false
npm run lint
npm run build
```

Commit:

```text
refactor(adapters): move puck editable conversion
```

### Phase 6 - Remove Compatibility Packages

Status: Complete for legacy parser and table materializer packages.

Removed compatibility packages after internal imports moved to `@cx/adapters/*`.

Required changes:

- Remove package directories or reduce them to documented tombstones if a transition branch still needs them.
- Remove workspace references from `package.json` and lockfile.
- Update `AGENTS.md`, `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`, `PIPELINE_STAGE_PROTOCOL.md`, and `RENDER_DB_REST_LOADER_TRANSITION_PLAN.md`.
- Search for stale imports.

Stale import checks:

```bash
	rg -n "@cx/parser|@cx/table-materializer|packages/parser|packages/table-materializer|puck-screen-adapter" apps packages AGENTS.md PACKAGE_MAP.md
```

Acceptance checks:

```bash
npm test
npx tsc --noEmit --pretty false --incremental false
npm run lint
npm run build
git diff --check
```

Commit:

```text
chore(adapters): retire parser and table materializer packages
```

## Cross-Cutting Rules

- Prefer moved tests over rewritten tests when behavior is unchanged.
- Add one public API test per adapter subpath.
- Compatibility re-exports are temporary and should be removed as soon as consumers migrate.
- Do not change DB schema during adapter package migration.
- Do not add new AI behavior during adapter package migration.
- Do not use this migration to redesign Puck UI.
- Do not change RenderTree schema shape unless a separate schema decision is recorded.

## Success Criteria

The migration is complete when:

- All pure conversion logic lives under `@cx/adapters/*`.
- Apps and pipeline call adapter subpaths instead of owning conversion logic.
- The legacy parser package is removed and has no active imports.
- The legacy table materializer package is removed and has no active imports.
- `@cx/adapters` has no file IO, Supabase calls, AI calls, React components, or DB writes.
- `@cx/schema` remains the RenderTree and DTO contract source.
- Web Puck editing still loads, edits, and saves through RenderTree candidates.
- DB loader still materializes screen trees from relational rows.
- Smoke generation still reaches `final-result.json`.

## Risks And Guards

| Risk | Guard |
|---|---|
| `@cx/adapters` becomes a catch-all | Keep only `markdown`, `table`, and `puck` subpaths. Reject execution logic. |
| Compatibility re-exports hide stale imports | Phase 6 stale import searches cover legacy parser/materializer package names. |
| Puck UI logic leaks into adapters | Keep React components in `apps/web`; adapter only returns data/candidates. |
| DB write logic leaks into adapters | Keep REST save/apply routes in `apps/web` or command packages. |
| Table projection silently drops nodes | Return diagnostics/warnings and test unsupported children. |
| Parser move breaks pipeline | Pipeline markdown parse command consumes `@cx/adapters/markdown`; adapter and pipeline tests cover the handoff. |

## First Implementation Commit Checklist

Before starting Phase 1:

```bash
git status --short
```

During each phase:

```bash
npm test -- --run <phase-specific-tests>
npx tsc --noEmit --pretty false --incremental false
npm run lint
git diff --check
git status --short
```

After each phase passes, commit only the phase files.
