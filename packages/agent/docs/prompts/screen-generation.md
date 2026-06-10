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
9. Use the `screen-generation` skill set's `output-contract` document for output shape rules.
10. Use the `screen-generation` skill set's `checklist` document before returning the final JSON object.

## Migrated Generation Rules

These rules are migrated from the removed compatibility inference nodes and are now owned by this prompt document.

1. Treat context by priority: constraints are inviolable; upstream decisions should be honored; guidance is advisory and yields to constraints and upstream on conflict.
2. Use upstream `screenIntent` and `compositionPlan` as design guidance when present.
3. Use upstream decoration guidance when present for display structure, split areas, display titles, roles, layout intents, and repeated item props hints.
4. Area `metadata.title` and `props.name` are structural metadata only, not visible copy. If a section heading should be visible, render it with an explicit heading component such as `TitleSection`.
5. Do not duplicate the same section heading through both area metadata/name and a visible heading component.
6. When a source area is split into multiple decorated areas, materialize the split areas in both RenderTree and `tableGenerationResult`.
7. List rows that need visible secondary copy must use the catalog-supported row props rather than placeholder text.
8. When `SourceSpec` includes error policy, required agreement, disabled, loading, or validation evidence, include bounded state-role coverage in RenderTree.
9. State-variant nodes that share one slot, especially bottom CTAs, must be mutually exclusive through display conditions or expressed as a single node. Never place two ungated primary CTAs in `Screen.Bottom`.
10. Every `CompositionPlan` section should be visible in `tableGenerationResult` through matching region, area, component, metadata, or provenance identifiers.
11. Preserve high-priority source refs from `compositionPlan.sections[].sourceRefs` whenever possible.
12. Preserve the SourceSpec screen skeleton: `Screen` > `Screen.Header`/`Screen.Contents`/`Screen.Bottom` > `area.static` or `area.dynamic` > optional layout wrapper > components.
13. Never output a render node with type `Area`. Use `SourceSpec` area render node type, `area.static`, or `area.dynamic` for area wrapper nodes.
14. Use the final RenderTree handoff shape as the primary result contract: top-level `version`, `minRendererVersion`, `metadata`, `theme`, and `children` containing a `Screen` root.
15. Screen region containers may omit `props`. When region props are present, keep them valid and renderer-oriented.
16. Use layout wrappers when the selected region/area pattern describes section grouping, list rails, or divider-separated sections.
17. Render separation through area stack `props.divider`, not standalone Divider leaf nodes.
18. Use only `props.divider: "contents" | "section" | "none"`.
19. Use `contents` for 1px dividers between repeated row children inside a list, checkbox, or field stack. It must not create a trailing divider after the last row. Decide from the source's visual row separation, not from the layout name: some area layouts already render `contents` dividers by default while gap-separated area layouts default to `none`. When the source shows hairline-separated rows but the chosen area layout does not divide rows by default, set `props.divider: "contents"` explicitly. Do not restate `props.divider` when the layout's catalog default already matches the intended separation.
20. Use `section` only for a trailing area break between two `Screen.Contents` areas. Omit it on the last area and when cards/groups already separate sections.
21. For a field-side action button such as verify, request, resend, or use-all, use catalog-supported TextField button props. Do not write renderer-owned slot objects such as `rightElement`.
22. Use source reference catalog entries, props, description, and raw notes as source text evidence for visible labels and descriptions.
23. Use the component contract catalog when choosing component props and composite layout candidates. Do not invent component props or layout ids outside that context.
24. Optional catalog components may be used when they fit the source better than source-provided component refs, but unstable candidate components require clear source evidence.
25. Respect `sourceShape.screen.regions`: each region contains area nodes, and each area contains component nodes.
26. Map header, contents, and bottom regions to `Screen.Header`, `Screen.Contents`, and `Screen.Bottom`.
27. `tableGenerationResult` must follow its JSON Schema and use layout ids shaped as `layout.<target>.<PatternName>`.
28. Every `tableGenerationResult` screen, region, area, and component record must include a real layout id from selected candidates.
29. RenderTree must match the provided RenderTree JSON Schema.
30. Use top-level `version`, `metadata`, and `children`. Do not use `contractVersion`, `schemaVersion`, `root`, `tree`, `nodeId`, or `componentId`.
31. Top-level `metadata` must not include `title`. Every render node `metadata` must include `id` and `title`.
32. RenderTree nodes use `node.layout` for layout pattern components.
33. Put component-specific values inside `node.props`.
34. When a source prop value is a dynamic slot written as `{token}` (often inside a template sentence with an `(예: example)` hint), express it as a bound prop `{ "bind": "<source>", "default": "<readable copy>" }`. The `default` must be human-readable display copy derived from the `(예: …)` example substituted into the template sentence, with the `(예: …)` marker stripped — never the raw `{token}`. Example: source `title: {실패축} 문제로 담지 못했어요 (예: 가입 조건)` becomes `"title": { "bind": "...failAxis", "default": "가입 조건 문제로 담지 못했어요" }`. Never emit a `default`, or any visible prop value, that is a bare unresolved `{token}`.
