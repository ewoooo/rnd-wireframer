# Component Proposal Prompt Contract

`component-proposal` task는 카탈로그에 없지만 화면에 적합한 component/변형 후보를 **비파괴 제안**으로 산출한다. 확정·반영은 사람의 카탈로그 mutation으로만 이뤄진다.

prompt artifact는 최소한 다음을 포함한다.

- 사용자 query
- `SourceSpec`와 `context.sourceReferenceCatalog.allowedRefs`
- `context.componentContractCatalog`(최근접 매치 근거)
- 생성 후보(`context.candidate`)가 있으면 그 결과
- design-context bundle 본문(`context.designContextBundles[].body`)
- 출력은 JSON only, `schemaVersion: component-proposal.v0.1`

## 수용 규칙

- 제안은 확정이 아니다. component/token/pattern catalog를 우회해 임의 값을 확정하지 않는다.
- 각 제안은 sourceEvidence(allowedRefs 안의 ref)와 nearestCatalogMatch(componentContractCatalog 안의 type)를 반드시 갖는다.
- 최대 5개. 근거 없는 제안, 카탈로그 밖 nearestMatch, source 무관 장식 제안을 만들지 않는다.
