# Screen Generation Output Contract

`screen-generation`의 현재 목표 출력은 다음 두 artifact를 함께 포함하는 payload다.

```json
{
  "tableGenerationResult": {},
  "renderTree": {}
}
```

규칙:

- `tableGenerationResult`는 layout id provenance가 남는 중간 산출물이다.
- `renderTree`는 preview 가능한 materialized 산출물이다.
- 최종 schema 버전과 DTO 정본은 `@cx/schema`를 따른다.

## RenderTree Rules

- Use top-level `version`, `metadata`, and `children`.
- Do not use `contractVersion`, `schemaVersion`, `root`, `tree`, `nodeId`, or `componentId`.
- Top-level `metadata` must not include `title`.
- Every render node `metadata` must include `id` and `title`.
- The first child must be a Screen root node.
- Put `Screen.Header`, `Screen.Contents`, and `Screen.Bottom` under the Screen root when the source has matching regions.
- Use `node.layout` for layout pattern selection, shaped as `layout.<target>.<PatternName>`.
- Component values belong in `node.props`.

## Table Generation Result Rules

- Use the schema version requested by `context.intermediateArtifact`.
- Every screen, region, area, and component record must include a layout id from selected candidates or layer candidates.
- Layout ids are shaped as `layout.<target>.<PatternName>`.
