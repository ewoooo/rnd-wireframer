---
id: component-proposal
kind: skill
family: task
stages:
  - review
tasks:
  - component-proposal
role: proposal-gate
priority: required
whenToUse: "Use when emitting non-binding component proposals for catalog gaps found after generation."
tags:
  - component-proposal
  - catalog-gap
---

# Component Proposal Checklist

반환 전 다음을 확인한다.

## P0

- 출력은 단일 JSON object이고 `schemaVersion`은 `component-proposal.v0.1`.
- 각 proposal은 `id`, `proposedComponentType`, `rationale`, `sourceEvidence`, `nearestCatalogMatch`를 갖는다.
- `sourceEvidence`의 모든 ref는 `SourceSpec`의 source ref에 존재한다.
- `nearestCatalogMatch`는 `context.references.componentCatalog`의 component type 중 하나다.
- `proposals`는 5개 이하다.
- 어떤 제안도 카탈로그/토큰/패턴을 확정·반영하지 않는다(비파괴).

## P1

- rationale은 source 근거에 기반하고, 발명한 metric/혜택/문구를 포함하지 않는다.
- 같은 제안을 중복 나열하지 않는다.
- 카탈로그로 이미 표현 가능한 것은 제안하지 않는다(그건 generation이 처리).

## Output Contract

- 출력은 단일 JSON object다. HTML/CSS/Markdown fence/설명 prose 금지.
- `schemaVersion`은 `component-proposal.v0.1`.
- `proposals`는 배열이며 최대 5개.

각 proposal 필드:

| 필드 | 필수 | 설명 |
|---|---|---|
| `id` | O | 제안 식별자 |
| `proposedComponentType` | O | 제안하는 신규 component/변형의 이름(type) |
| `rationale` | O | 왜 이 화면에 필요한지 (source 근거 기반) |
| `sourceEvidence` | O | `SourceSpec`의 source ref 안의 ref 1개 이상 |
| `nearestCatalogMatch` | O | 문자열. `context.references.componentCatalog` 안의 component type 하나(객체 아님) |
| `suggestedProps` | X | 제안 props(객체). 카탈로그 prop 어휘를 우선 참고 |

- 제안만 한다. 어떤 것도 확정·반영하지 않는다.
- schema 밖 필드를 추가하지 않는다.
