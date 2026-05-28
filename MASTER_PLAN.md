# RND Screen Generator 마스터 플랜

## 1. 문서 책임

이 문서는 제품 방향성, 설계 원칙, 단계별 고도화 목표만 정의한다.

에이전트 운영 기준은 [AGENTS.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS.md), 패키지 관계망은 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md), 패키지 경계와 저장소 구조는 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md), 변경 이력은 [AGENTS_HISTORY.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS_HISTORY.md)를 따른다.

이 문서는 상세 API, 타입, 파일 구조, 디자인 수치를 중복해서 정의하지 않는다. 세부 내용은 각 책임 문서와 패키지 README에서 관리한다.

## 2. 제품 방향

RND Screen Generator는 수급 명세와 디자인 시스템 근거를 바탕으로 모바일 화면 후보를 생성하고, 검증하고, 미리보기 가능한 산출물로 관리하는 도구다.

핵심 목표는 빠른 화면 초안 생성이 아니라 **검증 가능한 화면 생성 흐름**이다. 생성 결과는 사람이 이어서 판단하고 수정할 수 있어야 하며, 어떤 근거와 계약을 통해 만들어졌는지 추적 가능해야 한다.

## 3. 핵심 원칙

- 생성 입력, 중간 산출물, 검증 결과, 미리보기 입력은 명시적 데이터 계약으로 전달한다.
- pipeline 전반 DTO/schema 계약의 정본은 `@cx/schema`에서 관리한다.
- Markdown/source 입력은 `@cx/parser`에서 SourceSpec으로 정규화한 뒤 생성 흐름에 전달한다.
- 하위 패키지는 가능하면 입력값을 받아 결과값을 반환하는 순수 함수형 API를 우선한다.
- 파일 저장, 승인 반영, CLI 실행, 외부 저장소 동기화 같은 side effect와 pipeline runtime은 `@cx/pipeline` 경계에 둔다.
- 생성/검수/미리보기/반영 stage의 순수 입력 조립과 next action helper는 `@cx/orchestration`에서 다룬다.
- DTO, component reference, layout pattern reference, token reference 검증은 `@cx/validation`에서 결과 리포트로만 반환한다.
- Claude 실행은 `@cx/agent`가 담당하며, 생성과 검수 모두 Claude 기반으로 운영한다.
- React render는 `@cx/renderer`가 RenderTree JSON을 렌더링하는 책임만 가진다.
- component, layout, token, layout pattern 값은 각 소유 패키지의 public API와 README를 기준으로 소비한다.
- mock schema는 `docs/development/mock-schemas/generation-v2/`에 두고 런타임 데이터와 섞지 않는다.

## 4. 목표 흐름

```text
Markdown Source
-> @cx/parser SourceSpec
-> @cx/pipeline runtime
-> @cx/orchestration stage input helper
-> @cx/agent Claude generation
-> Draft Candidate
-> @cx/validation validation report
-> @cx/orchestration next action helper
-> RenderTree JSON
-> @cx/renderer preview render
-> @cx/pipeline versioned artifact / approval side effect
```

이 흐름은 최종 구현 순서를 강제하지 않는다. 다만 각 단계의 책임이 섞이지 않도록 기준선으로 사용한다.

## 5. 패키지 방향

| 패키지 | 방향 |
|---|---|
| `@cx/schema` | generation pipeline 전반 DTO/schema 계약 SSOT |
| `@cx/parser` | Markdown/source 입력 -> SourceSpec 정규화 |
| `@cx/orchestration` | stage 입력/출력 조립과 next action helper |
| `@cx/validation` | 순수 검증과 validation report 반환 |
| `@cx/pipeline` | pipeline runtime, side effect 실행과 산출물 반영 |
| `@cx/agent` | Claude Agent SDK local-first 실행 adapter |
| `@cx/renderer` | RenderTree JSON -> React render |
| `@cx/components` | component vocabulary, catalog, 순수 CRUD 계약 |
| `@cx/layout-pattern-store` | layout pattern reference catalog와 순수 CRUD/resolve 계약 |
| `@cx/layout` | 화면 chrome과 layout primitive |
| `@cx/tokens` | foundation/semantic token SSOT와 CSS/Tailwind entrypoint |

패키지별 책임, 주요 기능, 관계망, public subpath는 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md)를 기준으로 한다. 실제 디렉토리 구조는 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md)를 따른다.

## 6. 현재 비목표

- old `@cx/importer`, `@cx/types`, `@cx/workflow` 경계를 되살리지 않는다.
- `@cx/renderer`에 table projection, schema validation, materializer, AI 실행 책임을 두지 않는다.
- `apps/web`에 생성, 검수, 저장, 파일 시스템 side effect를 되돌리지 않는다.
- `database/client-imports`, `database/ai-imports`, `database/tables` 기반 old pipeline 호환 layer를 재도입하지 않는다.
- AI가 component, token, layout pattern의 소유권을 우회해 임의 값을 확정하지 않는다.

## 7. 고도화 순서

| 단계 | 목표 | 완료 기준 |
|---|---|---|
| 1 | 패키지 책임 경계 고정 | README, package export, public contract가 문서와 일치 |
| 2 | parser MVP | Markdown source에서 SourceSpec을 순수 함수로 생성 |
| 3 | 순수 데이터 계약 정리 | mock schema와 stage input/output 타입의 책임이 분리됨 |
| 4 | validation rule 초안 | 생성 후보가 component/pattern/token reference 검증 결과를 반환 |
| 5 | orchestration stage builder 초안 | SourceSpec에서 generation/review/preview 입력을 순수 함수로 조립 |
| 6 | pipeline runner 초안 | orchestration/validation/agent 결과를 받아 versioned artifact로 남김 |
| 7 | renderer dependency injection | renderer가 catalog/pattern dependency를 명시적으로 받을 수 있음 |
| 8 | web preview 연결 | 앱은 완성된 RenderTree JSON 또는 preview DTO만 소비 |

## 8. 완료 판단

- 새 기능은 이 문서의 제품 방향과 충돌하지 않는다.
- 책임이 섞이면 먼저 어느 패키지가 소유해야 하는지 결정한다.
- 하위 패키지의 계산 로직은 side effect 없이 테스트 가능해야 한다.
- side effect는 `@cx/pipeline` 또는 명시된 외부 adapter에서만 실행한다.
- 중요한 결정과 완료 작업은 [AGENTS_HISTORY.md](/Users/plusx/Documents/rnd-screen-generator/AGENTS_HISTORY.md)에 기록한다.
