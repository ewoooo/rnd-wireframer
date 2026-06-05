# Screen Generation Prompt Contract

`screen-generation` task는 최소한 다음 정보를 prompt artifact에 포함해야 한다.

- 사용자 query
- `SourceSpec`
- `screenIntent`가 있으면 그 결과
- `compositionPlan`이 있으면 그 결과
- `patternSelection`과 `layerCandidates`가 있으면 그 provenance
- design-context bundle refs나 bundle content가 있으면 그 id, version, reason, source docs
- `context.targetArtifact`의 schema version과 JSON Schema
- `context.intermediateArtifact`의 schema version과 JSON Schema
- 출력은 JSON only라는 규칙
- 금지 사항: 자유로운 HTML/Markdown prose, 임의 pattern id 발명, schema 밖 필드 추가

## Design Context Bundle

Phase 1에서는 design-context bundle을 최종 schema 계약으로 고정하지 않는다. 단, prompt artifact에 bundle 참조나 본문이 포함된 경우 task는 다음 수용 규칙을 따른다.

- Bundle은 보조 설계 기준이다. `SourceSpec`, JSON Schema, component contract, pattern candidate, source reference catalog를 우회하지 않는다.
- Bundle은 화면 구조, state coverage, interaction, visual foundation, quality gate를 좁히는 데만 사용한다.
- Bundle에 있는 규칙과 source evidence가 충돌하면 source evidence와 schema/catalog 계약을 우선한다.
- Bundle id, version, reason, source docs가 제공되면 결과 판단 근거와 revision 설명에서 추적 가능하게 유지한다.
- Bundle에 없는 component, prop, layout id, source ref, metric을 임의로 발명하지 않는다.

## Workflow

1. Read `context.sourceSpec` as the source of truth.
2. Read `context.patternSelection` and `context.layerCandidates` as pattern provenance. Do not invent pattern ids.
3. Read design-context bundle refs or content when present, then apply it only inside the allowed source/schema/catalog boundary.
4. Map source regions to `Screen.Header`, `Screen.Contents`, and `Screen.Bottom`.
5. Keep source areas grouped unless the validation contract requires a structural wrapper.
6. Put source component values into node `props`.
7. Render separation via the area stack node `props.divider` only. Use `"contents"` for 1px dividers between repeated row children, `"section"` for a trailing 4px area break, and `"none"` or omission when no divider is needed. Do not use `divider: true`, `sectionDivider`, or standalone Divider leaf nodes for stack-row separation.
8. Apply visual hierarchy through component choice and props within the catalog. Do not invent colors, gradients, or icons for emphasis.
9. Use `output-contract.md` for output shape rules.
10. Use `checklist.md` before returning the final JSON object.
