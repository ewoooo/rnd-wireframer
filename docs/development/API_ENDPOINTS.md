# API Endpoints

이 문서는 Web client가 호출하는 Next.js API route의 현재 표면을 요약한다.

상세 package 책임은 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md), 저장소 구조는 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md), screen inference 실행 구조는 [SCREEN_INFERENCE_ARCHITECTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/SCREEN_INFERENCE_ARCHITECTURE.md)를 따른다.

## 작성 기준

Endpoint 문서는 다음 항목만 기록한다.

| 항목 | 기준 |
|---|---|
| Method + path | 실제 `apps/web/src/app/api/**/route.ts`에 존재하는 route만 기록한다. |
| 목적 | Browser-facing API가 어떤 UI/흐름을 지원하는지 적는다. |
| 입력 | path params, query params, JSON body, multipart form body를 구분한다. |
| 출력 | 최상위 response shape와 중요한 status code만 적는다. |
| 책임 경계 | route가 어떤 server service/repo/package를 호출하며 무엇을 소유하지 않는지 적는다. |
| 안정성 | debug/dev-only endpoint인지, product-facing endpoint인지 구분한다. |

문서에 없는 endpoint는 active contract로 보지 않는다.

## 책임 경계

Browser-facing UI는 `/api/*` endpoint만 소비한다. Pipeline, DB, Claude 실행은 Next API route와 `server/*` service/repo 뒤에 둔다.

| 영역 | Endpoint 책임 | 두지 않는 책임 |
|---|---|---|
| Screen inference | source upload/list, job/run 생성, status 조회, SSE event stream, final result apply | pipeline step 순서, Claude 실행 구현, validation rule 소유 |
| Screen DB facade | screen route/list/tree/rows 조회, RenderTree candidate 저장 | React render, Puck data shape 소유, Supabase credential 노출 |
| Puck catalog | editor block 선택용 catalog item 조회 | catalog mutation, Puck editor UI |
| Figma introspection | dev-only Figma probe 결과 파일 저장 | product runtime, 인증, DB write |

## Screen Inference Endpoints

`/api/inference/*` route는 얇은 adapter다. Store, context, pipeline, worker 로직은 `@cx/inference` 패키지가 소유한다.

| Method | Path | 목적 | 입력 | 출력 |
|---|---|---|---|---|
| `GET` | `/api/inference/sources` | 업로드된 inference source 목록 조회 | 없음 | `{ sources }` |
| `POST` | `/api/inference/sources` | Markdown source 업로드 | multipart `file`, optional `batchId`, `importId` | `{ source: { batchId, importId, path, screenId, type } }` |
| `POST` | `/api/inference` | job 생성, worker 실행, jobId 반환 | JSON create job input | `{ jobId }` |
| `GET` | `/api/inference/:jobId` | job 상태 조회 | `jobId` path param | `Job` 또는 `404` |
| `GET` | `/api/inference/:jobId/steps` | step snapshot 조회 | `jobId` path param | `{ steps }` |
| `GET` | `/api/inference/:jobId/events` | `events.ndjson`를 SSE로 stream | `jobId` path param, optional `Last-Event-ID`/`after` | `text/event-stream`, SSE id는 event `seq` |
| `GET` | `/api/inference/:jobId/artifacts/:path*` | allowed job artifact 원본 조회 | `jobId`, artifact path params | artifact body 또는 `404` |
| `POST` | `/api/inference/:jobId/apply` | `context/render-tree.json`의 최종 RenderTree를 DB read model에 적용 | `jobId` path param | `{ ok, result, schemaVersion, appliedArtifacts? }` |

Source file input MVP는 `source.path` 하나를 기준으로 한다. Web upload와 CLI 모두 `data/client-imports/**.md` 경로를 `/api/inference` job input에 전달한다. API layer는 job 생성 전 source file을 읽어 `preparedSource.sourceSpec`을 job input에 넣고, `context/source.raw.md`, `context/source-input.json`, `context/source-spec.json` artifact를 남긴다. Pipeline step은 prepared `SourceSpec`만 소비한다.

SSE endpoint는 inference events를 stream하고, `job_completed` 또는 `job_failed`에서 stream을 종료한다.

Artifact endpoint는 allowlist 방식으로 운영한다. 현재 review UI가 쓰는 artifact는 `context/render-tree.json`, `context/validation-report.json`, `steps/08-quality/output.json`이다.

## Screen DB Endpoints

| Method | Path | 목적 | 입력 | 출력 |
|---|---|---|---|---|
| `GET` | `/api/screens/routes` | navigation route group 조회 | 없음 | `{ routes }` |
| `GET` | `/api/screens` | screen summary 목록 조회 | optional query `routeId` | `{ screens }` |
| `GET` | `/api/screens/:screenId/rows` | raw render DB row bundle 조회 | `screenId` path param | `{ rows }` |
| `GET` | `/api/screens/:screenId/tree` | renderer-ready RenderTree 조회 | `screenId` path param | materialize result, diagnostics error 시 `422` |
| `PUT` | `/api/screens/:screenId/tree` | RenderTree candidate를 screen child order/props 저장 경로로 적용 | JSON `{ node }` | save result, diagnostics error 시 `422` |
| `GET` | `/api/screens/puck-catalog` | Puck editor block catalog 조회 | query `scope=area` 또는 `scope=screen-region` | `{ catalogItems }` |

`/api/screens/:screenId/tree`는 일반 렌더/편집 소비 경로다. `/rows`는 debug와 workbench 원시 데이터 확인용으로 둔다.

## Dev-Only Endpoint

| Method | Path | 목적 | 입력 | 출력 |
|---|---|---|---|---|
| `POST` | `/api/figma-introspect` | Figma introspection probe 결과를 `scripts/figma-introspect-result.json`에 저장 | raw request body | `{ ok, bytes, dest }` |
| `OPTIONS` | `/api/figma-introspect` | Figma plugin iframe CORS preflight | 없음 | `204` |

이 endpoint는 product runtime contract가 아니다.

## 변경 시 체크리스트

- `apps/web/src/app/api/**/route.ts`와 이 문서의 method/path가 일치한다.
- Browser component가 `@cx/inference`, `@cx/agent`, Supabase service-role credential을 직접 import하지 않는다.
- Browser-facing hook은 `apps/web/src/features/<domain>/api/*.client.ts`만 통해 `/api/*`를 호출하고, `server/*`를 직접 import하지 않는다.
- route는 `server/*` service를 호출하고, UI shape 변환은 component 또는 feature model layer에 둔다.
- error response는 `{ error: string }` 형태를 유지한다.
- screen inference 진행 상태는 SSE만 믿지 않고 snapshot endpoint로 재조회할 수 있어야 한다.
- RenderTree 저장은 partial row patch가 아니라 whole-screen candidate apply 경로를 사용한다.
