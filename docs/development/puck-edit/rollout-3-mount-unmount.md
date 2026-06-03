# Rollout 3: Mount And Unmount As Children[] Inclusion

Rollout 3 implements mount and unmount as RenderTree children[] inclusion/exclusion. DB row deletion
is still outside the Puck adapter.

Common architecture, identity rules, and data lifecycle are defined in
[PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md](../PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md).

## Implementation Contract

Files to create:

```text
apps/web/src/components/workbench/edit-sidebar/CatalogSection.tsx
apps/web/src/components/workbench/edit-sidebar/CatalogItem.tsx
apps/web/src/components/puck/puck-catalog.ts

packages/adapters/src/puck/catalog-materialization.ts
packages/adapters/src/puck/__tests__/catalog-materialization.test.ts
packages/component/src/public/puck.ts
```

Files to modify:

```text
apps/web/src/components/workbench/edit-sidebar/BlockCatalogPanel.tsx
apps/web/src/components/puck/puck-edit-config.tsx
apps/web/src/components/puck/puck-edit-adapter.ts
packages/adapters/src/puck/apply-puck-data.ts
packages/adapters/src/puck/index.ts
apps/web/src/lib/screen-db-save.ts
```

## Catalog And Materialization

```ts
type MountableCatalogItem = {
  id: string;
  type: string;
  title: string;
  version?: string;
  defaultProps?: Record<string, SchemaPropValue>;
  children?: RenderTreeNodeContract[];
};

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

Materialization rule:

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
    props: item.defaultProps ?? {},
    children: item.children?.map(cloneNode),
  };
}

function createTemporaryInstanceId(): string {
  return `tmp:${crypto.randomUUID()}`;
}
```

Apply inserted items:

```ts
function applyPuckItemsToChildren(input: {
  children: RenderTreeNodeContract[];
  items: PuckScreenItem[];
  catalogItems: MountableCatalogItem[];
}): {
  children: RenderTreeNodeContract[];
  diagnostics: PuckAdapterDiagnostic[];
} {
  const catalogByType = new Map(input.catalogItems.map((item) => [item.type, item]));
  const childByPuckId = new Map(
    input.children.map((child) => [readPuckNodeId(child), child]),
  );
  const nextChildren: RenderTreeNodeContract[] = [];
  const diagnostics: PuckAdapterDiagnostic[] = [];

  for (const item of input.items) {
    const existing = childByPuckId.get(item.props.id);
    if (existing) {
      nextChildren.push(applyPuckItemToNode(existing, item, diagnostics));
      continue;
    }

    const catalogItem = catalogByType.get(item.type);
    if (!catalogItem) {
      diagnostics.push({ code: "unknown_catalog_item", id: item.type, severity: "error" });
      continue;
    }

    nextChildren.push(applyPuckItemToNode(createMountedNode(catalogItem), item, diagnostics));
  }

  return { children: nextChildren, diagnostics };
}
```

Unmount rule:

```text
original child exists
next Puck data omits that child id
-> child is absent from next children[]
-> RenderTree candidate excludes the child
-> DB projection handles persistence writes
```

Save/reload rule:

```text
new mounted node has metadata.instanceId = tmp:*
save candidate through /api/screens/:screenId/tree
reload screen tree from DB
loader materializes persisted relation ids
replace local candidate with reloaded tree
```

## Data Contract

Data input:

```text
Puck data containing existing items, omitted items, and inserted catalog items
active catalog source for the edit scope
current scope children[]
```

Data output:

```text
next children[] including mounted items and excluding unmounted items
new nodes with metadata.id and temporary metadata.instanceId
whole-screen RenderTree candidate
fresh DB materialized tree after save/reload
```

## Acceptance Criteria

- Mounting in screen-region scope includes an area node in the selected region children[].
- Mounting in area scope includes a component node in `area.children`.
- Mounting in component scope includes a primitive node in `component.children`.
- Unmounting excludes the node from the active scope children[].
- Existing siblings keep their `metadata.instanceId` values.
- Inserted catalog items are immediately renderable by the existing renderer.
- Puck adapter does not perform DB row deletion.
- Save/reload replaces every `tmp:*` instance id with persisted relation ids.

