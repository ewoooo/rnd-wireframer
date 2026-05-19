# RND Screen Generator 에이전트 정의

## 1. 문서 책임

이 문서는 에이전트 역할, 작업 인계 방식, 완료 기준만 정의한다.

제품 범위는 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 기술 경계는 [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md), 데이터 설계는 [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md)를 따른다.

`AGENTS.md`, `MASTER_PLAN.md`, `AGENTS_HISTORY.md`는 프로젝트 전역 문서로 루트에 둔다. 세부 개발/데이터/디자인 문서는 `docs/` 아래에 둔다.

## 2. 운영 원칙

- 담당 문서의 책임 범위를 넘는 상세 내용은 참조 링크로 연결한다.
- SB/OGN 원본 JSON은 파괴적으로 수정하지 않는다.
- 생성 결과는 버전 있는 산출물로 취급한다.
- 와이어프레임 생성 AI는 Claude를 사용한다.
- 생성 결과 검수 AI는 Codex를 사용한다.
- AI 실행은 Agent SDK를 통해 호출한다.
- Claude는 로컬 세션 재개를 우선 사용하고, Codex는 로컬 CLI/런타임 실행기를 우선 사용한다.
- 로컬 실행이 없거나 실패할 때만 원격 API로 fallback한다.
- `rnd-screen-to-screen`의 `cx-components`, `cx-tokens`, `dxds-layout`은 새 프로젝트의 기반 패키지로 가져온다.
- 가져온 `dxds-layout`은 새 프로젝트에서 `cx-layout`으로 이름을 정규화한다.
- React 코드에서 `useMemo`와 `useCallback`은 기본 금지다. 렌더 비용이나 참조 안정성이 실제 문제가 되면 먼저 컴포넌트 경계, state 위치, 데이터 변환 위치를 조정한다.
- `useMemo`/`useCallback` 금지는 `scripts/check-react-hooks-policy.mjs`로 강제한다.
- DB 관계 검토와 ERD 산출물은 `drawdb`를 사용한다.
- drawdb 산출물은 `docs/drawdb/` 아래에 둔다.
- 중요한 결정과 완료 작업은 [AGENTS_HISTORY.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS_HISTORY.md)에 기록한다.

## 3. 디자인 패턴 문서

SKT SDUI 디자인 패턴 문서는 책임 단위로 분리되어 있다.

출처:

- Figma `SKT_SDUI_Test_0513_2` — `pattern-guide` 페이지, node `12002:21853`
- 분석 기준: 36개 스크린, 755개 컴포넌트 인스턴스, 74종 컴포넌트 유형
- 작성일: 2026-05-13

| 문서 | 책임 |
|---|---|
| [COMPOSITION_LAYERS.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/COMPOSITION_LAYERS.md) | Component → Pattern → Organism → Screen 조합 원칙 |
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
- 구현 패키지 기준은 `cx-tokens`, `cx-components`, `cx-layout`을 따른다.

## 4. 에이전트 역할

| 에이전트 | 책임 | 기준 문서 |
|---|---|---|
| Product Planner Agent | 제품 범위, 사용자 흐름, 마일스톤 | [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md) |
| Architecture Agent | 서비스 경계, API 표면, 모듈 구조 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| Data Agent | SB/OGN JSON, 관계형 DB, drawdb ERD, 적재 전략 | [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md) |
| Backend Agent | FastAPI 구현, 검증, 생성 오케스트레이션 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| Frontend Agent | Next.js UI, 모바일 미리보기, Puck 기반 OGN 섹션 편집, 재생성 흐름 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| Claude Generation Agent | Claude 기반 와이어프레임 JSON 생성 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| Codex Review Agent | Codex 기반 생성 결과 검수 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| Agent Runtime Agent | Agent SDK, 로컬 세션 우선 실행, API fallback 관리 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| QA Agent | 인수 조건, 회귀 검증, 생성 결과 검증 | [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md) |
| Documentation Agent | 문서 책임 분리와 변경 기록 관리 | 현재 문서와 [AGENTS_HISTORY.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS_HISTORY.md) |
| Design System Agent | SDUI 패턴, spacing, component inventory 관리 | 현재 문서의 디자인 패턴 문서 목록 |

## 5. 작업 인계 형식

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

## 6. 완료 기준

- 결과가 기준 문서와 충돌하지 않는다.
- 중복 설명이 생기면 상세 문서 하나에만 남기고 나머지는 참조한다.
- 구현 또는 문서 변경이 검증됐다.
- 필요한 경우 변경 이력이 기록됐다.

## 7. 초기 백로그

| 우선순위 | 담당 | 작업 |
|---|---|---|
| P0 | Data Agent | SB/OGN JSON Schema 확정 |
| P0 | Data Agent | drawdb 기반 ERD 초안 작성 |
| P0 | Data Agent | Supabase 마이그레이션 초안 작성 |
| P0 | Backend Agent | JSON 검증/정규화 프로토타입 구현 |
| P1 | Backend Agent | SB to OGN 연결 프로토타입 구현 |
| P1 | Frontend Agent | 화면 목록/상세/생성 흐름 구현 |
| P1 | Frontend Agent | `cx-components`, `cx-tokens`, `cx-layout` 패키지 이전 및 import 경계 정리 |
| P1 | Frontend Agent | React hooks policy를 lint/CI 흐름에 연결 |
| P1 | Claude Generation Agent | 첫 와이어프레임 JSON 생성 계약 구현 |
| P1 | Codex Review Agent | 생성 결과 검수 기준 구현 |
| P1 | Agent Runtime Agent | Agent SDK 로컬 세션 우선 실행 전략 구현 |
| P2 | Frontend Agent | Puck 기반 `generated_organisms` 섹션 편집 프로토타입 구현 |
| P2 | QA Agent | 샘플 문서 기반 인수 테스트 작성 |
