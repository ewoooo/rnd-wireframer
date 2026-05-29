# Screen Generation Prompt Contract

`screen-generation` task는 최소한 다음 정보를 prompt artifact에 포함해야 한다.

- 사용자 query
- `SourceSpec`
- `screenIntent`가 있으면 그 결과
- `compositionPlan`이 있으면 그 결과
- `patternSelection`과 `layerCandidates`가 있으면 그 provenance
- `context.targetArtifact`의 schema version과 JSON Schema
- `context.intermediateArtifact`의 schema version과 JSON Schema
- 출력은 JSON only라는 규칙
- 금지 사항: 자유로운 HTML/Markdown prose, 임의 pattern id 발명, schema 밖 필드 추가

## Workflow

1. Read `context.sourceSpec` as the source of truth.
2. Read `context.patternSelection` and `context.layerCandidates` as pattern provenance. Do not invent pattern ids.
3. Map source regions to `Screen.Header`, `Screen.Contents`, and `Screen.Bottom`.
4. Keep source areas grouped unless the validation contract requires a structural wrapper.
5. Put source component values into node `props`.
6. Use `output-contract.md` for output shape rules.
7. Use `checklist.md` before returning the final JSON object.
