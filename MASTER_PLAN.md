# RND Screen Generator 마스터 플랜

## 1. 문서 책임

이 문서는 제품 목표, 사용자 흐름, MVP 범위, 마일스톤만 정의한다.

이 문서는 프로젝트 전역 문서로 루트에 둔다. 에이전트 운영은 [AGENTS.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS.md), 변경 이력은 [AGENTS_HISTORY.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS_HISTORY.md)를 따른다.

상세 설계는 아래 문서를 참조한다.

| 주제 | 참조 문서 |
|---|---|
| 시스템 구조와 API 경계 | [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| 공급 데이터와 소비 데이터 계약 | [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md) |
| 디스플레이 프리뷰 조회 스키마 | [DISPLAY_PREVIEW_SCHEMA.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DISPLAY_PREVIEW_SCHEMA.md) |
| 작업 역할과 운영 방식 | [AGENTS.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS.md) |
| 변경 이력 | [AGENTS_HISTORY.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS_HISTORY.md) |

## 2. 제품 비전

RND Screen Generator는 정책/유즈케이스, 화면 명세, OGN/컴포넌트, 디자인 명세 JSON을 기반으로 모바일 앱 와이어프레임을 자동 생성하는 AI 화면 설계 서비스다.

초기 목표는 완성형 UI 빌더가 아니다. 내부 설계 문서를 검토 가능한 모바일 화면 초안으로 빠르게 변환하고, 사람이 screen/OGN 구조를 제한된 범위에서 후편집할 수 있게 만드는 것이 목표다.

정책서/유즈케이스 입력과 화면 명세 입력은 생명 주기에 따라 `database/client-imports/`, `database/ai-imports/`, `database/tables/`에서 관리한다. `database/client-imports`는 원천 import, `database/ai-imports`는 AI 생성 후보 산출물, `database/tables`는 승인된 소비 데이터다. 공급 reference catalog인 layout pattern store는 `@cx/pattern-store` 패키지가 소유한다. 현재는 workbench와 renderer가 직접 소비하는 소비 데이터 계약을 먼저 강화한다. `apps/web` workbench는 `database/tables` 계약 또는 동일 shape의 loader 결과만 소비한다.

현재 구현은 DB/API보다 로컬 렌더러 수직 슬라이스가 먼저 만들어진 상태다. 따라서 단기 제품 목표는 `database/tables -> @cx/engine tablesToRenderTree -> RenderTree -> @cx/engine React render -> @cx/layout/@cx/components -> apps/web` 흐름을 안정화하는 것이다. DB 적재, Agent SDK, Puck 편집은 이 수직 슬라이스가 흔들리지 않는 상태에서 단계적으로 연결한다.

컴포넌트 라이브러리는 GitHub [`ewoooo/cx-components`](https://github.com/ewoooo/cx-components.git)를 `packages/component`의 `@cx/components` 패키지로 흡수해 사용한다. spacing token의 Tailwind v4 `@theme` CSS 산출물은 `packages/token/src/generated/`에서 관리한다. 레이아웃 자산은 기존 `cx-layout` 패키지를 `packages/layout`의 `@cx/layout` 패키지로 흡수하되, 현재 `@cx/engine` 노드 타입에 맞춰 컴포넌트, 토큰, 레이아웃 패턴의 이름 체계를 맞춘다. 실제 React node 렌더링과 component mapping은 `packages/engine`의 `@cx/engine`가 담당한다.

## 2.1 현재 구현 기준

작성 기준일: 2026-05-21

| 영역 | 상태 | 현재 기준 |
|---|---|---|
| `apps/web` | 구현 시작 | Next.js 앱, Tailwind v4 global CSS, 단일 제품 앱 구조, mock data 렌더링 |
| `packages/types` | 1차 신설 | client import, PRDD runtime tree, `database/tables`, RenderTree, pattern-store 공유 타입 계약 |
| `packages/importer` | 1차 신설 | PRDD markdown parser, register, compose/decorate, table 후보 materializer |
| `packages/engine` | 1차 승격 | `database/tables` shape -> RenderTree projection, validation, React renderer |
| `packages/workflow` | 1차 구현 | 명세 정규화, 품질 검수, 반영 검증 adapter |
| `packages/agent` | 보류 | Claude/Codex/Agent SDK local-first AI 실행 adapter |
| `packages/layout` | 1차 구현 | `Screen`, `Screen.Header`, `Screen.Contents`, `Screen.Bottom`, `Layout.Flex`, `Layout.Grid`를 Tailwind v4 class 기반으로 렌더링하되 legacy `styles.css` export 정리 필요 |
| `packages/component` | 1차 이관 | `ewoooo/cx-components` 기반 leaf component 일부와 token CSS 이관 |
| `packages/token` | 1차 구현 | Tailwind v4 `@theme` generated CSS export |
| `database/client-imports` | 구현 시작 | 사용자가 올린 screen/area 원천 import 보관 |
| `services/api` | 보류 | Phase 5에서 FastAPI read model을 재시작할 때 다시 도입한다 |
| `Puck editor` | 미구현 | 디렉토리 placeholder만 존재 |
| `Agent SDK 생성/검수` | 미구현 | 정책과 문서만 존재 |
| 데이터 설계 | 재등록 | 공급 데이터/소비 데이터 분리와 소비 데이터 계약 기준 재정의 |

이 기준에 따라 MVP는 백엔드 완성형 파이프라인보다 “로컬에서 샘플 명세를 실제 모바일 화면으로 보고 검수하는 작업면”을 먼저 완성한다.

## 3. 핵심 사용자 흐름

### 3.1 현재 우선 흐름

1. 사용자가 `database/tables` 형태의 screen/OGN/component JSON을 준비한다.
2. `@cx/engine`의 `tablesToRenderTree`가 `database/tables`의 참조형 소비 데이터를 `Screen -> Screen.Header/Contents/Bottom -> Area -> Component` render projection으로 펼친다.
3. `@cx/engine` validation이 schema, metadata, screen region 계약을 검증한다.
4. `apps/web` 앱 작업면이 현재 screen, 다른 screen/OGN 목록, 관련 정보를 한 화면에 렌더링한다.
5. `@cx/layout`이 화면 chrome과 region layout을 렌더링하고, `@cx/components`가 leaf node를 렌더링한다.
6. 검증 warning과 누락 component mapping을 확인해 resolver, registry, renderer mapping을 보강한다.
7. 이 흐름이 안정화된 뒤 Claude 생성, Codex 검수, Puck 편집, DB 저장을 연결한다.

### 3.2 목표 흐름

제품의 기본 흐름은 `명세 -> 품질 검수 -> 미리보기 -> 반영` 4단계다.

1. 사용자가 정책/유즈케이스, 화면 명세, 디자인 명세 JSON 또는 screen/area 파일 묶음을 가져온다.
2. 시스템이 명세를 `database/tables` shape의 승인 전 후보로 정규화한다.
3. 시스템이 참조 무결성, renderer validation, source trace, component/pattern gap을 품질 검수한다.
4. Next.js가 후보를 모바일 화면으로 미리보기 렌더링한다.
5. 사용자가 피드백으로 화면 또는 Variant 재생성을 요청하거나 Puck 기반 후편집을 수행한다.
6. 승인된 후보와 편집 결과만 버전 있는 소비 데이터로 반영한다.
7. 공유 OGN의 발행된 수정본은 같은 OGN을 사용하는 다른 화면에도 반영된다.

### 3.3 첨부 명세 변환 시나리오

초기 수급 방식에서는 DB에 정규화된 screen/OGN 데이터가 없을 수 있으므로, 사용자가 screen/area 파일 묶음을 첨부하면 이를 화면 명세 입력 JSON으로 변환하는 흐름을 지원한다.

1. 사용자가 추후 DB read model로 대체될 `screen/`, `area/` 파일 묶음을 첨부한다.
2. 시스템이 Markdown frontmatter와 표를 먼저 파싱해 화면, 화면 구성, 화면 전환, 케이스 분기, OGN, 상태, 컴포넌트 상세 후보 데이터를 추출한다.
3. AI가 파싱 결과를 보정해 명명, 누락값, 관계, 상태명, 컴포넌트 코드, policy/function 참조를 정규화한다.
4. 시스템이 보정 결과를 `database/ai-imports/{importId}` 아래의 AI import 후보 산출물로 저장한다.
5. 후보 산출물은 품질 검수와 반영 단계를 통과한 뒤에만 `database/tables` 소비 데이터로 반영한다.

이 흐름에서 AI는 원본 전체를 자유롭게 재작성하지 않고, 명세 단계의 1차 추출 결과를 `database/tables` shape 후보로 보강하는 역할을 맡는다. 최종 후보 산출물은 `명세 -> 품질 검수 -> 미리보기 -> 반영` 순서와 `database/tables` row 계약을 기준으로 검증한다. `DraftTablesBundle`, `QualityReport`, `QualityBacklog`, `Promote`는 내부 구현 산출물 이름으로만 다룬다. 디자인 품질 보강은 반드시 `docs/design/`의 근거 문서를 참조해야 한다.

## 4. MVP 범위

### 현재 MVP 포함

- `database/tables` 구조의 screen/OGN/component 소비 데이터 관리
- `@cx/engine` 기반 `database/tables` shape -> RenderTree DTO 변환
- `@cx/engine` 기반 RenderTree schema, metadata, screen region 계약 검증
- `@cx/components`, `@cx/tokens`, `@cx/layout` 기반 모바일 렌더링
- 앱 작업면의 3가지 필수 기능: 렌더된 스크린 화면, 다른 screen/OGN 조회, 현재 렌더 화면과 관련된 screen/OGN 정보 조회
- `database/tables` 계약 또는 동일 shape의 loader 결과 기반 screen 전환과 OGN catalog 표시
- component mapping 누락 시 fallback 렌더링과 검증 정보 표시
- Vitest 기반 RenderTree/component/layout 회귀 테스트
- React hooks policy 검사

### 다음 MVP 확장

- 첨부된 screen/area 파일 묶음을 AI import 후보 산출물로 변환
- 정책/유즈케이스 기반 process/function/policy JSON을 generation context에 조합
- 디자인 명세와 component entry JSON을 renderer mapping에 반영
- screen source 목록과 상세 조회를 mock data에서 API/read model로 교체
- Claude 기반 `database/tables` shape table 후보 생성
- Codex 기반 생성 결과 검수
- 피드백 기반 regenerate
- 생성 결과와 편집 결과의 버전 저장
- Puck 기반 Screen composition 편집
- Puck 기반 OGN 내부 component 편집

### 현재 제외

- Figma 완전 연동
- 픽셀 퍼펙트 디자인 시스템 매핑
- 실시간 공동 편집
- 자유 배치형 완성형 비주얼 에디터
- 정책 준수 자동 점수화
- 운영 DB/Storage 배포
- 공유 OGN 편집본의 자동 전파
- 대규모 component inventory 전체 이관

## 5. 마일스톤

| 단계 | 상태 | 목표 |
|---|---|---|
| Phase 0 | 완료 | 문서, 운영 원칙, 저장소 구조, React hooks policy, 테스트 기반 구성 |
| Phase 1 | 완료에 가까움 | `@cx/workflow`, `@cx/engine`, `@cx/components`, `@cx/tokens`, `@cx/layout` 기반 패키지 수직 슬라이스 구성 |
| Phase 2 | 진행 중 | `apps/web` 단일 제품 앱을 `database/tables` 계약 기반으로 안정화하고 `@cx/engine` mapping 확장 |
| Phase 3 | 진행 중 | 첨부 명세 parser/validator와 AI import table 후보 산출물 연결 |
| Phase 4 | 다음 | Claude 생성 계약과 Codex 검수 계약을 local-first Agent SDK 실행 흐름으로 구현 |
| Phase 5 | 후속 | 소비 데이터 계약 기준 FastAPI read model, 운영 DB migration, ERD 산출물 재생성 |
| Phase 6 | 후속 | Puck 기반 Screen/OGN 편집과 regenerate/version 저장 |
| Phase 7 | 보류 | 공유 OGN 전파, 품질 평가, Figma 확장 검토 |

## 5.1 즉시 백로그

| 우선순위 | 작업 | 완료 기준 |
|---|---|---|
| P1 | 소비 데이터 계약 기준 FastAPI read model 초안 구현 | workbench가 mock import와 API fetch 중 하나로 동작 가능 |
| P1 | sample 데이터를 소비 계약 기준으로 보강 | `sourceRef`, state, edge variant 후보가 표현됨 |
| P2 | Puck editor 최소 프로토타입 | Screen OGN 순서 변경이 `database/tables` shape의 draft로 저장됨 |
| P2 | ERD 산출물 재생성 | 소비 데이터와 후속 DB migration 초안의 경계가 분리됨 |

## 6. 성공 기준

- 사용자가 샘플 screen route 기준으로 생성/렌더 대상을 선택할 수 있다.
- 시스템이 관련 screen, OGN, component context를 찾거나 누락 warning을 표시한다.
- `tablesToRenderTree`가 샘플 table input을 모바일 render tree로 변환한다.
- `@cx/engine` validation이 RenderTree schema와 screen region 계약을 검증한다.
- 모바일 프리뷰에서 렌더된 스크린 화면을 확인할 수 있다.
- 모바일 프리뷰에서 다른 screen과 OGN을 조회하고 이동할 수 있다.
- 모바일 프리뷰에서 현재 렌더 화면과 연결된 screen/OGN 정보를 함께 확인할 수 있다.
- `@cx/layout`과 `@cx/components`가 Tailwind v4 token 체계로 화면을 렌더링한다.
- 기본 테스트, Biome check, React hooks policy가 통과한다.

아래 기준은 현재 MVP 이후 확장 성공 기준으로 둔다.

- Claude가 `database/tables` shape의 table 후보를 생성한다.
- Codex가 생성 결과를 검수한다.
- 사용자가 Screen에서 OGN을 추가, 제거, 재정렬할 수 있다.
- 사용자가 OGN 내부 컴포넌트의 위치, 순서, Variant, Props를 수정할 수 있다.
- 사용자가 결과를 재생성할 수 있다.
- 모든 생성 결과와 편집 결과를 버전으로 다시 볼 수 있다.
- 공유 OGN 수정본이 같은 OGN을 사용하는 다른 화면에 반영된다.

## 7. 제품 리스크

| 리스크 | 대응 |
|---|---|
| 입력 JSON 품질이 일정하지 않음 | 스키마 버전과 검증 경고를 관리한다. |
| OGN 참조 누락 | 누락 참조 리포트를 제공한다. |
| AI 결과 불안정 | 구조화된 JSON 출력과 검증을 강제한다. |
| Puck 편집으로 화면 일관성이 깨짐 | 간격, 정렬, 표시 옵션은 디자인 토큰 기반 prop으로 제한한다. |
| MVP 범위 과확장 | 저충실도 모바일 와이어프레임부터 시작한다. |
