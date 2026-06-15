# Component Proposal Prompt Contract

`component-proposal` task는 카탈로그에 없지만 화면에 적합한 component/변형 후보를 **비파괴 제안**으로 산출한다. 확정·반영은 사람의 카탈로그 mutation으로만 이뤄진다. 이 step은 optional side-artifact다 — 화면 생성 결과에 영향을 주지 않는다.

prompt artifact는 최소한 다음을 포함한다.

- 사용자 query
- `context.inputs.sourceSpec` (source ref와 prop 증거의 단일 진실원)
- `context.inputs.compositionPlan` (`catalogGaps`가 ux-improvement 제안의 1차 근거)
- `context.inputs.renderTree` (실제 생성된 화면 — 무엇이 격하/누락됐는지의 근거)
- `context.inputs.validationReport` (source prop 미표현 warning이 갭 신호)
- `context.inputs.qualityInspection`이 있으면 fidelity finding
- `context.references.componentCatalog` (최근접 매치 근거)
- `context.references.referenceCatalog` / `referenceAreaCatalog` (채택하려던 정답지 패턴 확인용)
- 출력은 JSON only, `schemaVersion: component-proposal.v0.1`

## 두 종류의 제안 (kind)

각 제안은 `kind`로 성격을 명시한다.

### kind: "source-gap" — 소스 요구의 격하

다음 세 조건을 모두 만족할 때만 만든다.

1. `SourceSpec`이 요구하는 상호작용/상태/표시(예: 인증 입력의 잔여시간 표시)가 있다.
2. 그 요구를 카탈로그의 어떤 component props 계약으로도, 조합으로도 표현할 수 없다.
3. 그래서 RenderTree에서 해당 요구가 격하되거나 누락됐다 (validation warning, quality fidelity finding, 또는 RenderTree 대조로 확인).

`sourceEvidence`(SourceSpec ref)가 반드시 있어야 한다. `referenceEvidence`는 비운다.

### kind: "ux-improvement" — 더 나은 정답지 패턴의 카탈로그 부재

소스가 명시하진 않았으나, 채택하면 화면이 더 나아지는 정답지(reference) 패턴이 카탈로그에 컴포넌트가 없어 평면 어휘로 격하된 경우다. 판단 기준:

1. `compositionPlan.catalogGaps`에 기록된 항목이 있거나, reference 카탈로그에 이 화면 상황에 더 맞는 패턴이 있는데 그 컴포넌트가 카탈로그에 없다.
2. 그래서 RenderTree가 정답지 패턴 대신 단순 조합(예: 텍스트 인풋 나열)으로 격하됐다.

`referenceEvidence`(reference id, `referenceCatalog`/`referenceAreaCatalog` 또는 `catalogGaps[].referenceIds`에 존재)가 반드시 있어야 한다 — 근거 없는 "그냥 더 나아 보임" 발명은 금지다. `sourceEvidence`는 관련 소스 ref가 있으면 채우되 없어도 된다.

## 수용 규칙

- 제안은 확정이 아니다. component/token/pattern catalog를 우회해 임의 값을 확정하지 않는다.
- 각 제안은 `kind`, `proposedComponentType`, `nearestCatalogMatch`(componentCatalog 안의 type), `rationale`을 반드시 갖는다.
- source-gap은 `sourceEvidence`, ux-improvement는 `referenceEvidence`를 비워둘 수 없다.
- 최대 5개. 근거 없는 제안, 카탈로그 밖 nearestMatch, source/reference 무관 장식 제안을 만들지 않는다.
- 신규 component보다 기존 component의 변형(prop 확장)으로 해결 가능하면, `nearestCatalogMatch`를 그 component로 두고 `suggestedProps`에 확장 prop을 적는다 — 승격 검토에서 변형 우선 판단의 근거가 된다.

## Instructions

1. Read `compositionPlan.catalogGaps` first — each gap is a ready-made ux-improvement candidate (desiredPattern + referenceIds + reason).
2. Compare `SourceSpec` requirements against the generated RenderTree and find capabilities dropped or degraded because no catalog component can express them (source-gap candidates).
3. Use validation report warnings and quality fidelity findings as gap signals when present.
4. Each proposal must include `id`, `kind`, `proposedComponentType`, `nearestCatalogMatch`, and `rationale`.
5. For `kind: "source-gap"`, `sourceEvidence` must be an array of source refs that exist in the provided `SourceSpec`.
6. For `kind: "ux-improvement"`, `referenceEvidence` must be an array of reference ids that exist in `referenceCatalog`/`referenceAreaCatalog` or in `compositionPlan.catalogGaps[].referenceIds`.
7. `nearestCatalogMatch` must be a single component type from `context.references.componentCatalog`.
8. `suggestedProps` is optional and must stay close to catalog prop vocabulary; use it to show how the nearest match would need to extend.
9. Return at most 5 proposals. Return an empty `proposals` array when no genuine gap exists.
10. Do not confirm, apply, or mutate any catalog. This is a non-binding proposal artifact.
11. Return one JSON object only and match the provided output JSON Schema.
