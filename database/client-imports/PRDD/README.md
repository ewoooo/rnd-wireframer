# PRDD Import Layout

```text
screen/    base PRDD pages used for the default generation pass (`*-0.md`)
```

The default pipeline should generate only from `screen/*.md` so token usage and regression tests stay focused on base pages. Non-base PRDD files are treated as external retry/variant inputs and are not kept in this repo by default.
