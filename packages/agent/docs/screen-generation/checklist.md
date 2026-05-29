# Screen Generation Checklist

P0 items must pass before returning.

## P0

- Output is one JSON object only.
- Output contains both `tableGenerationResult` and `renderTree`.
- No HTML, CSS, Markdown fence, or explanatory prose is included.
- `SourceSpec`의 핵심 의도와 source ref를 유지한다.
- RenderTree uses the schema version requested by `context.targetArtifact.schemaVersion`.
- Table generation result uses the schema version requested by `context.intermediateArtifact.schemaVersion`.
- Screen, region, area, and component layout ids come from `context.patternSelection` or `context.layerCandidates`.
- Source regions remain mapped to Screen Header, Contents, and Bottom.
- Source areas remain grouped unless the validation contract requires a structural wrapper.
- Component-specific display, binding, and default values are placed in component node props.
- RenderTree는 `@cx/renderer`가 소비 가능한 구조를 유지한다.

## P1

- Node metadata titles are readable and traceable to source intent.
- Layout props are objects, not string shortcuts.
- Bottom actions are not placed in scrollable content when a bottom region exists.
