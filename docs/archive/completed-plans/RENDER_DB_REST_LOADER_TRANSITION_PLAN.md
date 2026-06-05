# Screen DB REST Loader Transition Plan

## Purpose

Move the active screen read path from local table JSON and old Puck/Web tables to the relational Supabase `render_*` read model.

The target flow is:

```text
Supabase render_* tables
-> REST loader
-> @cx/adapters/table
-> RenderTreeScreenNode
-> @cx/renderer
-> Web / Puck / Workbench
```

Existing old remote tables may remain in Supabase until a dedicated drop migration, but the current app/package runtime must not consume them.

## Current State

Local generation produces `final-result.json` RenderTree artifacts. The Web read path no longer consumes local `data/tables/*.json`, and the old smoke `final-result.json -> data/tables` apply command has been retired.

`apps/web/src/lib/screen-sources.ts` now reads DB-backed screen summaries and RenderTree nodes through `apps/web/src/lib/screen-db-loader.ts`.

Current Web/Puck/Workbench runtime consumers read through the screen DB facade and `render_*` tables only. No app/package runtime path should read `screen_routes`, `screen_variants`, `organisms`, or `component_renderer_kinds`.

The new Supabase relational read model has these tables:

```text
render_screen_routes
render_screen_variants
render_screens
render_screen_regions
render_screen_region_children
render_areas
render_area_children
render_components
render_component_children
```

The current migration snapshot can still refresh `render_*` tables from existing local `data/tables/*.json` with:

```bash
npm run render-db:push-tables -- --write
```

## Implementation Status

| Phase | Status | Evidence |
|---|---|---|
| Table adapter row API | Implemented | `materializeRenderScreenFromRows()` in `@cx/adapters/table` |
| Supabase REST loader | Implemented | `apps/web/src/lib/screen-db-loader.ts` |
| REST loader regression test | Implemented | `apps/web/src/lib/screen-db-loader.test.ts` |
| Web source switch | Implemented | `apps/web/src/lib/screen-sources.ts` is DB-only |
| API route facade | Implemented | `/api/screens/*` routes |
| Workbench read path | Implemented through Web screen source | Workbench consumes `ScreenSummary.renderTree` from the selected source |
| Puck dependency | Implemented | `@measured/puck` restored in `apps/web` workspace for compatibility with the remote prototype |
| Puck RenderTree adapter | Implemented | `@cx/adapters/puck` with reorder-only tests |
| Puck editor runtime binding | Implemented for screen and area MVP | `PCK` opens `ScreenPuckEditor`; `ARE` opens `AreaPuckEditor` for the selected screen's first area |
| Puck props editing | Implemented for JSON props MVP | Puck item `nodePropsJson` updates RenderTree node `props` with invalid JSON diagnostics |
| Puck save/apply path | Implemented for reorder and props MVP | `PUT /api/screens/:screenId/tree` replaces region/area child order and component child props from a RenderTree candidate |
| Web local-table retirement | Implemented | Web `SCREEN_SOURCE` fallback and `/api/smoke-runs/apply` local table writer removed |
| Smoke local-table apply retirement | Implemented | `smoke:apply-tables`, the legacy smoke apply CLI, and `@cx/pipeline/apply` removed |
| Old remote table consumer removal | Implemented | Runtime search shows no app/package consumer of `screen_routes`, `screen_variants`, `organisms`, or `component_renderer_kinds` |
| Direct smoke RenderTree DB apply | Pending | Needed to promote accepted `final-result.json` without local table JSON |
| Old Supabase table retirement | Pending | Table drop remains a separate migration/commit after schema retention is approved |

## Non-Goals

- Do not drop old Puck/Web tables in the same change as consumer removal.
- Do not let `@cx/adapters/table` call Supabase or perform file IO.
- Do not put layout recommendation, component catalog ownership, or validation policy in the loader.
- Do not hide parent-child ordering in JSONB.

## Target Responsibilities

| Layer | Responsibility |
|---|---|
| Supabase `render_*` tables | Persist accepted screen read model rows |
| REST loader | Fetch and group relational rows for one route, screen list, or screen tree |
| `@cx/adapters/table` | Purely rebuild `RenderTreeScreenNode` from row sets |
| Web/Puck/Workbench | Request screen lists and render trees, then render/edit them |
| `@cx/renderer` | Render the final RenderTree JSON only |

## Phase 1 - Materializer Row API

Add a new row-based public API for the relational DB read model.

```ts
materializeRenderScreenFromRows(input): MaterializeRenderScreenResult
```

Suggested input:

```ts
type MaterializeRenderScreenFromRowsInput = {
  screenId: string;
  rows: RenderReadModelRows;
};

type RenderReadModelRows = {
  screens: RenderScreenRow[];
  screenRegions: RenderScreenRegionRow[];
  screenRegionChildren: RenderScreenRegionChildRow[];
  areas: RenderAreaRow[];
  areaChildren: RenderAreaChildRow[];
  components: RenderComponentRow[];
  componentChildren: RenderComponentChildRow[];
};
```

Suggested output:

```ts
type MaterializeRenderScreenResult = {
  node?: RenderTreeScreenNodeContract;
  diagnostics: MaterializeDiagnostic[];
};
```

Diagnostics should report missing or invalid references instead of silently dropping nodes.

```ts
type MaterializeDiagnostic = {
  code:
    | "missing_screen"
    | "missing_region"
    | "missing_area"
    | "missing_component"
    | "duplicate_region"
    | "invalid_child_order";
  id: string;
  parentId?: string;
  severity: "error" | "warning";
};
```

Materialization order:

```text
render_screens
-> render_screen_regions by screen_id
-> render_screen_region_children by screen_region_id, order_index
-> render_areas by area_id
-> render_area_children by area_id, order_index
-> render_components by component_id
-> render_component_children by component_id, order_index
-> RenderTreeScreenNode
```

Mapping rules:

| DB row | RenderTree node |
|---|---|
| `render_screens.type = page` | `type: "Screen"` |
| `render_screen_regions.type = header` | `type: "Screen.Header"` |
| `render_screen_regions.type = contents` | `type: "Screen.Contents"` |
| `render_screen_regions.type = bottom` | `type: "Screen.Bottom"` |
| `render_areas.type = area_static` | `type: "area.static"` |
| `render_areas.type = area_dynamic` | `type: "area.dynamic"` |
| `render_components.type` | composite/component wrapper node type |
| `render_component_children.catalog_component_type` | catalog component node type |

Acceptance checks:

```bash
npm test -- --run packages/adapters/src/__tests__/table-to-render-tree.test.ts
npx tsc --noEmit --pretty false --incremental false
```

## Naming Rule

The current Supabase tables use the temporary `render_*` prefix. Code directory,
file, function, and API route names should not depend on that prefix because it
is expected to be removed later.

Use neutral screen read-model names:

| Temporary table prefix | Stable code/API naming |
|---|---|
| `render_*` tables | `screen-db`, `screen rows`, `screen tree` |
| `render-db-loader.ts` | `screen-db-loader.ts` |
| `/api/render/*` | `/api/screens/*` |

## Phase 2 - Supabase REST Loader

Create a Web-owned loader first. Move it to a shared package only after API shape stabilizes.

Suggested location:

```text
apps/web/src/lib/screen-db-loader.ts
```

The loader should expose small query functions:

```ts
listScreenRoutes(): Promise<ScreenRouteSummary[]>
listScreens(routeId?: string): Promise<ScreenSummary[]>
loadScreenRows(screenId: string): Promise<RenderReadModelRows>
loadScreenTree(screenId: string): Promise<MaterializeRenderScreenResult>
```

The loader may call Supabase REST/PostgREST. It should not import React.

For one screen tree, fetch:

```text
render_screens?id=eq.{screenId}
render_screen_regions?screen_id=eq.{screenId}
render_screen_region_children?screen_region_id=in.(...)
render_areas?id=in.(...)
render_area_children?area_id=in.(...)
render_components?id=in.(...)
render_component_children?component_id=in.(...)
```

Keep fetch order explicit:

```text
screen
-> regions
-> region children
-> areas
-> area children
-> components
-> component children
-> materialize
```

The loader should return typed rows, not RenderTree, except in the convenience `loadScreenTree()` function.

Acceptance checks:

- `loadScreenRows(screenId)` returns all rows needed for one screen.
- `loadScreenTree(screenId)` returns a renderable `RenderTreeScreenNode`.
- Missing references surface as diagnostics.
- The loader never mutates old tables.

## Phase 3 - Web Screen Source Switch

Update `apps/web/src/lib/screen-sources.ts` to use the DB-backed loader as the only active Web screen source:

```text
screen rail
-> listScreenRoutes/listScreens
preview
-> loadScreenTree
```

This allows Web to verify the DB path without removing the old path.

Acceptance checks:

- Web rail lists screens from `render_*`.
- Preview renders at least one known screen from DB.
- Web no longer imports local `data/tables/*.json` loaders or local table materializers.

## Phase 4 - Puck / Workbench Binding

After the Web preview works from DB, connect Puck and Workbench to the same loader surface.

Recommended read shape:

```text
GET screen list
GET screen tree
GET raw rows for debugging
```

Editing should not directly mutate every relational table in MVP. Prefer this order:

```text
read render tree
-> edit in Puck/Workbench
-> produce RenderTree candidate
-> apply/decompose RenderTree to render_* rows through one command/API
```

This keeps the table decomposition responsibility centralized.

Acceptance checks:

- Puck can load a DB-backed screen.
- Workbench preview can load the same DB-backed screen.
- Save/apply path is explicit and does not partially update child tables.

### Puck Adapter Direction

The Puck migration should be adapter-based.

```text
RenderTreeScreenNode
-> Puck adapter
-> Puck editor data/config
-> Puck adapter
-> RenderTreeScreenNode candidate
-> apply/decompose to screen DB rows
```

Puck should not own the screen data model. It should edit a temporary editor
view model derived from RenderTree.

Recommended packages/files:

```text
packages/adapters/src/puck/index.ts
apps/web/src/components/puck/ScreenPuckEditor.tsx
apps/web/src/components/puck/AreaPuckEditor.tsx
```

The adapter owns all Puck-specific shape conversions.

```ts
type PuckScreenData = {
  content: Array<{
    type: string;
    props: {
      nodeId: string;
    };
  }>;
  root: { props: Record<string, never> };
  zones: Record<string, never>;
};

renderTreeToPuckScreenData(screen: RenderTreeScreenNode): PuckScreenData
puckScreenDataToRenderTree(input): RenderTreeScreenNode
```

Adapter rules:

- Screen-level Puck edits reorder area nodes inside `Screen.Contents`.
- Area-level Puck edits reorder component children inside one area node.
- Puck item `type` should be a stable node id, not a DB table name.
- Puck `props.nodeId` should preserve the RenderTree node id.
- The adapter should not call Supabase.
- The adapter should not call `@cx/renderer`.
- The adapter should not mutate the original RenderTree in place.
- Save should produce a full RenderTree candidate.

The first MVP can support reorder-only editing.

```text
MVP scope:
  Screen.Contents area order
  Area child component order

Later:
  prop editing
  add/remove area
  add/remove component
  variant selection
  field-level validation
```

### Why Adapter Instead Of Direct Puck Model

Directly making Puck consume DB rows would couple the editor to temporary
`render_*` table names and child-table details. Directly making Puck consume
RenderTree without an adapter would spread Puck-specific `Data` and `Config`
objects through the app.

The adapter keeps boundaries clear:

| Boundary | Owns |
|---|---|
| `screen-db-loader.ts` | DB rows and REST fetch |
| `@cx/adapters/table` | DB rows -> RenderTree |
| `@cx/adapters/puck` | RenderTree <-> Puck data |
| Puck components | Editor UI only |
| apply/decompose command/API | RenderTree candidate -> DB rows |

### Remote Puck Migration Notes

`origin/main` already contains a Puck prototype, but it should be ported
selectively.

Useful source files:

```text
origin/main:apps/web/src/components/App.tsx
origin/main:apps/web/src/components/screen/puck-config.tsx
origin/main:apps/web/src/components/area/area-puck-config.tsx
origin/main:apps/web/src/components/layout/Canvas.tsx
origin/main:apps/web/src/components/layout/RightAside.tsx
origin/main:apps/web/src/model/store.ts
```

Do not copy these files directly over the current branch. The remote prototype
uses older `AppScreen`, `AppArea`, `tables-to-render-tree`, and store contracts.
The current branch should keep `ScreenSummary`, `RenderTreeScreenNode`,
`screen-db-loader.ts`, and `/api/screens/*` as the read path.

Also note that the remote prototype uses `useMemo`. Current project policy
forbids default `useMemo`/`useCallback`, so the port should compute small
Puck config/data objects directly or move heavier transforms into pure adapter
helpers outside React render.

### Puck Migration Sequence

1. Add `@measured/puck` dependency back to `apps/web`. Done.
2. Add `@cx/adapters/puck` with reorder-only conversion tests. Done.
3. Add `ScreenPuckEditor` that receives a `RenderTreeScreenNode`. Done.
4. Add `AreaPuckEditor` that receives one area node. Done and routed through the `ARE` Workbench tab.
5. Add editor UI behind a feature flag or tab so current preview remains stable. Done with `PCK` Workbench tab.
6. On edit, emit a full RenderTree candidate in memory. Done for screen-level reorder and area-level component props/order editing.
7. Add an explicit save/apply path that decomposes the candidate into screen DB rows. Done for child relations and component child props.
8. Old Puck table/store consumer contracts have been removed from the current app/package runtime; keep any old DB table drop as a separate migration decision.

## Phase 5 - API Route Facade

Once loader behavior is stable, expose app-level REST endpoints.

Suggested Next.js API routes:

```text
GET /api/screens/routes
GET /api/screens
GET /api/screens/:screenId/rows
GET /api/screens/:screenId/tree
```

Route responsibilities:

| Endpoint | Responsibility |
|---|---|
| `/api/screens/routes` | Navigation rail grouping |
| `/api/screens` | Screen list and metadata |
| `/api/screens/:screenId/rows` | Debug and workbench raw row bundle |
| `/api/screens/:screenId/tree` | Renderer-ready RenderTree JSON |

The `/tree` endpoint may call `@cx/adapters/table`.

Do not expose Supabase service-role credentials to the browser.

## Phase 6 - Old API/Table Retirement

Remove old API and old table dependency in three steps: Web local-table runtime first, old remote Supabase consumers second, then old remote Supabase tables in a separate migration.

Web local-table runtime checklist:

```bash
rg -n "smoke-runs/apply|applySmokeRunToTables|smoke-apply|SCREEN_SOURCE|local-table" apps/web/src packages/adapters/src
rg -n "materializeTableScreen|materializeTableScreens" apps/web/src packages/adapters/src
```

Safe removal criteria:

- Web rail uses `render_*`.
- Web preview uses `loadScreenTree()`.
- Puck loads screen data from the screen DB facade.
- Workbench loads screen data from the screen DB facade.
- Smoke apply still writes local tables only as an intermediate or has a screen DB apply path.
- No runtime path depends on `organisms`.
- No runtime path depends on `screen_routes`, `screen_variants`, `organisms`, or `component_renderer_kinds`.

After Web local-table retirement:

```text
remove Web local loader code
remove Web local apply API endpoints
remove old local-table materializer public API
archive Web local-table-only compatibility docs
plan old table drop migration separately
```

Old remote consumer retirement checklist:

```bash
rg -n "(^|[^A-Za-z0-9_])(screen_routes|screen_variants|organisms|component_renderer_kinds)([^A-Za-z0-9_]|$)" apps packages scripts --glob '!**/*.test.ts' --glob '!**/*.test.tsx' --glob '!scripts/push-render-db.ts'
rg -n "from\\(\\s*['\\\"](screen_routes|screen_variants|screens|organisms|components|component_renderer_kinds)['\\\"]|/rest/v1/(screen_routes|screen_variants|screens|organisms|components|component_renderer_kinds)" apps packages scripts
```

The expected runtime result is no matches for old table consumers. Matches for `render_screen_routes`, `render_screen_variants`, `render_screens`, and `render_components` are allowed because they are part of the new relational read model.
`scripts/push-render-db.ts` may still mention `screen_routes.json` and `screen_variants.json` as local source filenames for the temporary migration snapshot; that is not an old remote Supabase table consumer.

Old remote Supabase table drop should be a separate migration and a separate commit after this checklist passes and the team confirms the old schema no longer needs historical retention.

## Recommended Implementation Order

1. Add `RenderReadModelRows` and row types to `@cx/adapters/table`.
2. Add `materializeRenderScreenFromRows()` with diagnostics.
3. Add tests using rows projected from current `data/tables`.
4. Add `apps/web/src/lib/screen-db-loader.ts`.
5. Add a smoke test or script that loads one DB screen and materializes it.
6. Move Web `screen-sources.ts` to the DB loader.
7. Verify Web rail and preview.
8. Bind Puck/Workbench to the same facade.
9. Remove Web local-table API and materializer compatibility after `rg` confirms no live Web dependency remains.
10. Remove old remote Supabase consumers and record the `rg` evidence.
11. Keep old remote Supabase table retirement as a later migration.

## Expected Effects

When this transition is complete, the project should gain these effects.

| Area | Expected effect |
|---|---|
| Source of truth | Accepted local inference results can be registered in DB and read back as the active screen source |
| Rendering | Web, Puck, and Workbench can all consume the same DB-backed screen tree |
| Debuggability | Missing area/component references surface as materializer diagnostics instead of blank UI |
| Migration safety | Old Puck/Web tables can stay alive until every live consumer moves |
| API clarity | Browser-facing routes use stable `/api/screens/*` names instead of temporary table prefixes |
| Future rename safety | Removing the `render_*` DB prefix later should not force directory/API renames |
| Testability | Materialization can be tested as a pure function with row fixtures |

The most important behavioral change is this:

```text
Before:
  local table JSON
  -> silent child drops possible
  -> Web preview

After:
  screen DB rows
  -> materializer diagnostics
  -> screen tree API
  -> Web/Puck/Workbench preview
```

## Success Criteria

The transition is successful only when all criteria below are satisfied.

### Materializer

- `materializeRenderScreenFromRows()` is exported from `@cx/adapters/table`.
- It accepts `RenderReadModelRows` without file IO or Supabase calls.
- It returns `RenderTreeScreenNodeContract` plus diagnostics.
- It preserves `header`, `contents`, and `bottom` region order.
- It preserves child order through `order_index`.
- It does not silently drop missing areas or components.
- It supports multiple `componentChildren` per component.
- The old local-table materializer API is not exported from `@cx/adapters/table`.

### REST Loader

- `apps/web/src/lib/screen-db-loader.ts` exists.
- `apps/web/src/lib/screen-db-loader.test.ts` covers route listing, screen listing, row loading, tree materialization, and empty-parent fetch behavior.
- The loader reads Supabase credentials only on the server side.
- `listScreenRoutes()` returns navigation rail data.
- `listScreens()` returns screen summaries.
- `loadScreenRows(screenId)` returns a complete row bundle for one screen.
- `loadScreenTree(screenId)` calls the materializer and returns tree plus diagnostics.
- The loader does not mutate old tables.

### API Routes

- `GET /api/screens/routes` returns route groups.
- `GET /api/screens` returns screen summaries.
- `GET /api/screens/:screenId/rows` returns raw row bundles for debugging.
- `GET /api/screens/:screenId/tree` returns renderer-ready RenderTree JSON.
- API routes do not expose service-role credentials to the browser.
- Error responses include diagnostic context without leaking secrets.

### Web / Puck / Workbench

- Web loads rail and preview data from DB without a `SCREEN_SOURCE` fallback.
- At least one known MBR screen renders from `/api/screens/:screenId/tree`.
- Puck can load a DB-backed screen without using old table APIs.
- Workbench can inspect raw rows and preview the materialized screen tree.
- `/api/smoke-runs/apply` is removed from Web; local smoke table apply remains a CLI-only migration/prototype utility.

### Retirement

- Web local-table retirement is complete only when these searches show no Web runtime dependency:

```bash
rg -n "smoke-runs/apply|applySmokeRunToTables|smoke-apply|SCREEN_SOURCE|local-table" apps/web/src packages/adapters/src
rg -n "materializeTableScreen|materializeTableScreens" apps/web/src packages/adapters/src
```

- Old remote table consumer removal is complete only when the old table consumer searches return no app/package runtime matches.
- Old remote table drop remains separate and must wait for an explicit drop migration decision.

## Execution Sequence

Use this order to keep the migration small and reversible.

1. **Freeze current DB contract**
   - Keep `docs/development/DB_SCHEMA.dbml` as the current schema reference.
   - Keep old Puck/Web tables alive while runtime consumers move.
   - Keep `render_*` table prefix as DB-only temporary naming.

2. **Add materializer row types**
   - Add row types matching the relational DB shape.
   - Add diagnostics types.
   - Do not change Web yet.

3. **Implement row materialization**
   - Add `materializeRenderScreenFromRows()`.
   - Reuse helper logic where possible.
   - Replace silent child drops with diagnostics.
   - Add row-fixture tests.

4. **Add screen DB loader**
   - Create `apps/web/src/lib/screen-db-loader.ts`.
   - Fetch rows through Supabase REST/PostgREST.
   - Keep the loader server-only.
   - Add one script or test that loads a known screen and materializes it.

5. **Add `/api/screens/*` facade**
   - Add route list, screen list, rows, and tree endpoints.
   - Keep responses small and explicit.
   - Include diagnostics in `/tree` responses.

6. **Move Web source to DB**
   - Point `screen-sources.ts` directly to the DB loader.
   - Keep `SCREEN_SOURCE` fallback removed after DB path is verified.
   - Remove Web-only local table apply routes.

7. **Move Puck and Workbench reads**
   - Point both tools to the same screen DB facade.
   - Keep save/apply as a separate explicit operation.
   - Avoid partial child-table writes from the editor.

8. **Promote DB path to only Web path**
   - Keep `scripts/*` CLI utilities for generation and DB push.
   - Remove Web runtime imports that read or write `data/tables`.

9. **Retire old remote path**
   - Run dependency searches.
   - Remove old remote Puck/Web consumers.
   - Plan old Supabase table drop separately.

## Risks And Preventive Measures

| Risk | Impact | Preventive measure |
|---|---|---|
| Materializer silently drops missing DB refs | Blank screen sections are hard to debug | Return diagnostics for every missing area/component and show them in debug UI |
| REST loader fetches incomplete row bundles | RenderTree is partial or inconsistent | Fetch in explicit parent-to-child order and assert required row counts |
| Browser receives Supabase service-role key | Security incident | Keep Supabase calls in server-only loader/API routes and never expose env values |
| API names inherit temporary `render_*` prefix | Future prefix removal causes code churn | Use `screen-db-loader.ts` and `/api/screens/*`; keep DB table names isolated in the loader |
| Old remote Puck/Web path breaks during migration | Existing remote UI becomes unusable | Move consumers to the screen DB facade before planning old table drop |
| Editor writes partial relational rows | DB child order or FK graph becomes inconsistent | Editor should save RenderTree candidate, then use one apply/decompose command/API |
| `order_index` is missing or duplicated | Child order changes unexpectedly | Materializer should sort by `order_index` and emit `invalid_child_order` diagnostics |
| DB schema and DBML drift | Loader and materializer use stale assumptions | Update `DB_SCHEMA.dbml` with every migration and add row-fixture tests |
| Component catalog type mismatches | Renderer cannot map component nodes | Validate `catalog_component_type` against `@cx/components/catalog` before promotion |
| API response grows too large | Web preview slows down | Provide `/rows` for debugging and `/tree` for normal rendering; avoid route-wide tree payloads |
| Old API removal happens too early | Puck/Web regressions | Require `rg` dependency checks and manual Web/Puck verification before deletion |

## Open Questions

- Should API routes live in Next.js first, or should FastAPI own the long-term read facade?
- Should `render_components.display` and `render_components.hooks` be passed through as node props, metadata, or raw extension fields?
- Should `loadScreenRows()` fetch by `screen_id` only, or also support `route_id` and `variant_id` batch loading?
- Should the materializer return partial trees with diagnostics, or fail closed when any required child is missing?
- Where should the active Puck runtime live? The current repo has no Puck module to bind to `/api/screens/*`.
