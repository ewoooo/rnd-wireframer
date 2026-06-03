# Puck Edit Rollout Documents

This directory contains the execution contracts for the Puck edit-sidebar implementation.

Use the central architecture document first:

```text
docs/development/PUCK_EDIT_PANEL_ENHANCEMENT_PLAN.md
```

Then load only the rollout document needed for the current implementation step.

## Rollouts

| Rollout | Document | Purpose |
|---|---|---|
| Rollout 1 | [rollout-1-workbench-shell.md](./rollout-1-workbench-shell.md) | AppShell-owned Puck provider, EditSidebar replacement, JSON props textarea |
| Rollout 2 | [rollout-2-reorder-scopes.md](./rollout-2-reorder-scopes.md) | Built-in Puck DnD reorder for screen-region, area, and component scopes |
| Rollout 3 | [rollout-3-mount-unmount.md](./rollout-3-mount-unmount.md) | Mount/unmount as RenderTree children[] inclusion/exclusion |
| Rollout 4 | [rollout-4-fields-persistence.md](./rollout-4-fields-persistence.md) | Typed fields, variant-aware props, projection hardening |

## Shared Lifecycle

All rollout documents must preserve this lifecycle:

```text
Puck edits arrays/props
-> RenderTree candidate
-> DB projection from RenderTree
```

Puck must not know DB table names, parent row ids, relation table names, or `order_index`.

