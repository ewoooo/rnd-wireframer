# @cx/adapters

`@cx/adapters` owns pure format-to-format conversion contracts.

It does not perform file IO, Supabase/REST calls, DB writes, AI execution, validation policy, React rendering, or Puck rendering.

## Public Subpaths

| Subpath | Responsibility |
|---|---|
| `@cx/adapters/markdown` | Already-loaded Markdown/client input -> SourceSpec. Pending migration from `@cx/parser`. |
| `@cx/adapters/table` | Table/read-model rows -> RenderTree. RenderTree -> table projection remains pending. |
| `@cx/adapters/puck` | RenderTree <-> Puck editable data. Active. |

## Puck Boundary

```text
RenderTree node
-> @cx/adapters/puck
-> Puck editable data
-> Puck UI in apps/web
-> @cx/adapters/puck
-> immutable RenderTree candidate
```

The adapter returns diagnostics and never writes the candidate.
