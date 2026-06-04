# PRDD Import Layout

```text
screen/    base PRDD pages used for the default generation pass (`*-0.md`)
variants/  non-base PRDD pages kept as deferred references (`*-1.md`, `*-2.md`, `*-E1.md`, ...)
```

The default pipeline should generate only from `screen/*.md` so token usage and regression tests stay focused on base pages. Files under `variants/` remain source material for explicit variant, retry, or edge-case generation runs.
