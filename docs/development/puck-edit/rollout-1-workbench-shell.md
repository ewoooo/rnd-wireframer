# Rollout 1: Puck Workbench Shell And JSON Props

Rollout 1 proves the current workbench can host Puck and produce RenderTree candidates without
introducing custom DnD or DB-specific Puck state.

Common architecture, identity rules, and data lifecycle are defined in
[PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md](../PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md).

## Implementation Contract

Files to create:

```text
apps/web/src/components/workbench/edit-sidebar/EditSidebar.tsx
apps/web/src/components/workbench/edit-sidebar/EditSidebarHeader.tsx
apps/web/src/components/workbench/edit-sidebar/EditSidebarPane.tsx
apps/web/src/components/workbench/edit-sidebar/PropertyPanel.tsx
apps/web/src/components/workbench/edit-sidebar/JsonPropsField.tsx
apps/web/src/components/workbench/edit-sidebar/BlockCatalogPanel.tsx
apps/web/src/components/workbench/edit-sidebar/EmptyEditState.tsx
apps/web/src/components/workbench/edit-sidebar/types.ts

apps/web/src/components/puck/edit-scope.ts
apps/web/src/components/puck/puck-edit-types.ts
apps/web/src/components/puck/puck-edit-config.tsx
apps/web/src/components/puck/puck-edit-data.ts
apps/web/src/components/puck/puck-edit-adapter.ts
apps/web/src/components/puck/puck-fields.ts
```

Files to modify:

```text
apps/web/src/components/workbench/AppShell.tsx
apps/web/src/components/workbench/canvas/Canvas.tsx
apps/web/src/components/workbench/canvas/ScreenCanvas.tsx
packages/adapters/src/puck/index.ts
packages/adapters/src/__tests__/puck.test.ts
```

Files to delete:

```text
apps/web/src/components/workbench/inspector/InspectionPanel.tsx
```

## Required Functions

```ts
function resolveEditScope(state: AppShellEditState): EditScope | undefined {
  if (state.activeView === "screen" && state.selectedScreen) {
    return {
      kind: "screen-region",
      screen: state.selectedScreen,
      regionType: state.selectedRegionType ?? "contents",
    };
  }

  if (state.activeView === "area" && state.selectedScreen && state.selectedArea) {
    return {
      kind: "area",
      screen: state.selectedScreen,
      area: state.selectedArea,
    };
  }

  if (
    state.activeView === "component" &&
    state.selectedScreen &&
    state.selectedComponent
  ) {
    return {
      kind: "component",
      screen: state.selectedScreen,
      component: state.selectedComponent,
    };
  }

  return undefined;
}

function buildPuckDataForScope(scope: EditScope): PuckScreenData {
  if (scope.kind === "screen-region") {
    return renderScreenRegionToPuckData({
      screen: scope.screen,
      regionType: scope.regionType,
    });
  }

  if (scope.kind === "area") {
    return renderTreeChildrenToPuckData(scope.area.children ?? []);
  }

  return renderTreeChildrenToPuckData(scope.component.children ?? []);
}
```

Puck config rule:

```ts
function buildPuckConfigForScope(input: {
  scope: EditScope;
  catalogItems: MountableCatalogItem[];
}): Config {
  return {
    components: buildPuckComponentsForCatalog(input.catalogItems),
    root: {
      fields: {},
      render: ({ children }) => <>{children}</>,
    },
  };
}
```

## JSON Props Field Contract

```ts
type JsonPropsParseResult =
  | { ok: true; value: Record<string, SchemaPropValue> }
  | { ok: false; error: string };

function parseNodePropsJson(value: string): JsonPropsParseResult {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "Props JSON must be an object" };
    }
    return { ok: true, value: parsed };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}
```

Rules:

- Valid JSON updates `RenderTreeNode.props`.
- Invalid JSON adds an `invalid_node_props_json` diagnostic.
- Invalid JSON must not silently overwrite the previous valid `RenderTreeNode.props`.
- Save should be disabled or blocked when the current candidate has error diagnostics.

## Data Contract

Data input:

```text
selected screen tree
active view
selected screen / area / component
selected region type, defaulting to contents only for Rollout 1 smoke
active catalog items for the resolved scope
```

Data output:

```text
Puck data with minimal props.id / nodePropsJson / title / variant
RenderTree candidate after Puck onChange
diagnostics for invalid JSON or unknown nodes
```

## Acceptance Criteria

- `InspectionPanel` is deleted and no imports remain.
- `ScreenCanvas` renders `Puck.Preview` inside AppShell-owned Puck provider.
- `EditSidebar` top pane renders `Puck.Fields`.
- `EditSidebar` bottom pane renders the active catalog surface.
- `component view` resolves to a component Puck provider target.
- Rollout 1 does not implement custom DnD, reorder buttons, or menu reorder controls.
- Puck item props contain no `relationId`, `orderIndex`, `parentId`, DB table names, or relation table names.
- Invalid props JSON creates diagnostics and does not corrupt RenderTree props.

