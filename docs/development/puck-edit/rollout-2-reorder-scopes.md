# Rollout 2: Reorder Across All Edit Scopes

Rollout 2 makes built-in Puck DnD reorder work for screen-region, area, and component scopes.

Common architecture, identity rules, and data lifecycle are defined in
[PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md](../PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md).

## Implementation Contract

Files to create:

```text
apps/web/src/components/puck/puck-edit-zones.ts

packages/adapters/src/puck/edit-scope.ts
packages/adapters/src/puck/puck-data.ts
packages/adapters/src/puck/apply-puck-data.ts
packages/adapters/src/puck/zones.ts
packages/adapters/src/puck/diagnostics.ts
packages/adapters/src/puck/__tests__/puck-data.test.ts
packages/adapters/src/puck/__tests__/apply-puck-data.test.ts
```

Files to modify:

```text
apps/web/src/components/puck/puck-edit-config.tsx
apps/web/src/components/puck/puck-edit-data.ts
apps/web/src/components/puck/puck-edit-adapter.ts
apps/web/src/components/workbench/AppShell.tsx
apps/web/src/lib/screen-db-save.ts
apps/web/src/lib/screen-db-save.test.ts
```

## Zone Contract

```ts
const screenRegionZoneIds = {
  header: "screen.header",
  contents: "screen.contents",
  bottom: "screen.bottom",
} satisfies Record<ScreenRegionType, string>;

function getScreenRegionZoneId(regionType: ScreenRegionType): string {
  return screenRegionZoneIds[regionType];
}
```

Screen-region Puck data must represent all three zones:

```ts
function renderScreenToPuckData(screen: RenderTreeScreenNodeContract): PuckScreenData {
  return {
    content: [],
    root: { props: {} },
    zones: {
      [screenRegionZoneIds.header]: renderTreeChildrenToPuckItems(
        readScreenRegionChildren(screen, "header"),
      ),
      [screenRegionZoneIds.contents]: renderTreeChildrenToPuckItems(
        readScreenRegionChildren(screen, "contents"),
      ),
      [screenRegionZoneIds.bottom]: renderTreeChildrenToPuckItems(
        readScreenRegionChildren(screen, "bottom"),
      ),
    },
  };
}
```

Apply zone-aware screen-region reorder:

```ts
function applyPuckScreenRegionData(input: {
  screen: RenderTreeScreenNodeContract;
  data: PuckScreenData;
}): ApplyPuckDataResult<RenderTreeScreenNodeContract> {
  let nextScreen = cloneScreen(input.screen);
  const diagnostics: PuckAdapterDiagnostic[] = [];

  for (const regionType of ["header", "contents", "bottom"] satisfies ScreenRegionType[]) {
    const zoneId = getScreenRegionZoneId(regionType);
    const result = applyPuckItemsToChildren({
      children: readScreenRegionChildren(input.screen, regionType),
      items: input.data.zones?.[zoneId] ?? [],
    });

    diagnostics.push(...result.diagnostics);
    nextScreen = writeScreenRegionChildren({
      screen: nextScreen,
      regionType,
      children: result.children,
    });
  }

  return { node: nextScreen, diagnostics };
}
```

Area and component reorder use the same child adapter:

```ts
function applyPuckAreaData(input: {
  area: RenderTreeNodeContract;
  data: PuckScreenData;
}): ApplyPuckDataResult<RenderTreeNodeContract>;

function applyPuckComponentData(input: {
  component: RenderTreeNodeContract;
  data: PuckScreenData;
}): ApplyPuckDataResult<RenderTreeNodeContract>;
```

## Data Contract

Data input:

```text
screen-region scope: screen tree with header / contents / bottom children
area scope: selected area children
component scope: selected component children
Puck data emitted by built-in Puck DnD
```

Data output:

```text
whole-screen RenderTree candidate with only the edited scope reordered
same metadata.instanceId values attached to the same logical child instances
diagnostics for duplicate, missing, or unknown Puck ids
```

## Acceptance Criteria

- Screen-region reorder updates the correct region children[].
- Puck data for screen-region scope contains `screen.header`, `screen.contents`, and `screen.bottom` zones.
- Cross-zone screen-region movement uses Puck's built-in zone-aware DnD.
- Area reorder updates `area.children`.
- Component reorder updates `component.children`.
- Save projection computes `order_index` from RenderTree child order.
- Existing `metadata.instanceId` values are preserved for reordered nodes.
- Tests cover duplicate ids, unknown ids, and multiple instances of the same `metadata.id`.

