# RND Screen Generator 에이전트 정의

## 1. 문서 책임

이 문서는 에이전트 역할, 작업 인계 방식, 완료 기준만 정의한다.

제품 범위는 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 기술 경계는 [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md), 데이터 설계는 [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md)를 따른다.

`AGENTS.md`, `MASTER_PLAN.md`, `AGENTS_HISTORY.md`는 프로젝트 전역 문서로 루트에 둔다. 세부 개발/데이터/디자인 문서는 `docs/` 아래에 둔다.

## 2. 운영 원칙

- 담당 문서의 책임 범위를 넘는 상세 내용은 참조 링크로 연결한다.
- 수급 원본 JSON과 mock 입력 JSON은 파괴적으로 수정하지 않는다.
- 생성 결과는 버전 있는 산출물로 취급한다.
- 화면 table 후보 생성 AI는 Claude를 사용한다.
- 생성 결과 검수 AI는 Codex를 사용한다.
- AI 실행은 Agent SDK를 통해 호출한다.
- Claude는 로컬 실행을 우선 사용하되 기본 생성 요청은 새 세션으로 실행한다. 기존 세션 재개는 명시적 재시도, 검수 반영, 이어쓰기 흐름에서만 옵션으로 사용한다.
- Codex는 로컬 CLI/런타임 실행기를 우선 사용한다.
- 로컬 실행이 없거나 실패할 때만 원격 API로 fallback한다.
- 컴포넌트 라이브러리는 GitHub [`ewoooo/cx-components`](https://github.com/ewoooo/cx-components.git)를 `packages/component`의 `@cx/components` 패키지로 흡수해 사용한다.
- 컴포넌트별 prop, variant, AI 작성 가능 surface 계약은 `packages/renderer/src/component-catalog.ts`의 `component-catalog`에서 관리하고 compose/AI/editor가 이를 참조한다.
- spacing token의 Tailwind v4 `@theme` 산출물은 `packages/token/src/generated/`에서 관리하고, `@cx/components/tailwind.css`는 이를 참조한다.
- `@cx/tokens`와 기존 `cx-layout` 기반 레이아웃 자산은 새 프로젝트의 기반 패키지로 가져온다.
- 가져온 `cx-layout`은 새 프로젝트에서 `packages/layout`의 `@cx/layout` 패키지로 흡수한다.
- 공유 row/pattern 계약 타입은 `packages/types`의 `@cx/types` 패키지에서 관리한다.
- `sdui-renderer`의 schema, binding, registry, validation, table shape -> RenderTree projection, React 렌더링 패턴은 `packages/renderer`의 `@cx/renderer` 패키지에서 관리한다.
- React 코드에서 `useMemo`와 `useCallback`은 기본 금지다. 렌더 비용이나 참조 안정성이 실제 문제가 되면 먼저 컴포넌트 경계, state 위치, 데이터 변환 위치를 조정한다.
- `useMemo`/`useCallback` 금지는 `scripts/check-react-hooks-policy.mjs`로 강제한다.
- 문자열 literal 기반 hardcoded `switch`/`if`-chain 매핑은 원천적으로 금지한다. 같은 키 도메인을 분기하는 코드가 두 군데 이상 나타나면 그건 계약(contract) 테이블이 누락됐다는 신호다. 그런 분기가 필요해지면 직접 switch를 쓰지 말고 **계약 테이블을 어디에 둘지부터 요청**한다. 예: `componentCatalog`(컴포넌트 prop 계약), `pattern-store`(패턴 매칭), `componentRendererKinds`(렌더러 매핑). 분기 로직은 계약 테이블 조회 + 일반 helper로 표현한다.
- 원천 import는 `database/client-imports/`, AI import 후보 산출물은 `database/ai-imports/`, 승인된 소비 데이터 테이블 덤프는 [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md)의 `database/tables/*.json` 계약을 우선 따른다.
- `database/tables`는 workbench와 renderer가 소비하는 승인 데이터만 둔다. parser, AI 생성 API, agent pipeline은 이 디렉토리를 직접 덮어쓰지 않고 `database/ai-imports/*.materialized.json` 후보를 만든 뒤 별도 promote/import 단계로 반영한다.
- AI generation 산출물 계약은 `GeneratedNodeTree -> RegisteredNodeTree -> ComposedNodeTree -> DecoratedNodeTree -> DesignReview patch -> ReviewedDecoratedNodeTree -> MaterializedNodeTree` 순서로 본다. `ComposedNodeTree` 이후에는 `raw`와 pending placeholder를 남기지 않는다. Design Review patch는 반드시 `docs/design/` 책임 문서를 근거로 제한된 operation만 제안한다.
- component interaction은 문자열 `events`가 아니라 `hooks: NodeHook[]` 계약을 사용한다. 첨부 명세의 이벤트/액션/액션 파라미터는 `raw.hooks`로 구조화한 뒤 compose에서 `component.hooks`로 승격한다.
- 기능 개발을 수행할 때는 변경된 동작, 계약, 사용법, 결정 사항을 관련 문서에 함께 반영한다.
- 중요한 결정과 완료 작업은 [AGENTS_HISTORY.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS_HISTORY.md)에 기록한다.

## 3. RenderTree Projection 책임 분리

첨부 screen/area 명세 또는 DB read model을 `database/tables` shape와 `@cx/renderer` RenderTree 입력 DTO로 바꿀 때는 AI와 deterministic code의 책임을 분리한다.

기본 흐름은 아래 순서를 따른다.

```text
코드가 database/tables shape의 기본 row를 만든다
-> AI가 props/data binding/상태/표현 후보를 보정한다
-> 코드가 다시 검증하고 @cx/renderer가 RenderTree로 projection한다
```

AI가 직접 판단하거나 보정하는 영역:

- 어떤 OGN을 `Screen.Header`, `Screen.Contents`, `Screen.Bottom` 중 어디에 놓을지 애매한 경우 판단
- component props 기본값 생성
- component hooks 기본값 또는 raw hook 구조 보정
- data binding path 추천
- 상태별 visible children 정리
- “약관 목록 조회” 같은 설명을 실제 렌더 노드 `title`/`description`으로 풀기

코드가 deterministic하게 처리해야 하는 영역:

- `Screen` 아래 `Screen.Header`, `Screen.Contents`, `Screen.Bottom` 3영역 생성
- `screenSource.areas` 순서 유지
- `areaCode` 유지
- node/table `id`, `metadata.title`, version, schema version 생성
- `@cx/renderer`의 `tablesToRenderTree` projection과 validation 실행
- component registry 존재 확인
- 누락 참조 리포트 생성

AI가 RenderTree 전체를 자유롭게 생성하는 방식을 기본으로 두지 않는다. AI는 파서와 database resolver가 만든 구조화 결과를 보정하고, 최종 후보 산출물은 `database/tables` shape를 거쳐 `@cx/renderer` projection/validation을 통과해야 한다. RenderTree는 저장/편집 원본이 아니라 renderer 입력 DTO다.

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
| Architecture Agent | 서비스 경계, API 표면, 모듈 구조 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| Data Agent | 공급 데이터, 소비 데이터, 생성 컨텍스트, 후속 DB/read model 경계 | [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md) |
| Backend Agent | FastAPI 구현, 검증, 생성 오케스트레이션 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| Frontend Agent | Next.js UI, 모바일 미리보기, Puck 기반 Screen/OGN 편집, 재생성 흐름 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| Claude Generation Agent | Claude 기반 `database/tables` shape table 후보 생성 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| Codex Review Agent | Codex 기반 생성 결과 검수 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| Agent Runtime Agent | Agent SDK, 로컬 실행 우선, API fallback 관리 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
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
| P2 | Agent Runtime Agent | Claude 생성/Codex 검수 local-first Agent SDK 실행 전략 구현 |
