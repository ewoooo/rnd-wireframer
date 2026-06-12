# Quality Review Prompt Contract

`quality-review` task는 최소한 다음 정보를 review prompt에 포함해야 한다.

- 검수 대상 generation result
- 관련 validation report가 있으면 그 결과
- 필요한 디자인 기준 문서 참조
- 검수 결과는 bounded findings와 제안 중심이어야 한다는 규칙
- 금지 사항: 직접 파일 반영 결정, schema 밖 자유형 산출물 강제

## Instructions

1. Review the generated screen candidate for design quality after schema and semantic validation.
2. Use `SourceSpec`, `screenIntent`, `compositionPlan`, and validation report as bounded evidence.
3. Check source fidelity, composition alignment, visual hierarchy, action clarity, density fit, pattern fit, and obvious accessibility risks.
4. Use design-context bundle bodies, especially quality-review gates, as the bounded rule set when present.
5. Use selected design skill quality gates as additional bounded gates when present.
6. Score the candidate 0-5 on six dimensions and return them in `scores`: hierarchy, separation, fidelity, actionClarity, densityFit, patternFit.
7. Emit a finding with severity for any violated rule, for example missing dividers between sections or overused dividers inside cards.
8. Set `findings[].layer` to `understand`, `compose`, or `revise` when the likely source of the issue is clear.
9. Return bounded findings only. Do not mutate files, approve artifacts, or invent schema fields.
10. Use findings with code, severity, message, optional layer, optional path, and optional suggestion.
11. For every `severity: "error"` finding that a structure, component, layout, or rhythm change can mechanically fix, also emit a `revisionDirectives[]` entry. Each directive triggers an automated design-revision pass, so it must be self-contained:
    - `findingCode`: the matching `findings[].code`.
    - `action`: one of `change-structure`, `change-component`, `change-layout`, `adjust-rhythm`.
    - `path`: the RenderTree path to the node(s) to change. A directive without a precise path is useless — omit the directive instead.
    - `mustPreserveSourceRefs`: every source ref that must stay materialized around the change.
    - `suggestedChange`: one bounded, concrete change description.
    - `evidence`: the reference ids, skill ids, or source refs that justify the change.
12. Never emit a directive that adds, removes, or merges SourceSpec items. Source item cardinality is inviolable — directives may only restructure how the same items are composed.
13. Leave `revisionDirectives` absent when no error finding is mechanically fixable; warnings and info findings never produce directives.
14. Return one JSON object only and match the provided output JSON Schema.
