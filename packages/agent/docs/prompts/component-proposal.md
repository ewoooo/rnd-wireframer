# Component Proposal Prompt Contract

`component-proposal` task는 카탈로그에 없지만 화면에 적합한 component/변형 후보를 **비파괴 제안**으로 산출한다. 확정·반영은 사람의 카탈로그 mutation으로만 이뤄진다. 이 step은 optional side-artifact다 — 화면 생성 결과에 영향을 주지 않는다.

prompt artifact는 최소한 다음을 포함한다.

- 사용자 query
- `context.inputs.sourceSpec` (source ref와 prop 증거의 단일 진실원)
- `context.inputs.renderTree` (실제 생성된 화면 — 무엇이 격하/누락됐는지의 근거)
- `context.inputs.validationReport` (source prop 미표현 warning이 갭 신호)
- `context.inputs.qualityInspection`이 있으면 fidelity finding
- `context.references.componentCatalog` (최근접 매치 근거)
- 출력은 JSON only, `schemaVersion: component-proposal.v0.1`

## 갭 판단 기준

제안은 다음 세 조건을 모두 만족할 때만 만든다.

1. `SourceSpec`이 요구하는 상호작용/상태/표시(예: 인증 입력의 잔여시간 표시)가 있다.
2. 그 요구를 카탈로그의 어떤 component props 계약으로도, 조합으로도 표현할 수 없다.
3. 그래서 RenderTree에서 해당 요구가 격하되거나 누락됐다 (validation warning, quality fidelity finding, 또는 RenderTree 대조로 확인).

카탈로그로 이미 표현 가능한 것은 제안하지 않는다 — 그것은 generation이 처리할 일이다.

## 수용 규칙

- 제안은 확정이 아니다. component/token/pattern catalog를 우회해 임의 값을 확정하지 않는다.
- 각 제안은 sourceEvidence(`SourceSpec` 안의 ref)와 nearestCatalogMatch(componentCatalog 안의 type)를 반드시 갖는다.
- 최대 5개. 근거 없는 제안, 카탈로그 밖 nearestMatch, source 무관 장식 제안을 만들지 않는다.
- 신규 component보다 기존 component의 변형(prop 확장)으로 해결 가능하면, `nearestCatalogMatch`를 그 component로 두고 `suggestedProps`에 확장 prop을 적는다 — 승격 검토에서 변형 우선 판단의 근거가 된다.

## Instructions

1. Compare `SourceSpec` requirements against the generated RenderTree and find capabilities that were dropped or degraded because no catalog component can express them.
2. Use validation report warnings and quality fidelity findings as gap signals when present.
3. Each proposal must include `id`, `proposedComponentType`, `sourceEvidence`, `nearestCatalogMatch`, and `rationale`.
4. `sourceEvidence` must be an array of source refs that exist in the provided `SourceSpec`.
5. `nearestCatalogMatch` must be a single component type from `context.references.componentCatalog`.
6. `suggestedProps` is optional and must stay close to catalog prop vocabulary; use it to show how the nearest match would need to extend.
7. Return at most 5 proposals. Return an empty `proposals` array when no genuine gap exists.
8. Do not confirm, apply, or mutate any catalog. This is a non-binding proposal artifact.
9. Return one JSON object only and match the provided output JSON Schema.
