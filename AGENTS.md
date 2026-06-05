# RND Screen Generator 에이전트 정의

## 1. 문서 책임

이 문서는 에이전트 역할, 작업 인계 방식, 완료 기준만 정의한다.

제품 방향성은 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 패키지 책임과 관계망은 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md), 저장소 구조와 패키지 경계는 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md)를 따른다. 디자인 패턴 기준은 이 문서의 디자인 패턴 문서 목록을 따른다.
Claude 실행 계약은 [AGENT_RUNTIME_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/AGENT_RUNTIME_PROTOCOL.md), pipeline stage/runtime 계약은 [PIPELINE_STAGE_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STAGE_PROTOCOL.md)를 따른다.

`AGENTS.md`, `MASTER_PLAN.md`, `PACKAGE_MAP.md`, `AGENTS_HISTORY.md`는 프로젝트 전역 문서로 루트에 둔다. 세부 개발/데이터/디자인 문서는 `docs/` 아래에 둔다.

## 2. 운영 원칙

- 담당 문서의 책임 범위를 넘는 상세 내용은 참조 링크로 연결한다.
- 수급 원본 JSON과 mock 입력 JSON은 파괴적으로 수정하지 않는다.
- 생성 결과는 버전 있는 산출물로 취급한다.
- 화면 table 후보 생성 AI는 Claude를 사용한다.
- 생성 결과 검수 AI도 Claude를 사용한다.
- AI 실행은 Claude Agent SDK를 통해 호출한다.
- Claude는 로컬 실행을 우선 사용하되 기본 생성 요청은 새 세션으로 실행한다. 기존 세션 재개는 명시적 재시도, 검수 반영, 이어쓰기 흐름에서만 옵션으로 사용한다.
- 로컬 실행이 없거나 실패할 때만 원격 API로 fallback한다.
- `@cx/agent`가 참조하는 생성/검수 프롬프트, 체크리스트, 출력 규약은 `packages/agent/docs/`에서 독립 관리한다.
- 생성 관련 문장형 참조 자산은 smoke/pipeline 실험에서도 `packages/agent/docs/`의 정본을 참조한다.
- 컴포넌트 라이브러리는 GitHub [`ewoooo/cx-components`](https://github.com/ewoooo/cx-components.git)를 `packages/component`의 `@cx/components` 패키지로 흡수해 사용한다.
- 컴포넌트별 prop, variant, AI 작성 가능 surface 계약 타입과 실제 catalog 값은 `packages/component`의 `@cx/components/catalog`에서 관리한다.
- spacing token의 Tailwind v4 `@theme` 산출물은 `packages/token/src/generated/`에서 관리하고, `@cx/components/tailwind.css`는 이를 참조한다.
- `@cx/tokens`의 공개 소비 표면은 `@cx/tokens`, `@cx/tokens/variables.css`, `@cx/tokens/tailwind.css`로 제한한다. `packages/token/src/generated/*`와 `packages/token/src/internal/*`는 직접 import하지 않는다.
- 컴포넌트 토큰은 `@cx/components`의 `--skt-component-*` alias만 소유하고, foundation/semantic 값은 `@cx/tokens`를 참조한다.
- `@cx/tokens`와 기존 `cx-layout` 기반 레이아웃 자산은 새 프로젝트의 기반 패키지로 가져온다.
- 가져온 `cx-layout`은 새 프로젝트에서 `packages/layout`의 `@cx/layout` 패키지로 흡수한다.
- 재설계 기간에는 `@cx/agent`를 Claude Agent SDK 실행 adapter로만 운영한다. `@cx/layout-pattern-store`는 layout pattern reference catalog로 운영하되 내부 타입과 schema를 자체 소유한다. `@cx/importer`, `@cx/types`, `@cx/workflow` 패키지는 새 설계가 확정될 때까지 운영하지 않는다.
- `packages/schema`의 `@cx/schema` 패키지는 generation pipeline 전반의 DTO/schema 계약 SSOT로 운영한다. 외부 패키지는 root export만 사용하고 내부 파일, 공개되지 않은 subpath, JSON schema 파일을 직접 import하지 않는다. schemaVersion에는 `generation-v2` 같은 flow 이름을 넣지 않고 `source-spec.v0.1`처럼 artifact-local 버전명을 사용한다.
- `packages/renderer`의 `@cx/renderer` 패키지는 RenderTree JSON -> React render 런타임만 관리한다. table projection, schema validation, materializer, AI 실행 책임을 두지 않는다.
- `packages/adapters`의 `@cx/adapters/markdown` subpath는 Markdown/source 입력을 SourceSpec으로 정규화하는 순수 함수만 관리한다. 파일 읽기/쓰기, Claude 실행, RenderTree 생성, 검증 rule 판정, catalog 값 소유 책임을 두지 않는다.
- `packages/adapters`의 `@cx/adapters/table` subpath는 table/read model을 screen 단위 `RenderTreeScreenNode`로 조립하는 순수 함수만 관리한다. 파일 IO, React render, layout 선택, pattern 추천, spacing 보정, validation rule 판정 책임을 두지 않는다.
- `packages/inference-nodes`의 `@cx/inference-nodes` 패키지는 pipeline stage에서 실행할 node wrapper와 screen-generation 순수 입력 조립/next action helper를 담당한다. pipeline 실행, stage 순서 소유, 파일 쓰기, Claude runner 구현, 검증 rule 판정, React render 책임을 두지 않는다.
- `packages/validation`의 `@cx/validation` 패키지는 `@cx/schema` JSON Schema, DTO, component reference, layout pattern reference, token reference 검증을 순수 함수로 수행하고 검증 결과만 반환한다. 파일 쓰기, retry 정책, stage transition, React render 책임을 두지 않는다.
- `packages/pipeline`의 `@cx/pipeline` 패키지는 pipeline runtime과 승인된 side effect/IO 유틸리티로 운영한다. stage별 순수 helper rule 소유, 검증 rule 판정, Claude adapter 구현, RenderTree render, catalog 값 소유, mock 원본 수정 책임을 두지 않는다.
- React 코드에서 `useMemo`와 `useCallback`은 기본 금지다. 렌더 비용이나 참조 안정성이 실제 문제가 되면 먼저 컴포넌트 경계, state 위치, 데이터 변환 위치를 조정한다.
- `useMemo`/`useCallback` 금지는 `scripts/check-react-hooks-policy.mjs`로 강제한다.
- 문자열 literal 기반 hardcoded `switch`/`if`-chain 매핑은 원천적으로 금지한다. 같은 키 도메인을 분기하는 코드가 두 군데 이상 나타나면 그건 계약(contract) 테이블이 누락됐다는 신호다. 그런 분기가 필요해지면 직접 switch를 쓰지 말고 **계약 테이블을 어디에 둘지부터 요청**한다. 예: `componentCatalog`(컴포넌트 prop 계약), `layout-pattern-store`(패턴 매칭), `componentRendererKinds`(렌더러 매핑). 분기 로직은 계약 테이블 조회 + 일반 helper로 표현한다.
- 재설계 예시 계약과 JSON Schema는 `@cx/schema`와 관련 테스트/문서에서 관리하고, 런타임 데이터와 섞지 않는다.
- screen generation의 최종 결과물은 `final-result.json`에 저장되는 RenderTree JSON이다. 테이블 반영은 이 RenderTree를 screen, area, composite/component 레이어로 분해해 등록하는 apply 단계만 수행한다.
- 기존 `database/client-imports`, `database/ai-imports`, `database/tables` 기반 생성/반영 흐름은 새 설계가 확정될 때까지 활성 패키지 책임으로 보지 않는다.
- component interaction은 문자열 `events`가 아니라 `hooks: NodeHook[]` 계약을 사용한다. 첨부 명세의 이벤트/액션/액션 파라미터는 `raw.hooks`로 구조화한다.
- 기능 개발을 수행할 때는 변경된 동작, 계약, 사용법, 결정 사항을 관련 문서에 함께 반영한다.
- 중요한 결정과 완료 작업은 [AGENTS_HISTORY.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS_HISTORY.md)에 기록한다.

## 3. 재설계 기준

현재 생성 과정은 재설계 중이며, 기존 table 후보 생성/검수/반영 패키지 경계는 제거된 상태다.

```text
Markdown Source
-> @cx/adapters/markdown SourceSpec
-> 새 생성 과정 설계
-> RenderTree JSON
-> @cx/renderer React render
```

운영 기준:

- `@cx/renderer`은 RenderTree JSON을 React로 렌더링하는 책임만 가진다.
- `@cx/adapters/markdown`는 SourceSpec 정규화만 담당하고, table projection, schema validation, workflow orchestration, AI runner 책임은 두지 않는다.
- 재설계 예시 계약과 JSON Schema는 `@cx/schema`와 관련 테스트/문서에서 단계별로 관리한다.
- 새 생성 과정이 확정되기 전까지 old pipeline 호환 layer를 다시 만들지 않는다.
- table apply/projection은 최종 RenderTree를 screen, area, composite/component 레이어로 분해해 등록하는 후속 단계로만 취급한다.

## 4. 디자인 패턴 문서

SKT SDUI 디자인 패턴 문서는 책임 단위로 분리되어 있다.

출처:

- Figma `SKT_SDUI_Test_0513_2` — `pattern-guide` 페이지, node `12002:21853`
- 분석 기준: 36개 스크린, 755개 컴포넌트 인스턴스, 74종 컴포넌트 유형
- 작성일: 2026-05-13

| 문서 | 책임 |
|---|---|
| [COMPOSITION_LAYERS.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/COMPOSITION_LAYERS.md) | Component → Pattern → Area → Screen 조합 원칙 |
| [LAYOUT_SPACING_CONTRACT.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/LAYOUT_SPACING_CONTRACT.md) | width rail, chrome size, spacing, measurement contract |
| [SECTION_PATTERNS.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/SECTION_PATTERNS.md) | 메인/리스트/상세/폼/완료/바텀시트/팝업 섹션별 케이스 패턴 |
| [SCREEN_PATTERN_SUMMARY.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/SCREEN_PATTERN_SUMMARY.md) | 36개 스크린 분석 요약과 8가지 화면 구성 패턴 |
| [COMPONENT_INVENTORY.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/COMPONENT_INVENTORY.md) | 컴포넌트 사용 빈도, 중첩 패턴, 카테고리 분류 |
| [INTERACTION_PATTERNS.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/INTERACTION_PATTERNS.md) | Accordion, CTA, Form, Overlay 상태/상호작용 규칙 |
| [VISUAL_FOUNDATION_OBSERVATIONS.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/VISUAL_FOUNDATION_OBSERVATIONS.md) | Divider, typography, 핵심 설계 관찰값 |

디자인 문서 운영 원칙:

- 새 패턴을 추가할 때는 해당 책임 문서에만 상세를 작성한다.
- `AGENTS.md`에는 디자인 문서 목록과 운영 기준만 유지한다.
- 레이아웃 수치나 컴포넌트 목록을 중복 기재하지 않는다.
- 정식 디자인 토큰의 원천은 `DESIGN_FOUNDATION.md`를 따른다.
- 구현 패키지 기준은 `@cx/tokens`, `@cx/components`, `@cx/layout`을 따른다.

## 5. 에이전트 역할

| 에이전트 | 책임 | 기준 문서 |
|---|---|---|
| Product Planner Agent | 제품 범위, 사용자 흐름, 마일스톤 | [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md) |
| Architecture Agent | 서비스 경계, API 표면, 모듈 구조 | [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md) |
| Data Agent | 공급 데이터, 소비 데이터, 생성 컨텍스트, 후속 DB/read model 경계 | 현재 문서와 `@cx/schema` 계약 |
| Backend Agent | FastAPI 구현, 검증, 생성 오케스트레이션 | 현재 문서와 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md) |
| Frontend Agent | Next.js UI, 모바일 미리보기, Puck 기반 Screen/OGN 편집, 재생성 흐름 | 현재 문서와 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md) |
| Claude Generation Agent | Claude 기반 RenderTree 후보 생성 | 현재 문서와 `@cx/schema` 계약 |
| Claude Review Agent | Claude 기반 생성 결과 검수 | 현재 문서와 `@cx/schema` 계약 |
| Agent Runtime Agent | Claude Agent SDK, 로컬 실행 우선, API fallback 관리 | 현재 문서와 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md) |
| QA Agent | 인수 조건, 회귀 검증, 생성 결과 검증 | [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md) |
| Documentation Agent | 문서 책임 분리와 변경 기록 관리 | 현재 문서와 [AGENTS_HISTORY.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS_HISTORY.md) |
| Design System Agent | SDUI 패턴, spacing, component inventory 관리 | 현재 문서의 디자인 패턴 문서 목록 |

## 6. 작업 인계 형식

작업을 다른 에이전트나 사람에게 넘길 때 아래 형식을 사용한다.

- 작업: 해야 할 일
- 기준 문서: 반드시 따라야 하는 문서
- 기대 산출물: 완료 시 만들어져야 하는 결과
- 검증 방법: 완료 여부를 확인하는 방법
- 열린 이슈: 아직 결정되지 않았거나 후속 확인이 필요한 내용

```markdown
## 작업

## 기준 문서

## 기대 산출물

## 검증 방법

## 열린 이슈
```

## 7. 완료 기준

- 결과가 기준 문서와 충돌하지 않는다.
- 중복 설명이 생기면 상세 문서 하나에만 남기고 나머지는 참조한다.
- 구현 또는 문서 변경이 검증됐다.
- 필요한 경우 변경 이력이 기록됐다.

## 8. 현재 백로그

| 우선순위 | 담당 | 작업 |
|---|---|---|
| P1 | Backend Agent | 소비 데이터 계약 기준 FastAPI read model 초안 구현 |
| P1 | Data Agent | sample 데이터를 `sourceRef`, state, edge variant 후보까지 소비 계약 기준으로 보강 |
| P2 | Frontend Agent | Puck 기반 Screen composition/OGN component 편집 프로토타입 구현 |
| P2 | Agent Runtime Agent | Claude 생성/검수 local-first Agent SDK 실행 전략 구현 |
