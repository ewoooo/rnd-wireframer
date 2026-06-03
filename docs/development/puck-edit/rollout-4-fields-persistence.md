# Rollout 4: Field Controls And Persistence Hardening

Rollout 4 improves editing fidelity without changing the lifecycle. JSON textarea remains a fallback,
while catalog/schema-aware fields become the preferred UI when contracts exist.

Common architecture, identity rules, and data lifecycle are defined in
[PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md](../PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md).

## Implementation Contract

Files to modify:

```text
apps/web/src/components/workbench/edit-sidebar/PropertyPanel.tsx
apps/web/src/components/workbench/edit-sidebar/JsonPropsField.tsx
apps/web/src/components/puck/puck-fields.ts
apps/web/src/components/puck/puck-edit-config.tsx
packages/component/src/public/puck.ts
packages/adapters/src/puck/diagnostics.ts
apps/web/src/lib/screen-db-save.test.ts
packages/adapters/src/puck/__tests__/apply-puck-data.test.ts
packages/adapters/src/puck/__tests__/catalog-materialization.test.ts
```

## Field Contract

```ts
type PuckFieldContract = {
  propName: string;
  fieldType: "text" | "number" | "select" | "radio" | "textarea" | "json";
  label: string;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: SchemaPropValue;
};

type PuckComponentContract = {
  type: string;
  title: string;
  fields: PuckFieldContract[];
  variants?: Array<{ label: string; value: string }>;
};
```

Field generation rule:

```ts
function buildFieldsForCatalogItem(item: MountableCatalogItem): Fields {
  const contract = resolvePuckComponentContract(item.type);
  if (!contract) {
    return {
      nodePropsJson: {
        type: "textarea",
        label: "Props JSON",
      },
    };
  }

  return {
    ...buildTypedFields(contract.fields),
    nodePropsJson: {
      type: "textarea",
      label: "Props JSON",
    },
  };
}
```

Typed field apply rule:

```ts
function applyTypedFieldProps(input: {
  node: RenderTreeNodeContract;
  item: PuckScreenItem;
  contract?: PuckComponentContract;
}): RenderTreeNodeContract {
  if (!input.contract) return input.node;

  const nextProps = { ...input.node.props };
  for (const field of input.contract.fields) {
    if (field.propName in input.item.props) {
      nextProps[field.propName] = input.item.props[field.propName];
    }
  }

  return {
    ...input.node,
    props: nextProps,
  };
}
```

## Persistence Hardening

- Projection tests must cover `render_screen_region_children`, `render_area_children`, and
  `render_component_children`.
- Reorder tests must prove `order_index` is derived from child array index, not from Puck props.
- Mount tests must prove `tmp:*` ids are not reused as persisted ids.
- Unmount tests must prove exclusion from children[] is enough for the Puck adapter.
- Any actual DB row deletion behavior must be implemented in save/projection code, not Puck adapter.

## Data Contract

Data input:

```text
component catalog field contracts
primitive variant contracts
Puck data with typed field props and nodePropsJson fallback
RenderTree candidate before save
```

Data output:

```text
RenderTree node props updated from typed fields when contracts exist
JSON textarea fallback retained for unsupported components
diagnostics for invalid JSON or contract mismatch
relation-table projection verified for all edit scopes
```

## Acceptance Criteria

- Components with field contracts render typed Puck fields.
- Components without field contracts still expose `nodePropsJson`.
- Variant-aware primitive fields can update RenderTree props without changing identity.
- Invalid JSON fallback diagnostics block unsafe save behavior.
- All relation-table projection tests pass for reorder, mount, and unmount.
- The lifecycle remains unchanged:

```text
Puck edits arrays/props
-> RenderTree candidate
-> DB projection from RenderTree
```

