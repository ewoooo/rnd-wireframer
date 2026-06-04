# Render DB Canonicalization

## Purpose

`render_areas` and `render_components` are reusable render nodes. Import and migration paths must not create one row per screen when the structural payload is identical.

## Signature Rule

Component canonical signature:

```text
version
+ type
+ layout_id
+ display
+ hooks
+ ordered render_component_children(catalog_component_type, variant, props)
```

Area canonical signature:

```text
version
+ type
+ layout_id
+ props
+ ordered render_area_children(canonical component_id)
```

Metadata fields such as `name`, `description`, and `author` do not participate in the signature.

## Canonical ID Rule

Only duplicate groups receive a generated canonical id. Unique rows keep their existing id to avoid unnecessary churn.

Duplicate component row id:

```text
component.{slug(type)}.{sha256(signature)[0..12]}
```

Duplicate area row id:

```text
area.{slug(layout_id without layout.area. prefix)}.{sha256(signature)[0..12]}
```

Examples:

```text
component.app-bar.5f6c7d8e9a01
area.area-app-bar.ce7c41a603e0
```

## Commands

Audit and dry-run local table push projection:

```bash
pnpm run render-db:push-tables -- --report-file tmp/render-db-push-canonical-report.json --out-file tmp/render-db-push-canonical.sql
```

Audit and dry-run remote Supabase render DB migration:

```bash
pnpm run render-db:canonicalize -- --report-file tmp/render-db-remote-canonical-report.json --out-file tmp/render-db-remote-canonical.sql
```

Apply remote Supabase render DB migration:

```bash
pnpm run render-db:canonicalize -- --write --report-file tmp/render-db-remote-canonical-applied-report.json --out-file tmp/render-db-remote-canonical-applied.sql
```

## Runtime Contract

`render-db:push-tables` canonicalizes by default. Use `--no-canonicalize` only for debugging a legacy projection.

Puck catalog API reads canonical DB rows directly:

```text
GET /api/screens/puck-catalog?scope=screen-region -> render_areas
GET /api/screens/puck-catalog?scope=area          -> render_components
```
