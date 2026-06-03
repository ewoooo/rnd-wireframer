# Puck Edit Sidebar Implementation Plan

## Goal

Implement Puck-powered editing without building a custom drag-and-drop editor.

The target editor shape is:

```text
AppShell
├─ NavigationSidebar
├─ NavigationRoutes
├─ ScreenCanvas
│  └─ Puck preview and built-in DnD surface
└─ EditSidebar
   ├─ Property controls
   └─ Block catalog controls
```

`InspectionPanel` is retired. `EditSidebar` replaces it as the right-side workbench panel.

The editor must use Puck as the edit engine, while preserving the current RenderTree and DB
relation-table lifecycle.

```text
DB rows
-> loader
-> RenderTree
-> Puck data/config
-> Puck array/props edits
-> Puck onChange
-> RenderTree candidate
-> PUT /api/screens/:screenId/tree
-> relation-table projection
```

Data ownership rule:

```text
Puck
  Owns transient edit UI state only:
  - children/content array order
  - item inclusion/exclusion inside the active edit scope
  - selected item field/prop edits

RenderTree
  Owns the save candidate:
  - mounted nodes are present in children[]
  - unmounted nodes are absent from children[]
  - props are already applied to nodes

DB projection
  Consumes RenderTree only:
  - projects included nodes to relation rows
  - computes order_index from children[] index
  - preserves row ids through metadata.instanceId when available
```

Do not define mount/unmount as DB insert/delete inside the Puck adapter. Actual DB row removal is a
separate persistence concern and can be added as an explicit save/projection feature.

## Non-Negotiable Decisions

1. Do not implement a custom DnD system.
2. Remove the right-side `InspectionPanel`.
3. Add a right-side `EditSidebar` component.
4. Implement reorder through Puck block movement actions, not manual array mutation in React UI.
5. Make `ScreenCanvas` accept Puck's editing preview.
6. Reuse validated ideas from prior remote Puck commits, but do not restore the old persistence model.

## Current Baseline

Current branch baseline after rollback:

```text
AppShell
├─ NavigationSidebar
├─ NavigationRoutes
├─ Canvas
│  ├─ ScreenPuckEditor
│  ├─ AreaPuckEditor
│  └─ RenderedScreen
└─ InspectionPanel
```

Existing useful pieces:

- `ScreenPuckEditor` already converts screen RenderTree to Puck data.
- `AreaPuckEditor` already converts area RenderTree to Puck data.
- `@cx/adapters/puck` already exposes:
  - `renderTreeToPuckScreenData`
  - `applyPuckScreenData`
  - `renderTreeToPuckAreaData`
  - `applyPuckAreaData`
  - `renderTreeToPuckComponentData`
  - `applyPuckComponentData`
- `/api/screens/:screenId/tree` already saves whole-screen RenderTree candidates.
- `screen-db-save.ts` already projects RenderTree to relation rows.
- The save path currently uses delete + insert while preserving existing relation ids where possible.

Current limitation:

- `InspectionPanel` is not Puck-aware.
- A sidebar outside a Puck provider cannot call `usePuck()`.
- `ScreenPuckEditor` and `AreaPuckEditor` currently own their Puck instances inside Canvas.
- Screen-level Puck data is mostly `Screen.Contents` oriented and must be expanded to support
  `Header / Contents / Bottom` zones.

## Prior Remote Flow To Reuse

Remote history includes an older Puck implementation that validated important interaction flows.

Relevant commits:

```text
e0e6e28 feat: create common layout for entire page
a38fd1a feat: applying Puck editor in Area page for editing
42903f0 feat: saving function for Area Page
```

Validated ideas from those commits:

- Puck can wrap a workbench editing shell and provide edit context.
- `Puck.Fields` can serve as a right-side property surface.
- `Puck.Components` can serve as a mountable block/library surface.
- `drawerItem` override can show preview tooltips for library blocks.
- `onChange(data)` can be the single source for edit-state-to-app-candidate conversion.
- Screen-level area reorder can be derived from Puck content order.
- Area-level component reorder can be derived from Puck content order.
- Unmount can be represented by an existing child missing from next Puck content.
- Mount can be represented by a child present in next Puck content without an existing relation binding.
- Inserted children should be materialized from a catalog/template map.

Prior files worth referencing:

```text
apps/web/src/components/App.tsx
  Puck onChange -> reorderScreenAreas / reorderAreaChildren

apps/web/src/model/store.ts
  reorderWorkbenchScreenAreas
  reorderWorkbenchAreaChildren
  rebuildAreaContainers
  buildAreaComponentCatalog

apps/web/src/components/screen/puck-config.tsx
  buildPuckConfig
  buildPuckData
  buildPuckOverrides

apps/web/src/components/area/area-puck-config.tsx
  buildAreaPuckConfig
  buildAreaPuckData

apps/web/src/components/layout/RightAside.tsx
  Puck.Fields
  Puck.Components
```

## Prior Feature Coverage Plan

The goal is to re-implement the useful Puck features from prior remote commits in the current
relation-aware architecture.

| # | Prior Puck feature | Prior implementation | Current-system improvement | Covered by |
|---|---|---|---|---|
| 1 | Workbench-wide Puck provider | `App.tsx` directly wrapped `Rail / LeftAside / Canvas / RightAside` with `<Puck>` | `AppShell` directly owns `<Puck>` during edit modes; no separate `PuckEditShell`; config/data/onChange use RenderTree adapters | Phase 3 |
| 2 | Canvas as Puck editing preview | `Canvas` rendered inside the Puck provider | Central `ScreenCanvas` renders `Puck.Preview` in edit modes and `RenderedScreen` in normal preview mode | Phase 4 |
| 3 | Right properties panel with `Puck.Fields` | `RightAside` rendered `<Puck.Fields />` | Use as top `PropertyPanel` in the first expected layout | Phase 5 |
| 4 | Right block library with `Puck.Components` | `RightAside` rendered `<Puck.Components />` as Area/Component List | Bottom `BlockCatalogPanel` uses `Puck.Components` or catalog-backed Puck-native block library by edit level | Phase 6, Phase 8 |
| 5 | Drawer item preview tooltip | `drawerItem` override rendered preview tooltip | Reuse as catalog preview affordance without making catalog items unprojectable placeholders | Phase 8 |
| 6 | Screen-level area reorder | `onChange(data)` read `data.content.map(item.type)` and called `reorderScreenAreas` | Puck built-in block DnD updates Puck data; adapter uses item ids to reorder RenderTree children | Phase 5, Phase 7 |
| 7 | Area-level component reorder | `onChange(data)` read area child order and called `reorderAreaChildren` | Same Puck DnD/data lifecycle, but relation ids and `render_area_children.order_index` are preserved through projection | Phase 9 |
| 8 | Area-level component unmount | Missing child id was omitted from rebuilt `area.children` | Missing item means the edited RenderTree children array excludes that node | Phase 12 |
| 9 | Area-level component mount | `buildAreaComponentCatalog` resolved inserted ids and cloned template nodes | `BlockCatalogPanel` + Puck insert creates a RenderTree node from the active catalog and includes it in children[] | Phase 8, Phase 12 |
| 10 | Area children persistence | `updateAreaChildren` updated `organisms.children` JSON | Do not update area JSON directly; save whole-screen RenderTree through `/api/screens/:screenId/tree` and relation projection | Phase 7, Phase 9 |
| 11 | Screen regions persistence | `updateScreenRegions` updated `screens.screen` JSON | Do not update screen JSON directly; project RenderTree candidate to `render_screen_region_children` with child instance id preservation | Phase 7 |

Coverage rule:

- Prior Puck interaction ideas are reused.
- Prior Zustand/store JSON mutation and direct JSON persistence are not reused.
- Every prior feature must pass through:

```text
Puck interaction
-> Puck data
-> @cx/adapters/puck
-> RenderTree candidate
-> /tree save
-> relation-table projection
```

Do not carry forward the old persistence model:

```text
Puck data.content
-> Zustand store mutation
-> screen.areas / organisms.children JSON rebuild
```

Use the current architecture instead:

```text
Puck data.content
-> @cx/adapters/puck
-> RenderTree candidate with relation bindings
-> PUT /api/screens/:screenId/tree
-> DB relation rows
```

Reasons:

- Relation ids must be preserved.
- N:1 component template to child-instance relationships must be supported.
- Multiple mounted instances of the same component must be distinguishable.
- Row-owned `order_index`, `props`, and `variant` must remain explicit.
- Save behavior must stay compatible with the current relation-table projection path.

## Target Architecture

### Desired Component Tree

The Puck provider should cover both `ScreenCanvas` and `EditSidebar` during edit modes.

```text
AppShell
├─ NavigationSidebar
├─ NavigationRoutes
└─ <Puck> owned directly by AppShell during edit modes
   ├─ ScreenCanvas
   │  └─ Puck preview, drop, and reorder surface
   └─ EditSidebar
      ├─ Top: PropertyPanel
      │  └─ Puck.Fields property editing surface
      └─ Bottom: BlockCatalogPanel
         └─ Puck.Components drag source / block catalog surface
```

There should be no separate `PuckEditShell` component. This follows the prior remote implementation:
the workbench root component owns `<Puck>` directly and renders the normal workbench layout as its
children.

When not in a Puck-editing mode, `AppShell` should render the normal non-Puck layout.

### Why Not Keep Puck Only Inside Canvas?

Keeping Puck only inside `ScreenPuckEditor` or `AreaPuckEditor` makes the right sidebar unable to use
Puck state/actions unless the sidebar is rendered through Puck overrides.

That can work, but it ties panel placement to Puck's internal layout. The desired product shape is:

```text
Workbench owns the layout.
Puck owns edit state and edit actions.
```

Therefore the right `EditSidebar` should be a normal workbench sidebar, but it must live inside the
same Puck provider as the preview.

### Provider Scope Rule

The Puck provider should be active only when there is a valid edit target. Screen, area, and
component views are all Puck-provider targets.

```text
screen view + selected screen tree
-> screen-region edit provider

area view + selected area
-> area edit provider

component view + selected component
-> component edit provider

non-edit preview / agent view / no edit target
-> no Puck provider, normal preview/sidebar behavior
```

This avoids leaking a stale Puck state into non-editing tabs.

## Final Target Directory Structure

This structure is a rollout migration map for the completed target. Files marked `DELETE` should not
remain after the plan is complete. Files marked `RETIRE` may exist temporarily during migration, but
must be removed once AppShell-owned Puck is fully wired.

```text
apps/web/src/components/
  workbench/
    AppShell.tsx
    navigation/
      NavigationSidebar.tsx
      NavigationRoutes.tsx
      NavigationServices.tsx
      NavigationServiceLink.tsx
      NavigationLibrary.tsx
      types.ts
    canvas/
      Canvas.tsx
      ScreenCanvas.tsx
      CanvasToolbar.tsx
      ExportToolbar.tsx
    edit-sidebar/
      EditSidebar.tsx
      EditSidebarHeader.tsx
      EditSidebarPane.tsx
      PropertyPanel.tsx
      JsonPropsField.tsx
      BlockCatalogPanel.tsx
      CatalogSection.tsx
      CatalogItem.tsx
      EmptyEditState.tsx
      types.ts
    inspector/
      InspectionPanel.tsx            # DELETE in Rollout 1
  puck/
    edit-scope.ts
    puck-edit-types.ts
    puck-edit-config.tsx
    puck-edit-data.ts
    puck-edit-adapter.ts
    puck-edit-zones.ts
    puck-catalog.ts
    puck-fields.ts
    ScreenPuckEditor.tsx             # RETIRE after AppShell owns screen-region Puck
    AreaPuckEditor.tsx               # RETIRE after AppShell owns area Puck
  screen/
    RenderedScreen.tsx
  ui/
    sidebar.tsx
    button.tsx
    collapsible.tsx
    resizable.tsx

apps/web/src/lib/
  screen-db-loader.ts
  screen-db-save.ts
  screen-sources.ts
  render-tree-instance-ids.ts

apps/web/src/model/
  workbench-view-model.ts

packages/adapters/src/
  puck/
    index.ts
    edit-scope.ts
    puck-data.ts
    apply-puck-data.ts
    catalog-materialization.ts
    diagnostics.ts
    zones.ts
    __tests__/
      puck-data.test.ts
      apply-puck-data.test.ts
      catalog-materialization.test.ts
  table/
    table-to-render-tree.ts
    render-tree-to-table.ts
    types.ts

packages/component/src/
  catalog.ts
  public/
    catalog.ts
    resolver.ts
    types.ts
    mutations.ts
    puck.ts

packages/renderer/src/
  interpreter/
    RenderTreeView.tsx
    RenderNodeView.tsx
    render-screen.tsx
    render-layout.tsx
    render-node.tsx
    render-component.tsx
  tree/
    types.ts
    runtime.ts
    bindings.ts
```

The target shape can still absorb small naming changes, but ownership should stay fixed:

- `AppShell`: owns the active edit target, Puck provider, Puck data/config, `onChange`, and save bridge.
- `ScreenCanvas`: owns the central preview surface. In edit modes it renders Puck preview; in non-edit modes it renders the normal RenderTree preview.
- `EditSidebar`: replaces `InspectionPanel` as the right workbench sidebar. Top pane is property editing, bottom pane is block catalog.
- `PropertyPanel`: hosts `Puck.Fields` for selected item props. It must not introduce button/menu reorder or custom DnD.
- `BlockCatalogPanel`: shows the active-level catalog source: region level area blocks, area level component blocks, component level primitive component catalog.
- `puck-edit-*`: owns Puck UI bridge helpers only. It should not write DB rows directly.
- `@cx/adapters/puck`: owns pure RenderTree `<->` Puck conversion and level-aware patch/apply helpers.
- `screen-db-loader.ts`: loads DB rows plus child-row identifiers/bindings into RenderTree input.
- `screen-db-save.ts`: projects the edited RenderTree candidate back into relation-table writes.
- `packages/component`: remains the primitive component catalog/property contract SSOT.
- `packages/renderer`: remains the RenderTree-to-React runtime and should not know about Puck.

### Completed-State Deletions

These files/directories should be gone when the plan is complete:

```text
apps/web/src/components/workbench/inspector/
  InspectionPanel.tsx

apps/web/src/components/puck/
  ScreenPuckEditor.tsx
  AreaPuckEditor.tsx
```

Deletion rule:

- `InspectionPanel.tsx` is deleted in Rollout 1 when `EditSidebar` becomes the right workbench panel.
- `ScreenPuckEditor.tsx` is deleted after `AppShell` owns screen-region Puck provider/config/data.
- `AreaPuckEditor.tsx` is deleted after `AppShell` owns area Puck provider/config/data.
- If compatibility wrappers are needed during rollout, mark them as temporary and do not add new
  behavior there.
- This is no longer an open design question. The completed state has no Canvas-local Puck editor
  wrappers.

### Rollout Directory Expansion

Rollout 1 adds the workbench shell and JSON props path:

```text
apps/web/src/components/workbench/edit-sidebar/
  EditSidebar.tsx
  EditSidebarHeader.tsx
  EditSidebarPane.tsx
  PropertyPanel.tsx
  JsonPropsField.tsx
  BlockCatalogPanel.tsx
  EmptyEditState.tsx
  types.ts

apps/web/src/components/puck/
  edit-scope.ts
  puck-edit-types.ts
  puck-edit-config.tsx
  puck-edit-data.ts
  puck-edit-adapter.ts
  puck-fields.ts
```

Rollout 2 adds all-scope reorder and screen-region zones:

```text
apps/web/src/components/puck/
  puck-edit-zones.ts

packages/adapters/src/puck/
  edit-scope.ts
  puck-data.ts
  apply-puck-data.ts
  zones.ts
  diagnostics.ts
  __tests__/
    puck-data.test.ts
    apply-puck-data.test.ts
```

Rollout 3 adds mount/unmount and catalog materialization:

```text
apps/web/src/components/workbench/edit-sidebar/
  CatalogSection.tsx
  CatalogItem.tsx

apps/web/src/components/puck/
  puck-catalog.ts

packages/adapters/src/puck/
  catalog-materialization.ts
  __tests__/
    catalog-materialization.test.ts

packages/component/src/public/
  puck.ts
```

Rollout 4 hardens field controls and persistence checks:

```text
apps/web/src/components/workbench/edit-sidebar/
  JsonPropsField.tsx                 # kept as fallback, not the only final field path

apps/web/src/lib/
  render-tree-instance-ids.ts

packages/adapters/src/puck/
  diagnostics.ts
```

## Edit Levels

### Region Level

Edit target:

```text
Screen.Header / Screen.Contents / Screen.Bottom children
```

Block kind:

```text
area blocks
```

DB relation target:

```text
render_screen_region_children
```

The final contract must support all three zones. `Header`, `Contents`, and `Bottom` cannot be
modeled as an afterthought because screen-region reorder, mount, and unmount must preserve the
active region boundary.

Rollout 1 may choose a default active region for smoke testing, but the adapter/config shape must
already represent region type and Puck zones so it does not become `Screen.Contents`-only.

### Area Level

Edit target:

```text
Area.children
```

Block kind:

```text
component blocks
```

DB relation target:

```text
render_area_children
```

### Component Level

Edit target:

```text
Component.children or component-as-self primitive binding
```

Block kind:

```text
primitive catalog components
```

DB relation target:

```text
render_component_children
```

Component view is also a Puck-provider target. Rollout order may defer full component mount/unmount,
but the provider scope, item contract, and adapter shape must not block component-level reorder or
JSON props editing.

## Edit Operations Matrix

The plan must cover reorder, mount, and unmount at all three edit levels.

| Edit level | Reorder | Mount | Unmount | Relation table | Catalog source |
|---|---|---|---|---|---|
| Screen-region level | Reorder area blocks inside a screen region through Puck built-in block DnD | Include an area block in region children[] from the area block catalog | Exclude an area block from region children[] | `render_screen_region_children` | DB area blocks |
| Area level | Reorder component blocks inside an area through Puck built-in block DnD | Include a component block in area children[] from the component block catalog | Exclude a component block from area children[] | `render_area_children` | DB component blocks |
| Component level | Reorder primitive child components inside a component through Puck built-in block DnD | Include a primitive component child from `@cx/components/catalog` | Exclude a primitive child from component children[] | `render_component_children` | `@cx/components/catalog` |

Operation rules:

- Reorder changes only the active scope children[] order in the edit candidate.
- Mount includes a node in the active scope children[].
- Unmount excludes a node from the active scope children[].
- Existing `metadata.instanceId` values are preserved for unchanged and reordered rows.
- New mounted nodes use temporary `metadata.instanceId` values until save returns persisted child ids.
- All operations still produce a whole-screen RenderTree candidate before persistence.

Save projection consequence:

- DB projection happens after RenderTree candidate creation.
- `order_index` is computed from the RenderTree children[] index.
- Included nodes are projected into relation rows.
- Excluded nodes are not part of the next RenderTree projection.
- Actual DB row removal/deletion is not part of the Puck mount/unmount adapter. It belongs to the
  persistence/projection save strategy.

Level-specific replacement rules:

- Screen-region edits produce a screen candidate directly.
- Area edits produce an edited area, then replace that area in the whole-screen candidate.
- Component edits produce an edited component, then replace that component in the whole-screen candidate.

## RenderTree Identity Contract

Puck should not know DB tables, DB row semantics, parent row ids, or `order_index`.

The stronger contract belongs to RenderTree. RenderTree is the save candidate and the only structure
that should be projected back into DB relation rows.

Current gap:

```text
render_screen_region_children.id -> dropped during materialization
render_area_children.id          -> dropped during materialization
render_component_children.id     -> only indirectly represented, sometimes as synthetic ids
```

Target metadata:

```ts
type RenderTreeNodeMetadata = {
  id: string;           // source id: area.id / component.id / catalog component type
  title: string;
  instanceId?: string;  // mounted child instance id: render_*_children.id
};
```

Identity rules:

- `metadata.id` keeps the source identity used by rendering and catalog/component lookup.
- `metadata.instanceId` carries the relation-child instance identity when the node was mounted from a relation row.
- Existing relation rows use their current child row id as `metadata.instanceId`.
- Newly mounted nodes may use a temporary `metadata.instanceId` until save returns a persisted child id.
- Reorder is represented only by `children[]` order.
- DB `order_index` is recalculated during save projection from the RenderTree child array.
- Parent identity is not stored on every node; parent scope is already expressed by the tree shape.

Projection rule:

```text
RenderTree node
-> metadata.id decides the source area/component/catalog reference
-> metadata.instanceId preserves the existing child relation row when available
-> child array index becomes order_index
```

## Puck Item Contract

Puck item props should stay minimal. Puck is an edit engine, not the persistence model.

```ts
type EditItemProps = {
  id: string;              // RenderTree node key for the current edit scope
  nodePropsJson?: string;
  variant?: string;
};
```

Puck rules:

- Do not use `item.type` alone as instance identity.
- Keep DB table names, DB row concepts, and `order_index` out of Puck data.
- Puck data order is the only order signal.
- Parent scope is provided by the active adapter call or Puck zone, not by item props.
- Mount materialization may add new RenderTree nodes, but DB identity is still resolved through RenderTree metadata before save.

First implementation field rule:

- Use a JSON textarea-backed field for node props.
- Store that textarea value as `nodePropsJson`.
- On Puck change, parse `nodePropsJson` and write the parsed value back to `RenderTreeNode.props`.
- Defer catalog-schema-generated controls, variant-specific controls, and polished field widgets to
  later rollout work.

## Foundation Implementation Plan

This section covers the first four logic reinforcements before Puck UI work:

1. RenderTree identity contract
2. DB rows -> RenderTree materialization
3. RenderTree -> DB projection
4. Minimal Puck data contract

These changes make RenderTree the persistence boundary and keep Puck as a thin editing engine.

### 1. RenderTree Identity Contract

Files:

```text
packages/schema/src/render-tree.ts
packages/schema/src/json-schema-registry.ts
packages/schema/src/__tests__/public-api.test.ts
```

Implementation:

```ts
export type RenderTreeNodeMetadata = RenderTreeMetadata & {
  title: string;
  instanceId?: string;
};
```

JSON Schema must allow the optional field:

```ts
renderTreeNodeMetadata: {
  type: "object",
  additionalProperties: false,
  required: ["id", "title"],
  properties: {
    id: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    instanceId: { type: "string", minLength: 1 },
    author: { type: "string" },
    createdAt: { type: "string" },
    description: { type: "string" },
    updatedAt: { type: "string" },
  },
}
```

Contract:

- `metadata.id` remains the source identity.
- `metadata.instanceId` is the mounted child instance identity.
- Renderers should ignore `metadata.instanceId`.
- DB projection should use `metadata.instanceId` only for row preservation.

Example:

```ts
const node = {
  type: "Button",
  componentVersion: "1.0.0",
  metadata: {
    id: "component-button-primary",
    instanceId: "render-area-child-123",
    title: "가입 버튼",
  },
  props: {
    children: "가입가능",
    variant: "blue",
  },
};
```

### 2. DB Rows To RenderTree Materialization

Files:

```text
packages/adapters/src/table/table-to-render-tree.ts
packages/adapters/src/__tests__/table-to-render-tree.test.ts
apps/web/src/lib/screen-db-loader.test.ts
```

Materialization must preserve child relation ids in `metadata.instanceId`.

Screen-region children:

```ts
function materializeRegionChildren(regionId: string, indexes: RowIndexes) {
  const children = indexes.regionChildrenByRegionId.get(regionId) ?? [];
  return children.flatMap((child) => {
    const area = indexes.areasById.get(child.area_id);
    if (!area) return [];

    return [
      materializeArea({
        area,
        instanceId: child.id,
        indexes,
      }),
    ];
  });
}
```

Area children:

```ts
function materializeArea(input: {
  area: RenderAreaRow;
  instanceId?: string;
  indexes: RowIndexes;
}): MaterializedRenderTreeNode {
  const childRows = input.indexes.areaChildrenByAreaId.get(input.area.id) ?? [];

  return {
    type: readAreaNodeType(input.area.type),
    componentVersion: input.area.version ?? "1.0.0",
    metadata: {
      id: input.area.id,
      instanceId: input.instanceId,
      title: input.area.name,
    },
    children: childRows.flatMap((child) => {
      const component = input.indexes.componentsById.get(child.component_id);
      if (!component) return [];
      return [
        materializeComponent({
          component,
          instanceId: child.id,
          indexes: input.indexes,
        }),
      ];
    }),
  };
}
```

Component children:

```ts
function materializeComponentChild(input: {
  child: RenderComponentChildRow;
  version: string;
}): MaterializedRenderTreeNode {
  return {
    type: input.child.catalog_component_type,
    componentVersion: input.version,
    metadata: {
      id: input.child.catalog_component_type,
      instanceId: input.child.id,
      title: input.child.catalog_component_type,
    },
    props: materializeComponentChildProps(input.child),
  };
}
```

Validation:

- A loaded area mounted through `render_screen_region_children.id = "region-child-a"` has `metadata.instanceId = "region-child-a"`.
- A loaded component mounted through `render_area_children.id = "area-child-a"` has `metadata.instanceId = "area-child-a"`.
- Primitive component children preserve `render_component_children.id`.

### 3. RenderTree To DB Projection

Files:

```text
apps/web/src/lib/screen-db-save.ts
apps/web/src/lib/screen-db-save.test.ts
```

Projection should prefer `metadata.instanceId` over parent/source tuple matching.

Screen-region projection:

```ts
for (const [index, child] of regionNode.children.entries()) {
  screenRegionChildren.push({
    area_id: child.metadata.id,
    ...withRowId(readPersistedInstanceId(child.metadata.instanceId)),
    order_index: index,
    screen_region_id: region.id,
  });
}
```

Area-child projection:

```ts
for (const [index, child] of area.children.entries()) {
  areaChildren.push({
    area_id: area.metadata.id,
    component_id: child.metadata.id,
    ...withRowId(readPersistedInstanceId(child.metadata.instanceId)),
    order_index: index,
  });
}
```

Component-child projection:

```ts
return childNodes.map((child, index) => ({
  catalog_component_type: child.metadata.id,
  component_id: node.metadata.id,
  ...withRowId(readPersistedInstanceId(child.metadata.instanceId)),
  order_index: index,
  props: child.props ?? null,
  variant: readVariant(child.props),
}));
```

Temporary ids should not be reinserted as persisted ids:

```ts
function readPersistedInstanceId(instanceId: string | undefined): string | undefined {
  if (!instanceId) return undefined;
  if (instanceId.startsWith("tmp:")) return undefined;
  return instanceId;
}
```

Fallback rule:

- For existing legacy RenderTree nodes without `metadata.instanceId`, projection may keep the current tuple-based fallback temporarily.
- After loader/materializer is upgraded, new edit/save flows should preserve rows by `metadata.instanceId`.

Validation:

- Reordering two nodes with different `metadata.instanceId` values preserves their row ids.
- Reordering two nodes with the same `metadata.id` still preserves the correct row ids.
- New nodes with `tmp:*` instance ids are treated as newly included RenderTree nodes during projection.
- `order_index` is always derived from the array index at projection time.

### 4. Minimal Puck Data Contract

Files:

```text
packages/adapters/src/puck/index.ts
packages/adapters/src/__tests__/puck.test.ts
apps/web/src/components/puck/ScreenPuckEditor.tsx
apps/web/src/components/puck/AreaPuckEditor.tsx
```

Puck item props should not carry DB row ids, table names, parent ids, or order indexes.

Target type:

```ts
export type PuckScreenItem = {
  type: string;
  props: {
    id: string;
    nodePropsJson?: string;
    title?: string;
    variant?: string;
  };
};
```

Build Puck data from RenderTree:

```ts
function createPuckData(children: RenderTreeNodeContract[]): PuckScreenData {
  return {
    content: children.map((child) => ({
      type: child.type,
      props: {
        id: child.metadata.instanceId ?? child.metadata.id,
        nodePropsJson: stringifyNodeProps(child.props),
        title: child.metadata.title,
      },
    })),
    root: { props: {} },
    zones: {},
  };
}
```

Apply Puck data back to RenderTree:

```ts
function reorderChildren(input: {
  children: RenderTreeNodeContract[];
  items: PuckScreenItem[];
}) {
  const childByPuckId = new Map(
    input.children.map((child) => [readPuckNodeId(child), child]),
  );

  return input.items.flatMap((item) => {
    const child = childByPuckId.get(item.props.id);
    if (!child) return [];
    return [applyPuckItemToNode(child, item)];
  });
}

function readPuckNodeId(node: RenderTreeNodeContract): string {
  return node.metadata.instanceId ?? node.metadata.id;
}
```

Validation:

- Puck adapter tests should fail if `relationId`, `orderIndex`, `parentId`, or DB table names appear in Puck item props.
- Reorder should still work using only `props.id`.
- Existing `metadata.instanceId` values should survive Puck roundtrip through the cloned RenderTree nodes.

## Puck Adapter And Edit Scope Plan

This section covers the next three logic decisions:

5. Puck data `<->` RenderTree adapter logic
6. Initial edit scope strategy
7. View-based edit scope branching

### 5. Puck Data To RenderTree Adapter

The adapter should convert between the current edit scope's RenderTree children and Puck data.

It should not know DB table names. It should not calculate `order_index`. It should only produce a
RenderTree candidate.

Core helper:

```ts
function readPuckNodeId(node: RenderTreeNodeContract): string {
  return node.metadata.instanceId ?? node.metadata.id;
}
```

RenderTree children -> Puck data:

```ts
function renderTreeChildrenToPuckData(
  children: RenderTreeNodeContract[],
): PuckScreenData {
  return {
    content: children.map((child) => ({
      type: child.type,
      props: {
        id: readPuckNodeId(child),
        nodePropsJson: stringifyNodeProps(child.props),
        title: child.metadata.title,
        variant: readVariantFromProps(child.props),
      },
    })),
    root: { props: {} },
    zones: {},
  };
}
```

Puck data -> reordered RenderTree children:

```ts
function applyPuckItemsToChildren(input: {
  children: RenderTreeNodeContract[];
  items: PuckScreenItem[];
}): {
  children: RenderTreeNodeContract[];
  diagnostics: PuckAdapterDiagnostic[];
} {
  const diagnostics: PuckAdapterDiagnostic[] = [];
  const childByPuckId = new Map(
    input.children.map((child) => [readPuckNodeId(child), child]),
  );
  const consumedIds = new Set<string>();
  const nextChildren: RenderTreeNodeContract[] = [];

  for (const item of input.items) {
    const itemId = item.props.id;
    if (consumedIds.has(itemId)) {
      diagnostics.push({ code: "duplicate_node", id: itemId, severity: "warning" });
      continue;
    }

    const child = childByPuckId.get(itemId);
    if (!child) {
      diagnostics.push({ code: "unknown_node", id: itemId, severity: "warning" });
      continue;
    }

    consumedIds.add(itemId);
    nextChildren.push(applyPuckItemToNode(child, item, diagnostics));
  }

  return { children: nextChildren, diagnostics };
}
```

Apply props/title changes without touching identity:

```ts
function applyPuckItemToNode(
  node: RenderTreeNodeContract,
  item: PuckScreenItem,
  diagnostics: PuckAdapterDiagnostic[],
): RenderTreeNodeContract {
  const nextNode = cloneNode(node);
  nextNode.metadata = {
    ...nextNode.metadata,
    title: item.props.title ?? nextNode.metadata.title,
  };

  if (item.props.nodePropsJson !== undefined) {
    const parsed = parseNodeProps(item.props.nodePropsJson);
    if (parsed.ok) {
      nextNode.props = parsed.value;
    } else {
      diagnostics.push({
        code: "invalid_node_props_json",
        id: item.props.id,
        severity: "error",
      });
    }
  }

  return nextNode;
}
```

Level adapters should be thin wrappers around the same child adapter:

```ts
function applyPuckAreaData(input: {
  area: RenderTreeNodeContract;
  data: PuckScreenData;
}): ApplyPuckDataResult<RenderTreeNodeContract> {
  const area = cloneNode(input.area);
  const result = applyPuckItemsToChildren({
    children: area.children ?? [],
    items: input.data.content,
  });
  area.children = result.children;

  return {
    diagnostics: result.diagnostics,
    node: area,
  };
}
```

For screen-region and component-level scopes, use the same pattern:

```text
screen-region scope -> apply to selected region.children
area scope          -> apply to selected area.children
component scope     -> apply to selected component.children
```

Rollout 1 adapter behavior:

- Reorder is supported.
- Props/title changes are preserved through Puck fields.
- Props editing uses a JSON textarea first and writes through `nodePropsJson`.
- Missing items may be treated as unmount later, but Rollout 1 reorder should not expose unmount
  controls until remove behavior is verified.
- Unknown new items may be diagnosed until catalog insert node creation is implemented.

### 6. Initial Edit Scope Strategy

Edit scope means the RenderTree subtree handed to Puck for editing.

The final implementation must support all three scopes. Rollout can still start with the smallest
verification slice, but the Puck provider and scope resolver must recognize screen, area, and
component views from the beginning.

```text
selected area
-> selectedArea.children
-> renderTreeChildrenToPuckData
-> Puck built-in block DnD
-> applyPuckAreaData
-> edited area
-> replace edited area in whole-screen RenderTree candidate
-> save
-> render_area_children.order_index updated by projection
```

Why area-level is a good first verification slice:

- It edits one selected parent scope.
- It can validate reorder with the least zone complexity while the screen-region 3-zone contract is
  still represented in the adapter/config model.
- It avoids primitive component catalog/variant/node creation complexity.
- `render_area_children` already has the clearest relation shape for reorder validation.

Initial flow:

```text
user opens area view
-> user selects an area
-> AppShell derives editScope = { kind: "area", node: selectedArea }
-> AppShell builds Puck config/data from selectedArea.children
-> AppShell wraps ScreenCanvas + EditSidebar with <Puck>
-> ScreenCanvas renders Puck.Preview
-> EditSidebar top panel exposes Puck.Fields for selected item props
-> user reorders component blocks
-> Puck onChange emits next data
-> applyPuckAreaData returns editedArea
-> replaceNodeByMetadataId whole-screen helper creates screen candidate
-> save projects candidate to relation rows
```

Replacement helper example:

```ts
function replaceNodeByInstanceOrSourceId(input: {
  tree: RenderTreeScreenNodeContract;
  replacement: RenderTreeNodeContract;
}): RenderTreeScreenNodeContract {
  const targetId = readPuckNodeId(input.replacement);

  function replace(node: RenderTreeNodeContract): RenderTreeNodeContract {
    if (readPuckNodeId(node) === targetId) return input.replacement;
    return {
      ...node,
      children: node.children?.map(replace),
    };
  }

  return replace(input.tree) as RenderTreeScreenNodeContract;
}
```

Full-scope notes to handle during rollout:

- Screen-region level must support `Header / Contents / Bottom` zones. Cross-region movement should
  use Puck zone-aware DnD and preserve the selected region boundary in the RenderTree candidate.
- Component-level has primitive catalog, props, and variant problems. First implementation edits
  props through JSON textarea; schema-generated primitive controls can come later.
- Mount/unmount should wait until reorder and `metadata.instanceId` projection are stable.

### 7. View-Based Edit Scope Branching

The UI already has separate screen, area, and component views. Edit scope should branch from the
active view instead of inventing a separate mode hierarchy.

Target mapping:

```ts
type EditScope =
  | { kind: "screen-region"; screen: RenderTreeScreenNodeContract; regionType: "header" | "contents" | "bottom" }
  | { kind: "area"; screen: RenderTreeScreenNodeContract; area: RenderTreeNodeContract }
  | { kind: "component"; screen: RenderTreeScreenNodeContract; component: RenderTreeNodeContract };
```

Initial branching:

```ts
function resolveEditScope(input: {
  activeView: "screen" | "area" | "component" | string;
  selectedScreen?: RenderTreeScreenNodeContract;
  selectedArea?: RenderTreeNodeContract;
  selectedComponent?: RenderTreeNodeContract;
}): EditScope | undefined {
  if (input.activeView === "area" && input.selectedScreen && input.selectedArea) {
    return {
      kind: "area",
      screen: input.selectedScreen,
      area: input.selectedArea,
    };
  }

  if (input.activeView === "screen" && input.selectedScreen) {
    return {
      kind: "screen-region",
      screen: input.selectedScreen,
      regionType: "contents",
    };
  }

  if (input.activeView === "component" && input.selectedScreen && input.selectedComponent) {
    return {
      kind: "component",
      screen: input.selectedScreen,
      component: input.selectedComponent,
    };
  }

  return undefined;
}
```

Final scope support:

1. `screen-region` branch edits region children and uses area block catalog.
2. `area` branch edits area children and uses component block catalog.
3. `component` branch edits component children and uses primitive component catalog.

Rollout order can still implement `area` first, then `screen-region`, then `component`, but the
target architecture should not be area-only.

This keeps the plan aligned with the current UI structure:

```text
screen view    -> screen-region edit scope
area view      -> area edit scope
component view -> component edit scope
```

### 8. Catalog Insert Node Creation

Mount should not flatten the whole RenderTree and rebuild it.

The mount responsibility is:

```text
active edit scope children[]
+ selected catalog item
-> create one RenderTree node object
-> insert into current scope children[]
-> replace edited scope in whole-screen RenderTree candidate
-> save projection later consumes the updated RenderTree
```

Flat node indexes are allowed only for lookup/search. They should not become the write model.

Catalog item schema:

```ts
type MountableCatalogItem = {
  id: string; // source id: area id, component id, or primitive catalog type
  type: string; // RenderTree node type
  title: string;
  version?: string;
  defaultProps?: Record<string, SchemaPropValue>;
  children?: RenderTreeNodeContract[];
};
```

Scope -> catalog source mapping:

```ts
type CatalogSource =
  | { kind: "area-blocks" }
  | { kind: "component-blocks" }
  | { kind: "primitive-components" };

function resolveCatalogSource(scope: EditScope): CatalogSource {
  if (scope.kind === "screen-region") return { kind: "area-blocks" };
  if (scope.kind === "area") return { kind: "component-blocks" };
  return { kind: "primitive-components" };
}
```

Expected catalog sources:

```text
screen-region scope -> DB area blocks
area scope          -> DB component blocks
component scope     -> @cx/components/catalog primitive components
```

Create one mounted RenderTree node:

```ts
function createMountedNode(item: MountableCatalogItem): RenderTreeNodeContract {
  return {
    type: item.type,
    componentVersion: item.version ?? "1.0.0",
    metadata: {
      id: item.id,
      instanceId: createTemporaryInstanceId(),
      title: item.title,
    },
    props: item.defaultProps,
    children: item.children?.map(cloneNode),
  };
}

function createTemporaryInstanceId(): string {
  return `tmp:${crypto.randomUUID()}`;
}
```

Insert into the current scope:

```ts
function insertChildAt(input: {
  children: RenderTreeNodeContract[];
  child: RenderTreeNodeContract;
  index: number;
}): RenderTreeNodeContract[] {
  return [
    ...input.children.slice(0, input.index),
    input.child,
    ...input.children.slice(input.index),
  ];
}
```

Apply mount by scope:

```ts
function mountIntoAreaScope(input: {
  area: RenderTreeNodeContract;
  item: MountableCatalogItem;
  index: number;
}): RenderTreeNodeContract {
  const mountedNode = createMountedNode(input.item);
  return {
    ...input.area,
    children: insertChildAt({
      children: input.area.children ?? [],
      child: mountedNode,
      index: input.index,
    }),
  };
}
```

Rules:

- Puck can request/emit an inserted item, but adapter/catalog code creates the real RenderTree node object.
- Once the node is inserted into RenderTree, the existing renderer can render it normally.
- New mounted nodes use `metadata.id` for source identity.
- New mounted nodes use `metadata.instanceId = "tmp:*"` until save/reload returns persisted child ids.
- Save projection treats temporary instance ids as not-yet-persisted child instances.
- First slice: after save succeeds, reload the screen tree and replace the local candidate with the fresh DB materialized tree.
- Later optimization: return a `tmp:* -> persisted child id` map from save and patch local RenderTree without a full reload.
- Do not derive parent identity from item props; the active edit scope owns the parent.

Validation:

- Mounting in area scope inserts exactly one child into `selectedArea.children`.
- Existing siblings keep their `metadata.instanceId` values.
- The new child has source `metadata.id` and temporary `metadata.instanceId`.
- Whole-screen candidate is produced by replacing the edited scope only.
- No flat node list is used as the write model.

### 9. Temporary Instance Id Resolution

Newly mounted nodes may have temporary `metadata.instanceId` values before persistence:

```ts
const mountedNode = {
  metadata: {
    id: "component-button-primary",
    instanceId: "tmp:9c8f...",
    title: "가입 버튼",
  },
};
```

First-slice decision:

```text
save succeeds
-> reload screen tree from DB
-> loader/materializer reads persisted child row ids
-> fresh RenderTree replaces local candidate
-> temporary ids disappear
```

Do not implement local `tmp:* -> persisted id` patching in Rollout 1.

Reason:

- Current save path uses delete + insert while preserving existing ids where possible.
- DB should remain the source of truth for newly created child ids.
- Reload guarantees the RenderTree matches actual relation-table state.
- It avoids adding response mapping logic before the save path is refactored.

Save flow:

```ts
async function saveAndReloadScreenTree(input: {
  candidate: RenderTreeScreenNodeContract;
  screenId: string;
}): Promise<RenderTreeScreenNodeContract> {
  await saveScreenTreeOrder({
    node: input.candidate,
    screenId: input.screenId,
  });

  const result = await loadScreenTree(input.screenId);
  if (!result.node) {
    throw new Error("Failed to reload screen tree after save");
  }

  return result.node;
}
```

Future optimization:

```text
save projection returns:
  tmp:abc -> render_area_child_123

local candidate patch:
  metadata.instanceId: "tmp:abc"
  -> metadata.instanceId: "render_area_child_123"
```

That optimization should wait until the save path can reliably return inserted row ids.

### 10. Puck Built-In DnD Surface Decision

Confirmed sources:

- Current package: `@puckeditor/core@0.21.2`.
- Prior remote commits used workbench composition with `<Puck>` at the root, `<Puck.Components />`
  in the right sidebar, and the canvas as the Puck drop/reorder surface.
- Puck docs define:
  - `<Puck.Components />` as the draggable component list for custom Puck UIs.
  - `<Puck.Preview />` as the drag-and-drop preview for custom Puck UIs.
  - `<Puck.Fields />` as the selected component/root field editing surface.
  - `<Drawer>` / `<Drawer.Item>` as lower-level draggable reference-list helpers.
- Puck action types include `insert`, `replace`, `reorder`, `move`, and `remove`.

Decision:

```text
Right sidebar bottom: Puck.Components
  -> draggable catalog source

Center canvas: Puck.Preview
  -> built-in drop/reorder/move target

Right sidebar top: Puck.Fields
  -> interactive property editing surface
```

This matches the prior remote flow:

```text
Right panel catalog item drag
-> drop into Puck preview/canvas
-> Puck emits insert/move/reorder action
-> onChange receives updated Puck data
-> adapter converts Puck data to RenderTree candidate
```

Important correction:

- The central canvas is not a passive visual preview in Puck terms. It renders `<Puck.Preview />`,
  which is Puck's built-in drag/drop preview surface.
- Product-wise, the canvas can feel like the visual preview surface, but technically it must remain
  the Puck DnD target for built-in insert/reorder.
- `PropertyPanel` should not implement custom DnD. It hosts `Puck.Fields` for the currently selected
  item/root fields.

Implementation sketch:

```tsx
export function PropertyPanel() {
  return <Puck.Fields />;
}

export function BlockCatalogPanel() {
  return <Puck.Components />;
}

export function ScreenCanvas() {
  return <Puck.Preview id="workbench-preview" />;
}
```

Action observation:

```tsx
<Puck
  config={config}
  data={data}
  iframe={{ enabled: false }}
  onAction={(action, appState, prevAppState) => {
    if (
      action.type === "insert" ||
      action.type === "replace" ||
      action.type === "reorder" ||
      action.type === "move" ||
      action.type === "remove"
    ) {
      // Debug only. Persist from onChange/data -> RenderTree, not directly here.
      console.debug("[Puck action]", action.type, action);
    }
  }}
  onChange={(nextData) => {
    // Source of truth for our candidate conversion.
    const candidate = puckDataToRenderTreeCandidate(nextData);
  }}
>
  <ScreenCanvas />
  <EditSidebar />
</Puck>
```

Rules:

- Use `onChange(data)` as the source for RenderTree candidate conversion.
- Use `onAction(action, appState, prevAppState)` only for diagnostics, analytics, and API verification.
- Do not persist directly from `onAction`.
- Do not dispatch custom `reorder` / `move` from our own buttons.
- Do not add another drag library.

Validation spike before implementation:

1. Render `Puck.Fields` in `PropertyPanel`.
2. Render `Puck.Components` in `BlockCatalogPanel`.
3. Render `Puck.Preview` in `ScreenCanvas`.
4. Drag a catalog item from `Puck.Components` into `Puck.Preview`.
5. Reorder an existing item in `Puck.Preview`.
6. Select an item in `Puck.Preview`.
7. Confirm `Puck.Fields` renders the selected item's editable fields.
8. Log `onAction` and `onChange` results.

Expected outcome:

- Catalog mount is supported by `Puck.Components -> Puck.Preview`.
- Reorder/move is supported by `Puck.Preview`.
- `Puck.Fields` is treated as property editing, not the primary reorder surface.

## Reorder And DnD Policy

Do not build a custom drag-and-drop system in `EditSidebar`.

Allowed reorder mechanism:

- Puck's built-in block drag-and-drop behavior.

Disallowed reorder mechanisms:

- Button/menu reorder controls.
- App-owned pointer DnD state.
- Custom sortable list implementations in `EditSidebar`.
- Extra DnD libraries for block ordering.
- Calling `dispatch({ type: "reorder" })` from custom move buttons.
- Manually mutating React arrays and then trying to synchronize them back into Puck.

Reorder must happen through Puck's own block DnD feature:

```text
Puck block DnD
-> Puck data.content update
-> Puck onChange
-> @cx/adapters/puck apply helper
-> RenderTree candidate
```

`EditSidebar` hosts Puck-native surfaces:

- top: `Puck.Fields` as the property editing surface
- bottom: `Puck.Components` as the draggable catalog source

Built-in insert/reorder/move happens in `Puck.Preview`.

For cross-zone movement after region-aware zones are implemented, use Puck's built-in zone-aware
block DnD behavior. Do not add custom controls that dispatch `move` manually.

Use Puck selectors only when the sidebar needs read-only metadata for display/debugging:

```ts
const selector = getSelectorForId(item.props.id);
```

Selector rule:

- If Puck cannot return a selector for an item, the sidebar should not infer a custom zone/index.
- The UI should not compute zone ids from scratch when Puck can provide them.

## EditSidebar Responsibilities

`EditSidebar` replaces `InspectionPanel`.

It should be visible only for edit-capable views:

```text
screen view    -> screen-region edit
area view      -> area edit
component view -> component edit
```

Initial panels:

```text
EditSidebar
├─ Top pane: PropertyPanel
│  └─ selected item fields using Puck.Fields
└─ Bottom pane: BlockCatalogPanel
   └─ block catalog for the active edit level
```

Rollout 1 should include both panes:

```text
Top: PropertyPanel
Bottom: BlockCatalogPanel
```

`Puck.Outline` is not part of the initial expected layout. It can be added later as a separate
layer/structure view after preview DnD, fields, and catalog behavior are stable.

## ScreenCanvas Responsibilities

`ScreenCanvas` should accept Puck editing preview.

Target behavior:

```text
non-edit preview
-> normal RenderedScreen preview

screen edit view
-> Puck preview for selected screen-region scope

area edit view
-> Puck preview for selected area scope

component edit view
-> Puck preview for selected component scope
```

Implementation:

- `ScreenCanvas` renders `Puck.Preview` when it is inside the AppShell-owned `<Puck>` provider.
- `ScreenCanvas` renders `RenderedScreen` in non-edit preview mode.

Important:

- `ScreenCanvas` should not own Puck config/data.
- `ScreenCanvas` should only render the preview surface for the current state.
- Candidate conversion should stay in `AppShell` or the adapter layer.

## AppShell Puck Responsibilities

`AppShell` is the bridge between workbench selection and Puck. Do not introduce a separate
`PuckEditShell` wrapper. If the implementation grows, extract pure helpers or small child
components, but keep Puck provider ownership in `AppShell`.

Responsibilities:

1. Determine edit scope from the active view plus selected screen/area/component.
2. Build Puck config for the edit scope.
3. Build Puck data for the edit scope.
4. Render children inside `<Puck>`.
5. On Puck change, apply Puck data to a RenderTree candidate.
6. Replace edited area/component back into the whole-screen candidate when needed.
7. Call AppShell candidate callbacks.

Pseudo-flow:

```text
AppShell active view + selected state
-> resolveEditScope
-> build config/data from scope
-> <Puck>{ScreenCanvas + EditSidebar}</Puck>
-> Puck onChange
-> apply helper
-> whole-screen candidate
-> AppShell screenCandidates
```

For area editing:

```text
selected area
-> applyPuckAreaData
-> edited area
-> replace edited area in visible screen tree
-> screen candidate
```

## Data Lifecycle

### Reorder

```text
original RenderTree with metadata.instanceId values
-> Puck data with minimal item ids
-> user reorders through Puck built-in block DnD
-> Puck updates data.content order
-> Puck onChange
-> adapter reorder
-> RenderTree candidate
-> save
-> projection preserves existing metadata.instanceId values
-> order_index is recalculated from child order
```

### Unmount

Not Rollout 1, but architecture should support it.

```text
original relation-bound item exists
-> user removes through Puck action/control
-> item missing from next Puck data
-> adapter treats missing item as active-scope exclusion
-> RenderTree candidate excludes child
-> DB projection behavior is handled by save strategy
```

### Mount

Not Rollout 1, but architecture should support it.

```text
user chooses block from library
-> Puck insert/replace action
-> adapter creates RenderTree node from active catalog
-> new RenderTree node has metadata.id and optional temporary metadata.instanceId
-> RenderTree candidate includes new child
-> DB projection behavior is handled by save strategy
-> reload screen tree to replace temporary metadata.instanceId with persisted child ids
```

## Implementation Phases

### Phase 1: Planning And Contract Cleanup

Deliverables:

- This plan document.
- Implement foundation logic before Puck UI work:
  - `metadata.id` remains the source identity.
  - `metadata.instanceId` carries child relation identity when available.
  - parent scope remains represented by tree structure.
  - DB rows -> RenderTree materialization preserves `metadata.instanceId`.
  - RenderTree -> DB projection preserves existing rows through `metadata.instanceId`.
  - Puck data uses minimal item props and does not carry persistence identity.
- Confirm current Puck version API:
  - `Puck.Preview`
  - `Puck.Fields`
  - `Puck.Components`
  - `usePuck` / `createUsePuck`
  - built-in Puck block drag-and-drop reorder
  - `dispatch({ type: "move" })`
  - `dispatch({ type: "remove" })`
  - `dispatch({ type: "insert" })`

Validation:

- Plan explicitly rejects custom DnD.
- Plan names `InspectionPanel` removal.
- Plan separates layout ownership from edit-state ownership.
- Plan keeps persistence identity on RenderTree, not Puck data.
- Foundation tests cover RenderTree identity materialization, projection, and Puck roundtrip.

### Phase 2: Replace InspectionPanel With EditSidebar Shell

Deliverables:

```text
apps/web/src/components/workbench/edit-sidebar/EditSidebar.tsx
```

Changes:

- Remove `InspectionPanel` import/render from `AppShell`.
- Delete `apps/web/src/components/workbench/inspector/InspectionPanel.tsx`.
- Render `EditSidebar` in the same right-side AppShell position.
- At this phase, `EditSidebar` can show static structure or a disabled state.

Validation:

- No `InspectionPanel` references remain.
- App layout still has left navigation, route list, canvas, and right sidebar.
- Existing App tests are updated to stop depending on inspection text.

### Phase 3: Move Puck Ownership To AppShell

Deliverables:

```text
apps/web/src/components/workbench/AppShell.tsx
apps/web/src/components/puck/puck-edit-config.tsx
apps/web/src/components/puck/puck-edit-data.ts
apps/web/src/components/puck/puck-edit-adapter.ts
```

Changes:

- In edit scopes, `AppShell` renders `<Puck>` around `ScreenCanvas` and `EditSidebar`.
- In non-edit scopes, `AppShell` renders the normal layout without Puck.
- Move screen/area Puck config/data/onChange bridging out of Canvas-local editor components.

Validation:

- `EditSidebar` can call Puck hooks in edit mode.
- `ScreenCanvas` can render Puck preview in edit mode.
- Non-edit preview still renders without Puck.

### Phase 4: ScreenCanvas Uses Puck Preview

Deliverables:

- `Canvas.tsx` or a split `ScreenCanvas.tsx` renders `Puck.Preview` for edit mode.

Changes:

```text
screen edit view    -> Puck.Preview
area edit view      -> Puck.Preview
component edit view -> Puck.Preview
non-edit preview    -> RenderedScreen
```

Validation:

- Puck preview renders for screen-region edit.
- Puck preview renders for area edit.
- Puck preview renders for component edit.
- Normal preview remains unchanged.

### Phase 5: EditSidebar Top PropertyPanel

Deliverables:

```text
apps/web/src/components/workbench/edit-sidebar/PropertyPanel.tsx
```

Behavior:

- Hosts `Puck.Fields` for the current edit scope.
- Does not render custom move buttons.
- Does not own drag state.
- Lets users edit the currently selected item/root fields through Puck's field system.
- Rollout 1 uses a JSON textarea for node props and stores the value in `nodePropsJson`.
- Field edits flow through Puck data and then `onChange`.

Important selector rule:

Do not return a fresh object from the hook selector on every render.

If `PropertyPanel` needs Puck state beyond `<Puck.Fields />`, prefer stable selectors:

```ts
const selectedItem = usePuckSelector((state) => state.selectedItem);
const appData = usePuckSelector((state) => state.appState.data);
```

Avoid:

```ts
usePuckSelector((state) => ({
  dispatch: state.dispatch,
  items: state.appState.data.content
}));
```

Validation:

- No React `getSnapshot should be cached` warning.
- Puck built-in block drag-and-drop updates Puck content order.
- Puck `onChange` fires.
- AppShell receives updated RenderTree candidate.

### Phase 6: EditSidebar Bottom BlockCatalogPanel

Deliverables:

```text
apps/web/src/components/workbench/edit-sidebar/BlockCatalogPanel.tsx
```

Behavior:

- Shows the active edit level's block catalog in the bottom pane.
- Uses Puck-native catalog/library surfaces where possible.
- Does not mount blocks in Rollout 1 unless Puck's built-in flow and catalog node creation are ready.
- Keeps catalog identity aligned with the active edit level:
  - screen edit: area blocks
  - area edit: component blocks
  - component edit: primitive component catalog

Validation:

- Bottom pane is visible together with the reorder pane.
- Catalog section matches the active edit level.
- Catalog does not create placeholder nodes that cannot be projected to DB.

### Phase 7: Save Reorder

Deliverables:

- Ensure existing save button persists the candidate from Puck reorder.

Validation:

- Adapter unit tests prove reordered Puck data reorders RenderTree children.
- App/component test proves Puck built-in block DnD changes Puck content order.
- Save projection test proves relation ids are preserved and order changes.
- Optional DB test confirms `order_index` changes only for the edited relation group.

### Phase 8: Bring Back Validated Catalog Concepts

Deliverables:

- Connect `BlockCatalogPanel` to `Puck.Components` or a catalog-backed block list.

Carry forward from old implementation:

- Use a catalog map for insert node creation.
- Use preview affordances for blocks.
- Do not insert placeholder nodes that cannot be projected to DB.

Validation:

- Library sections match edit level:
  - region level: area blocks
  - area level: component blocks
  - component level: primitive components

### Phase 9: Area-Level Reorder

Only after the AppShell-owned Puck lifecycle is stable.

Deliverables:

- Apply the same AppShell-owned Puck lifecycle to area view.
- Use selected area as the edit target.
- Apply `applyPuckAreaData` to produce an edited area.
- Replace edited area back into the visible whole-screen RenderTree candidate.

Validation:

- Area-level Puck preview renders.
- Area-level block DnD reorders component blocks.
- Saving updates `render_area_children.order_index`.
- Existing `render_area_children.id` values are preserved for unchanged/reordered rows.

### Phase 10: Component-Level Reorder

Only after area-level reorder is stable.

Deliverables:

- Add an explicit selected-component edit scope.
- Use component-level Puck data from `renderTreeToPuckComponentData`.
- Apply `applyPuckComponentData` to produce an edited component.
- Replace edited component back into the visible whole-screen RenderTree candidate.

Validation:

- Component-level Puck preview renders.
- Component-level block DnD reorders primitive child components.
- Saving updates `render_component_children.order_index`.
- Existing `render_component_children.id` values are preserved for unchanged/reordered rows.

### Phase 11: Screen-Region Mount / Unmount

Only after screen-region reorder is stable.

Mount:

```text
area block catalog
-> Puck built-in insert/drop
-> adapter creates an area node
-> new node has metadata.id and optional temporary metadata.instanceId
-> RenderTree screen candidate
-> save projection consumes the updated RenderTree
```

Unmount:

```text
existing screen-region child relation
-> Puck remove/drop result omits item
-> RenderTree screen candidate excludes area node from region children[]
-> save projection consumes the updated RenderTree
```

Validation:

- Mounting an area block includes it in region children[].
- Unmounting an area block excludes it from region children[].
- Unchanged region child relation ids are preserved.

### Phase 12: Area-Level Mount / Unmount

Only after area-level reorder is stable.

Mount:

```text
component block catalog
-> Puck built-in insert/drop
-> adapter creates component block node from catalog
-> new node has metadata.id and optional temporary metadata.instanceId
-> edited area
-> whole-screen candidate
-> save projection consumes the updated RenderTree
```

Unmount:

```text
existing area child relation
-> Puck remove/drop result omits item
-> edited area excludes child node from children[]
-> whole-screen candidate
-> save projection consumes the updated RenderTree
```

Validation:

- Mounting a component block includes it in area children[].
- Unmounting a component block excludes it from area children[].
- Unchanged area child relation ids are preserved.

### Phase 13: Component-Level Mount / Unmount

Only after component-level reorder is stable.

Mount:

```text
@cx/components/catalog primitive
-> Puck built-in insert/drop
-> adapter creates primitive child node
-> new node has metadata.id and optional temporary metadata.instanceId
-> edited component
-> whole-screen candidate
-> save projection consumes the updated RenderTree
```

Unmount:

```text
existing component child relation
-> Puck remove/drop result omits item
-> edited component excludes child node from children[]
-> whole-screen candidate
-> save projection consumes the updated RenderTree
```

Validation:

- Mounting a primitive child includes it in component children[].
- Unmounting a primitive child excludes it from component children[].
- Unchanged component child relation ids are preserved.

### Shared Mount / Unmount Rules

Only after reorder is stable.

Unmount:

```ts
dispatch({ type: "remove", index, zone });
```

Mount:

```ts
dispatch({
  type: "insert",
  componentType,
  destinationIndex,
  destinationZone
});
```

or:

```ts
dispatch({
  type: "replace",
  destinationIndex,
  destinationZone,
  data
});
```

Rules:

- Missing existing item in next Puck data means unmount from the active children[].
- New RenderTree node in next Puck data means mount into the active children[].
- Mounted item must be resolved from active catalog.
- Existing `metadata.instanceId` values are preserved for unchanged/reordered items.
- Temporary `metadata.instanceId` values are replaced by persisted child ids after save.

Validation:

- Remove updates the RenderTree candidate by excluding the node.
- Insert updates the RenderTree candidate by including the node.
- Existing rows are not churned unnecessarily.

## Rollout Documents

Detailed implementation contracts are split into separate rollout documents to keep the central
architecture document small and reusable. Load only the rollout document needed for the current work.

| Rollout | Document | Implementation Focus |
|---|---|---|
| Rollout 1 | [rollout-1-workbench-shell.md](./puck-edit/rollout-1-workbench-shell.md) | AppShell-owned Puck provider, `EditSidebar`, JSON props textarea, `InspectionPanel` deletion |
| Rollout 2 | [rollout-2-reorder-scopes.md](./puck-edit/rollout-2-reorder-scopes.md) | Built-in Puck DnD reorder for screen-region, area, and component scopes |
| Rollout 3 | [rollout-3-mount-unmount.md](./puck-edit/rollout-3-mount-unmount.md) | Mount/unmount as RenderTree children[] inclusion/exclusion, catalog materialization, save/reload |
| Rollout 4 | [rollout-4-fields-persistence.md](./puck-edit/rollout-4-fields-persistence.md) | Typed fields, variant-aware props, JSON fallback, projection hardening |

Rollout document index:

```text
docs/development/puck-edit/README.md
```

Shared implementation contract summary:

```ts
type AppShellEditState = {
  activeView: "screen" | "area" | "component" | "preview" | string;
  selectedScreen?: RenderTreeScreenNodeContract;
  selectedArea?: RenderTreeNodeContract;
  selectedComponent?: RenderTreeNodeContract;
  selectedRegionType?: ScreenRegionType;
};

type ScreenRegionType = "header" | "contents" | "bottom";

type EditScope =
  | { kind: "screen-region"; screen: RenderTreeScreenNodeContract; regionType: ScreenRegionType }
  | { kind: "area"; screen: RenderTreeScreenNodeContract; area: RenderTreeNodeContract }
  | { kind: "component"; screen: RenderTreeScreenNodeContract; component: RenderTreeNodeContract };
```

Shared AppShell flow:

```text
AppShell state
-> resolveEditScope
-> no edit scope: render normal ScreenCanvas + non-edit right sidebar state
-> edit scope exists:
   -> resolveCatalogSource
   -> load/build catalog items
   -> buildPuckConfigForScope
   -> buildPuckDataForScope
   -> <Puck config data onChange>
      -> ScreenCanvas renders Puck.Preview
      -> EditSidebar renders PropertyPanel + BlockCatalogPanel
   -> onChange data
   -> applyPuckChangeToScope
   -> set whole-screen RenderTree candidate
```

Forbidden shared shortcuts:

- Do not implement a separate `PuckEditShell`.
- Do not let Puck data contain DB table names, parent ids, relation table names, or `order_index`.
- Do not implement local drag-and-drop or button/menu reorder controls.
- Do not mutate old Zustand/store JSON structures from Puck `onChange`.
- Do not use flat node arrays as the write model.

## Verification Checklist

Code checks:

```text
rg "InspectionPanel" apps/web/src
rg "useMemo|useCallback" apps packages
npm run lint:hooks
npx biome lint <changed files>
npm test -- apps/web/src/components/App.test.tsx packages/adapters/src/__tests__/puck.test.ts apps/web/src/lib/screen-db-save.test.ts
npm run build
```

Behavior checks:

- Edit tab opens Puck preview.
- EditSidebar is visible in edit mode.
- EditSidebar can read Puck content.
- Built-in Puck block DnD does not create a React snapshot loop warning.
- Built-in Puck block DnD updates Puck content order.
- Puck `onChange` updates the RenderTree candidate.
- Save writes the reordered tree through the existing `/tree` path.

Data checks:

- Existing `metadata.instanceId` values remain attached to unchanged/reordered items.
- DB `order_index` changes only within the edited parent scope.
- No unrelated screen/area/component rows are changed.

## Catalog Source Decision

Block libraries should use current loaded data first, then move to dedicated APIs only when the
library needs items that are not already present in the loaded screen context.

Rollout source rule:

```text
Rollout 1
-> use currently loaded screen/area/component context for smoke catalog sections

Rollout 2
-> keep catalog reads local because reorder does not require inserting new source items

Rollout 3
-> use loaded DB area blocks for screen-region mount
-> use loaded DB component blocks for area mount
-> use @cx/components/catalog for primitive component mount

Rollout 4
-> add dedicated block-library APIs only if the editor needs global reusable blocks outside the
   loaded screen tree
```

Dedicated API rule:

- Dedicated catalog APIs may improve discovery later.
- They must return `MountableCatalogItem[]` or a directly mappable equivalent.
- They must not change the Puck -> RenderTree -> DB projection lifecycle.
- They must not make Puck aware of DB table names, parent ids, relation table names, or `order_index`.
