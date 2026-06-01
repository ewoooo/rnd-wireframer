# Component Proposal Output Contract

- 출력은 단일 JSON object다. HTML/CSS/Markdown fence/설명 prose 금지.
- `schemaVersion`은 `component-proposal.v0.1`.
- `proposals`는 배열이며 최대 5개.

각 proposal 필드:

| 필드 | 필수 | 설명 |
|---|---|---|
| `id` | O | 제안 식별자 |
| `proposedComponentType` | O | 제안하는 신규 component/변형의 이름(type) |
| `rationale` | O | 왜 이 화면에 필요한지 (source 근거 기반) |
| `sourceEvidence` | O | `context.sourceReferenceCatalog.allowedRefs` 안의 ref 1개 이상 |
| `nearestCatalogMatch` | O | `context.componentContractCatalog` 안의 가장 가까운 component type |
| `suggestedProps` | X | 제안 props(객체). 카탈로그 prop 어휘를 우선 참고 |

- 제안만 한다. 어떤 것도 확정·반영하지 않는다.
- schema 밖 필드를 추가하지 않는다.
