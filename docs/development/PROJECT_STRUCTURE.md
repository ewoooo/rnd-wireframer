# 프로젝트 구조 규칙

## 1. 문서 책임

이 문서는 저장소가 커질 때 디렉토리와 파일 배치를 결정하는 기준만 정의한다.

제품 범위는 [MASTER_PLAN.md](/Users/plusx/Documents/rnd-screen-generator/MASTER_PLAN.md), 기술 경계는 [DEVELOPMENT_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DEVELOPMENT_ARCHITECTURE.md), 데이터 계약은 [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md)를 따른다.

## 2. 최상위 구조

```text
apps/        제품 앱
packages/    재사용 가능한 TypeScript 패키지
services/    독립 실행 백엔드/worker
database/    AI import 산출물, table dump, reference store
supabase/    migration, seed, edge function 등 Supabase 산출물
docs/        개발/데이터/디자인 문서와 분석 산출물
e2e/         제품 흐름 기준 end-to-end 테스트
scripts/     저장소 공통 검사와 자동화 스크립트
```

루트에는 전역 운영 문서와 workspace 설정만 둔다. `AGENTS.md`, `MASTER_PLAN.md`, `AGENTS_HISTORY.md`는 루트에 유지하고, 세부 문서는 `docs/` 아래 책임 문서로 분리한다.

## 3. 패키지 구조 규칙

패키지는 package name의 책임을 기준으로 나누고, 한 패키지 안에서는 기능 단계별 디렉토리를 둔다.

```text
packages/{name}/
  AGENTS.md
  README.md
  package.json
  src/
    __tests__/
    index.ts
    types.ts        # 패키지 내부 타입. 공유 계약은 @cx/types 우선
    {responsibility}/
      *.ts
```

새 파일을 추가할 때의 기본 판단:

- 외부 패키지에서 공유해야 하는 계약 타입은 `packages/types`의 `@cx/types`에 둔다. 한 패키지 내부에서만 쓰는 타입만 해당 패키지 `src/types.ts`에 둔다.
- 공개 import 표면은 `src/index.ts`와 `package.json` `exports`
- 특정 단계의 구현은 해당 책임 폴더
- Node.js 전용 adapter는 루트 export에 섞지 않고 subpath export
- reference catalog나 fixture를 직접 소유하지 않는 패키지는 `database/` 또는 `docs/`의 계약을 읽는다

## 4. `packages/agent` 구조

`@cx/agent`는 AI 실행 전후 deterministic pipeline이므로 단계 이름이 디렉토리 이름이 된다.

```text
packages/agent/src/
  register/    원천 입력을 GeneratedNodeTree/RegisteredNodeTree 계약으로 등록
  compose/     raw content를 ComposedNodeTree의 props/hooks 후보로 합성
  decorate/    pattern-store 기반 layout 결정 메타 부착
  design-review/  docs/design 근거 기반 디자인 품질 patch 생성/적용
  pattern/     pattern schema, store loader, resolver
  database/    database/tables row shape materialize
  runtime/     Agent SDK 실행 adapter
  types.ts
  index.ts
```

`GeneratedNodeTree -> RegisteredNodeTree -> ComposedNodeTree -> DecoratedNodeTree -> DesignReview patch -> ReviewedDecoratedNodeTree -> MaterializedNodeTree` 흐름을 기본 계약으로 유지한다. `pattern`은 decorate와 renderer 사이에 끼는 별도 제품 계층이 아니라, children layout preset을 고르는 reference/resolver 영역이다. Design Review는 `docs/design/` 근거 문서가 붙은 제한 operation patch만 적용한다.

## 4.1 `packages/types` 구조

`@cx/types`는 런타임 구현을 갖지 않는 공유 계약 패키지다. `database/tables` row shape, pattern-store 계약처럼 `@cx/agent`, `@cx/renderer`, `apps/web`이 동시에 참조하는 타입은 여기에서 먼저 정의한다. 특정 패키지 구현 세부 타입은 이 패키지로 올리지 않는다.

## 5. 앱 구조 규칙

`apps/web`은 단일 제품 앱이므로 기능별 제품 namespace를 과하게 만들지 않는다.

```text
apps/web/src/
  app/          Next.js route와 API route
  components/   화면/패널/프리뷰 UI
  adapters/     workbench용 source validation/read helper
  data/         local loader와 앱 소비 read model adapter
  model/        클라이언트 상태와 선택 모델
  agent/        브라우저에서 쓰는 agent pipeline 호출 wrapper
  server/       route handler가 호출하는 서버 전용 IO/orchestration
```

렌더링 primitive는 `@cx/layout`, leaf component는 `@cx/components`, render tree projection과 node 해석은 `@cx/renderer`, 공유 row/pattern 계약은 `@cx/types`, AI pipeline은 `@cx/agent`로 올린다. 앱 내부에는 제품 작업면과 API route glue만 남긴다.

`src/app/api/**/route.ts`는 HTTP status와 response shape만 관리한다. 파일 시스템, 업로드 저장, local Claude 실행, AI import artifact write처럼 Node.js 전용 side effect는 `src/server/**`로 격리한다. `src/data/**`에는 앱이 소비하는 read model loader만 두고, 파일 쓰기나 `node:*` 의존 helper는 두지 않는다.

## 6. 데이터와 패턴 위치

```text
database/
  client-imports/  사용자가 올린 원천 import
  ai-imports/      AI import NodeTree와 table 후보 산출물
  tables/          workbench가 소비하는 승인된 table dump 계약
  pattern-store/   layout preset reference catalog
```

`database/client-imports`는 원천 import 보관소다. parser나 AI 보정 단계가 원본을 덮어쓰지 않는다.
`database/ai-imports`는 생성 후보 산출물 보관소다. `agent-assets.materialized.json` 같은 table 후보는 소비 데이터가 아니며, workbench가 직접 읽지 않는다.
`database/tables`는 승인된 소비 데이터만 둔다. agent pipeline과 parser는 이 디렉토리를 직접 덮어쓰지 않고 `@cx/agent/promote-database-tables` 또는 `/api/agent/promote-ai-import` 경계에서만 반영한다.
`database/pattern-store`는 소비 데이터가 아니라 reference catalog다. 패턴은 `screen`, `region`, `area`, `composite` children을 어떻게 배치할지 정의하는 layout preset이다. 단, `Screen.Header`, `Screen.Contents`, `Screen.Bottom` 3영역 생성은 pattern-store가 아니라 deterministic code와 `database/tables` 계약이 담당한다. `composite`는 2개 이상의 `@cx/components`를 결합한 wrapper에만 사용한다.
`database/ai-imports`의 Claude/AI 보정 산출물은 `agent-assets.json`, `agent-assets.registered.json`, `agent-assets.composed.json`, `agent-assets.decorated.json`, `agent-assets.design-review.json`, `agent-assets.reviewed.json`, `agent-assets.materialized.json` 이름을 사용한다.

## 7. 변경 기준

- 새 책임이 생기면 먼저 기존 패키지의 하위 책임인지, 별도 패키지인지 결정한다.
- 파일 수가 늘어나는 것보다 import 경계가 흐려지는 것을 더 경계한다.
- 공개 subpath는 한 번 열면 외부 계약으로 보고, 내부 파일 이동은 `package.json` `exports`로 흡수한다.
- 구현 변경으로 책임이나 사용법이 바뀌면 해당 패키지 `README.md`, `AGENTS.md`, `AGENTS_HISTORY.md`를 함께 갱신한다.
