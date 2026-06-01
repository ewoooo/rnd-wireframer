# Component Proposal Checklist

반환 전 다음을 확인한다.

## P0

- 출력은 단일 JSON object이고 `schemaVersion`은 `component-proposal.v0.1`.
- 각 proposal은 `id`, `proposedComponentType`, `rationale`, `sourceEvidence`, `nearestCatalogMatch`를 갖는다.
- `sourceEvidence`의 모든 ref는 `context.sourceReferenceCatalog.allowedRefs`에 존재한다.
- `nearestCatalogMatch`는 `context.componentContractCatalog`의 component type 중 하나다.
- `proposals`는 5개 이하다.
- 어떤 제안도 카탈로그/토큰/패턴을 확정·반영하지 않는다(비파괴).

## P1

- rationale은 source 근거에 기반하고, 발명한 metric/혜택/문구를 포함하지 않는다.
- 같은 제안을 중복 나열하지 않는다.
- 카탈로그로 이미 표현 가능한 것은 제안하지 않는다(그건 generation이 처리).
