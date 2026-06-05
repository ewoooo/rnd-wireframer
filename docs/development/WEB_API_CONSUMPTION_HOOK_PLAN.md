# Web API Consumption Hook Plan

## 목적

Browser-facing UI가 `/api/*` endpoint만 소비하도록 hook 경계를 정리한다.

규칙:

```text
Browser-facing UI
-> features/<domain>/model hook
-> features/<domain>/api/*.client.ts
-> app/api/**/route.ts
-> server/<domain>/*.service.ts
-> server/<domain>/*.repo.ts / pipeline / file IO
```

Pipeline, DB, Claude 실행은 Next API route와 `server/*` service/repo 뒤에 둔다. Client component와 browser-facing hook은 `@cx/pipeline`, `@cx/agent`, Supabase service-role helper, run store, DB save/load helper를 직접 import하지 않는다.

## 현재 상태

현재 screen inference UI는 이미 endpoint를 소비하는 방향이다.

```text
features/workbench/model/useNewScreenInference
-> features/screen-inference/api/screen-inference.client.ts
-> app/api/screen-inference/*
-> server/screen-inference/screen-inference.service.ts
-> @cx/pipeline runPipeline("screen-generation")
```

문제는 `useNewScreenInference`가 API lifecycle과 workbench UI 상태를 같이 소유한다는 점이다.

현재 포함 책임:

- source 목록 조회
- source upload
- selected source local state
- run 생성/rerun
- status polling
- SSE subscription
- review artifact loading
- apply action
- workbench save state 연결
- error message fallback

동작은 맞지만, endpoint 소비 패턴이 다른 화면에서 재사용되기 어렵다.

## 목표 디렉토리 표준

```text
apps/web/src/
├─ app/
│  └─ api/                     # Next Route Handler만
│
├─ features/                   # Browser에서 소비되는 기능 단위
│  ├─ workbench/
│  │  ├─ model/                # workbench hook/state/composer
│  │  ├─ ui/                   # workbench React components
│  │  └─ index.ts
│  │
│  ├─ screen-inference/
│  │  ├─ api/                  # browser -> server contract
│  │  │  ├─ screen-inference.client.ts
│  │  │  └─ screen-inference.schema.ts
│  │  ├─ model/                # screen inference hooks
│  │  └─ index.ts
│  │
│  └─ screens/
│     ├─ api/
│     │  ├─ screens.client.ts
│     │  └─ screens.schema.ts
│     ├─ model/
│     └─ index.ts
│
├─ server/                     # 서버에서만 실행되는 기능 단위
│  ├─ screen-inference/
│  │  ├─ screen-inference.service.ts
│  │  ├─ screen-inference.repo.ts
│  │  ├─ screen-inference-artifacts.ts
│  │  └─ screen-inference-source.ts
│  │
│  ├─ screens/
│  │  ├─ screens.service.ts
│  │  ├─ screens.repo.ts
│  │  └─ screen-db.ts
│  │
│  ├─ pipeline/
│  └─ db/
│
└─ shared/                     # 양쪽에서 써도 되는 순수 코드만
   ├─ schemas/
   ├─ types/
   └─ utils/
```

`features/*`는 browser-facing 기능 단위다. `server/*`는 서버에서만 실행되는 use case, DB, file IO, pipeline 연결이다. `shared/*`에는 fetch, env, fs, Supabase, React state를 두지 않는다.

## 명칭 표준

| Suffix | 위치 | 의미 |
|---|---|---|
| `*.client.ts` | `features/<domain>/api/` | browser `fetch`/`EventSource` wrapper |
| `*.schema.ts` | `features/<domain>/api/` 또는 `shared/schemas/` | request/response contract |
| `use-*.ts` | `features/<domain>/model/` | React hook |
| `*.service.ts` | `server/<domain>/` | server use case |
| `*.repo.ts` | `server/<domain>/` | DB/file persistence access |
| `route.ts` | `app/api/**/` | HTTP 입구 |

## 목표 경계

| Layer | 위치 | 책임 | 금지 |
|---|---|---|---|
| Client API wrapper | `apps/web/src/features/<domain>/api/*.client.ts` | `fetch`, `EventSource`, response error 처리 | React state, `server/*` import |
| Browser-facing hooks | `apps/web/src/features/<domain>/model/use-*.ts` | API lifecycle state, polling/SSE, action state | `@cx/pipeline`, DB helper, route handler, `server/*` import |
| Workbench composer hook | `apps/web/src/features/workbench/model/use-*.ts` | workbench 선택 상태와 domain hook 조립 | endpoint URL 직접 작성, pipeline 실행 |
| Next API route | `apps/web/src/app/api/**/route.ts` | browser contract, request/response, `server/*` service 호출 | React UI state |
| Server service | `apps/web/src/server/<domain>/*.service.ts` | server use case, pipeline/file IO orchestration | `features/*`, React state import |
| DB/file repo | `apps/web/src/server/<domain>/*.repo.ts` | DB/file persistence access | `features/*`, React state import |
| Shared pure code | `apps/web/src/shared/**` | pure types, schemas, utils | fetch, env, fs, DB, pipeline, React state |

## Hook 설계

### `useScreenInferenceSources`

Source 목록과 upload lifecycle만 담당한다.

Target location: `apps/web/src/features/screen-inference/model/use-screen-inference-sources.ts`

```ts
type UseScreenInferenceSourcesResult = {
  error?: string;
  isLoading: boolean;
  isUploading: boolean;
  refreshSources: () => Promise<void>;
  sources: NewScreenSourceItem[];
  uploadSource: (file: File) => Promise<NewScreenSourceItem | undefined>;
};
```

두지 않는 책임:

- selected source path
- run 생성
- localStorage persistence
- review artifact loading

### `useScreenInferenceRun`

하나의 `runId`에 대한 status lifecycle만 담당한다.

Target location: `apps/web/src/features/screen-inference/model/use-screen-inference-run.ts`

```ts
type UseScreenInferenceRunOptions = {
  enabled?: boolean;
  pollIntervalMs?: number;
};

type UseScreenInferenceRunResult = {
  error?: string;
  isRunning: boolean;
  isTerminal: boolean;
  refreshStatus: () => Promise<void>;
  status?: ScreenInferenceRunStatus;
};
```

동작 기준:

- `GET /api/screen-inference/runs/:runId`로 snapshot을 읽는다.
- `GET /api/screen-inference/runs/:runId/events` SSE는 snapshot refresh trigger로만 사용한다.
- SSE 실패 시 polling fallback을 유지한다.
- terminal status에서는 polling을 멈춘다.

### `useScreenInferenceReviewArtifacts`

Review에 필요한 artifact만 로드한다.

Target location: `apps/web/src/features/screen-inference/model/use-screen-inference-review-artifacts.ts`

```ts
type UseScreenInferenceReviewArtifactsResult = {
  error?: string;
  isLoading: boolean;
  previewNode?: RenderTreeScreenNode;
  quality?: QualityInspectionContract;
  refreshArtifacts: () => Promise<void>;
  validation?: ValidationReportContract;
};
```

동작 기준:

- `waiting-review` 상태에서만 load한다.
- 허용 artifact는 `final-result.json`, `validation-report.json`, `quality-review.json`이다.
- artifact endpoint allowlist와 문서가 불일치하면 실패로 본다.

### `useScreenInferenceActions`

Mutation action만 담당한다.

Target location: `apps/web/src/features/screen-inference/model/use-screen-inference-actions.ts`

```ts
type UseScreenInferenceActionsResult = {
  applyRun: (runId: string) => Promise<void>;
  error?: string;
  isApplying: boolean;
  isStarting: boolean;
  startRun: (source: NewScreenSourceItem) => Promise<ScreenInferenceRunCreateResponse | undefined>;
  rerun: (
    source: NewScreenSourceItem,
    previousRunId: string,
  ) => Promise<ScreenInferenceRunCreateResponse | undefined>;
};
```

두지 않는 책임:

- selected source update
- workbench save state message
- preview artifact refresh

### `useNewScreenInference`

Workbench 전용 composer로 축소한다.

Target location: `apps/web/src/features/workbench/model/use-new-screen-inference.ts`

```text
useNewScreenInference
-> useScreenInferenceSources
-> useScreenInferenceRun
-> useScreenInferenceReviewArtifacts
-> useScreenInferenceActions
-> workbench source selection/localStorage/save state 조립
```

이 hook은 workbench UI에 필요한 최종 view model만 반환한다.

## Rollout 계획

각 rollout은 단독으로 commit 가능한 단위여야 한다. 한 rollout에서 파일 이동과 동작 변경을 동시에 크게 섞지 않는다.

| Rollout | 목적 | 변경 성격 |
|---|---|---|
| 0 | 문서 기준 고정 | 문서 only |
| 1 | import guard 기준 준비 | 검증 script/test only |
| 2 | feature directory shell 준비 | 구조 only |
| 3 | screen inference client 이동 | 파일 이동 + import 수정 |
| 4 | screens client 이동 | 파일 이동 + import 수정 |
| 5 | server directory shell 준비 | 구조 only |
| 6 | screen inference server helper 이동 | 파일 이동 + route import 수정 |
| 7 | screens server helper 이동 | 파일 이동 + route import 수정 |
| 8 | run status hook 추출 | hook 분리 |
| 9 | review artifact hook 추출 | hook 분리 |
| 10 | source hook 추출 | hook 분리 |
| 11 | actions hook 추출 | hook 분리 |
| 12 | workbench composer 축소 | 조립 hook 정리 |
| 13 | old path cleanup | dead import/path 제거 |

### Rollout 0 - 문서 기준 고정

Status: planned.

- `API_ENDPOINTS.md`에 browser boundary rule을 둔다.
- 이 문서에 `features / server / shared / app/api` 기준과 hook rollout을 둔다.
- 코드 변경은 하지 않는다.

검증:

- `rg`로 old/new 기준 문구 확인
- `git diff --check`

중단 기준:

- 문서가 구현되지 않은 endpoint를 active contract로 기록한다.
- 기존 패키지 경계 문서와 충돌한다.

### Rollout 1 - Import Guard 기준 준비

목적:

- 구조 변경 전에 금지 import를 잡을 수 있는 검증 기준을 먼저 만든다.

변경:

- `features/* -> server/*` 금지 확인 command를 문서 또는 script로 준비한다.
- `server/* -> features/*` 금지 확인 command를 문서 또는 script로 준비한다.
- React hook policy와 별개로 Web boundary check를 실행할 수 있게 한다.

검증:

```bash
rg -n "from \"@/server|from \"@cx/(pipeline|agent|validation)" apps/web/src/features apps/web/src/components
rg -n "from \"@/features|from \"react\"" apps/web/src/server
git diff --check
```

중단 기준:

- 아직 존재하지 않는 directory 때문에 command가 실패한다면 rollout 2 이후로 script화를 미룬다. 이 경우 문서 command만 유지한다.

### Rollout 2 - Feature Directory Shell 준비

목적:

- Browser-facing code가 들어갈 target directory를 먼저 만든다.

변경:

- `apps/web/src/features/screen-inference/`
- `apps/web/src/features/workbench/`
- `apps/web/src/features/screens/`
- 각 feature의 `api/`, `model/`, 필요 시 `ui/` directory
- 불필요한 barrel export는 만들지 않는다.
- 기존 import path는 아직 바꾸지 않는다.

검증:

- `find apps/web/src/features -maxdepth 3 -type d`
- `git diff --check`

중단 기준:

- directory만 만들기 어려운 repo 정책이면 첫 파일 이동 rollout에서 directory를 같이 만든다.

### Rollout 3 - Screen Inference Client 이동

- `screen-inference-client.ts`를 `features/screen-inference/api/screen-inference.client.ts`로 이동한다.
- request/response 타입 중 browser contract는 `screen-inference.schema.ts`로 분리한다.
- client wrapper는 `fetch`/`EventSource`와 response error 처리만 소유한다.
- `useNewScreenInference` import만 새 path로 바꾼다.
- 동작 변경은 하지 않는다.

검증:

- `pnpm exec vitest run apps/web/src/components/App.test.tsx apps/web/src/lib/screen-inference-events.test.ts`
- `rg -n "screen-inference-client" apps/web/src`
- `git diff --check`

중단 기준:

- client 이동 중 hook 로직 변경이 필요해진다. 그 경우 이동만 먼저 유지하고 hook 추출은 rollout 8 이후로 미룬다.

### Rollout 4 - Screens Client 이동

- `screens-client.ts`를 `features/screens/api/screens.client.ts`로 이동한다.
- request/response 타입 중 browser contract는 `screens.schema.ts`로 분리한다.
- screen/workbench UI import만 새 path로 바꾼다.
- 동작 변경은 하지 않는다.

검증:

- `pnpm exec vitest run apps/web/src/components/App.test.tsx`
- `rg -n "screens-client" apps/web/src`
- `git diff --check`

중단 기준:

- `screens-client.ts`가 browser client 외 책임을 갖고 있으면 이동 전 책임 분리 작업을 먼저 한다.

### Rollout 5 - Server Directory Shell 준비

목적:

- Server-only code가 들어갈 target directory를 만든다.

변경:

- `apps/web/src/server/screen-inference/`
- `apps/web/src/server/screens/`
- `apps/web/src/server/pipeline/`
- `apps/web/src/server/db/`
- 기존 import path는 아직 바꾸지 않는다.

검증:

- `find apps/web/src/server -maxdepth 3 -type d`
- `git diff --check`

### Rollout 6 - Screen Inference Server Helper 이동

- `screen-inference-run-store.ts`, `screen-inference-apply.ts`, `screen-inference-source.ts`를 `server/screen-inference/`로 이동한다.
- `server-paths.ts`, 필요한 file IO helper도 server boundary로 이동한다.
- route handler는 `server/screen-inference/*.service.ts` 또는 thin server helper만 import한다.
- DB/file access는 가능한 범위에서 `*.repo.ts`로 분리한다. 분리가 크면 다음 rollout로 넘긴다.
- 동작 변경은 하지 않는다.

검증:

- `pnpm exec vitest run apps/web/src/lib/screen-inference-run.test.ts apps/web/src/lib/screen-inference-source.test.ts apps/web/src/components/App.test.tsx`
- `rg -n "screen-inference-run-store|screen-inference-apply|screen-inference-source" apps/web/src`
- `git diff --check`

중단 기준:

- route handler가 React/client code를 import하게 된다.
- server move와 service/repo split이 동시에 커진다. 이 경우 split은 후속 rollout로 분리한다.

### Rollout 7 - Screens Server Helper 이동

- `screen-db-loader.ts`, `screen-db-save.ts`, `screen-db-rest.ts`, `puck-catalog-loader.ts`를 `server/screens/`로 이동한다.
- route handler는 `server/screens/*.service.ts` 또는 thin server helper만 import한다.
- DB access는 가능한 범위에서 `*.repo.ts`로 분리한다. 분리가 크면 다음 rollout로 넘긴다.
- 동작 변경은 하지 않는다.

검증:

- `pnpm exec vitest run apps/web/src/lib/screen-db-loader.test.ts apps/web/src/lib/screen-db-save.test.ts apps/web/src/components/App.test.tsx`
- `rg -n "screen-db-loader|screen-db-save|screen-db-rest|puck-catalog-loader" apps/web/src`
- `git diff --check`

중단 기준:

- Puck/editor UI가 server helper를 직접 import하게 된다.
- DB repo split이 저장 동작을 바꿔야 한다.

### Rollout 8 - Run Status Hook 추출

- `useScreenInferenceRun`을 추가한다.
- 기존 `useNewScreenInference`의 polling/SSE logic만 이동한다.
- 기존 UI props와 behavior는 유지한다.
- 검증: `apps/web/src/components/App.test.tsx`, `screen-inference-events.test.ts`.

중단 기준:

- hook 추출 중 returned view model shape가 바뀐다.
- SSE event를 snapshot refresh trigger가 아닌 UI state 정본으로 쓰게 된다.

### Rollout 9 - Review Artifact Hook 추출

- `useScreenInferenceReviewArtifacts`를 추가한다.
- `waiting-review` artifact loading logic만 이동한다.
- 검증: final-result, validation, quality fetch 순서와 preview 표시 회귀 확인.

중단 기준:

- artifact allowlist와 client artifact fetch가 불일치한다.
- preview parsing 책임이 UI component로 이동한다.

### Rollout 10 - Sources Hook 추출

- `useScreenInferenceSources`를 추가한다.
- source list/upload loading/error만 이동한다.
- selection/localStorage는 workbench composer에 남긴다.

중단 기준:

- source selection이나 localStorage persistence가 source hook 안으로 섞인다.

### Rollout 11 - Actions Hook 추출

- `useScreenInferenceActions`를 추가한다.
- start/rerun/apply mutation state를 이동한다.
- workbench save state message는 composer에 남긴다.

중단 기준:

- workbench save state message가 domain action hook으로 들어간다.

### Rollout 12 - Workbench Composer 축소

- `useNewScreenInference`를 workbench state 조립 hook으로 정리한다.
- endpoint URL 작성은 `features/*/api/*.client.ts`에만 남긴다.
- server import가 `features/*`로 들어오지 않는지 `rg`로 검증한다.

중단 기준:

- UI prop shape가 바뀌어 App test가 대량 수정된다.
- workbench composer가 endpoint URL이나 server helper를 직접 알게 된다.

### Rollout 13 - Old Path Cleanup

- `apps/web/src/lib`에 남은 client/server 책임 파일이 없는지 정리한다.
- `lib`에는 pure shared helper만 남긴다. 필요하면 `shared/`로 이동한다.
- 문서와 import path를 최종 기준으로 갱신한다.

검증:

```bash
rg -n "from \"@/lib/(screen-inference-client|screens-client|screen-db-|screen-inference-run-store|screen-inference-apply|screen-inference-source|puck-catalog-loader)" apps/web/src
rg -n "from \"@/server|from \"@cx/(pipeline|agent|validation)" apps/web/src/features apps/web/src/components
rg -n "from \"@/features|from \"react\"" apps/web/src/server
pnpm exec vitest run apps/web/src/components/App.test.tsx
git diff --check
```

## 검증 기준

- Browser-facing hook은 `features/<domain>/api/*.client.ts`만 통해 endpoint를 소비한다.
- `features/*`에서 `server/*`, `@cx/pipeline`, `@cx/agent`, `@cx/validation`, DB/file helper를 import하지 않는다.
- `server/*`에서 `features/*`, React component, React hook을 import하지 않는다.
- `app/api/**/route.ts`는 request/response와 service 호출만 담당한다.
- SSE event는 UI state 정본이 아니라 status snapshot refresh trigger로만 사용한다.
- `useMemo`/`useCallback`을 추가하지 않는다.
- 기존 App test의 source upload, run start, waiting-review preview, apply flow가 통과한다.

검증 명령 후보:

```bash
rg -n "from \"@/server|from \"@cx/(pipeline|agent|validation)" apps/web/src/features apps/web/src/components
rg -n "from \"@/features|from \"react\"" apps/web/src/server
pnpm exec vitest run apps/web/src/components/App.test.tsx apps/web/src/lib/screen-inference-events.test.ts
git diff --check
```
