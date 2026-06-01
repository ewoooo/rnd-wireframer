# Smoke Web Testbed Plan

## 목적

screen generation inference 품질을 비교 가능하게 만들기 위해 smoke 산출물과 web preview를 하나의 테스트베드로 연결한다.

현재 문제는 inference stage가 늘어도 최종 `final-result.json` 품질 변화가 작을 때, 어떤 stage의 판단이 최종 RenderTree에 반영되지 않았는지 확인하기 어렵다는 점이다. 테스트베드는 생성 결과를 실행 로그로만 남기지 않고, web에서 조회, 비교, diff, 품질 점수화할 수 있어야 한다.

## 현재 구조

```text
apps/smoke
-> @cx/pipeline screen-generation
-> tmp/generation-runs/<run-id>/
   -> 01-parse-result.json
   -> ...
   -> final-result.json
   -> 27-validation-report.json
   -> 28-pipeline-result.json

apps/web
-> data/tables/*.json 또는 markdown source summary
-> @cx/table-materializer
-> @cx/renderer
```

현재 smoke run은 `tmp/generation-runs/<run-id>`에 저장된다. web은 이 run directory를 정식 data source로 다루지 않는다.

변경 목표는 smoke run의 기본 저장 위치를 `data/runs/screen-generation/<run-id>`로 옮기는 것이다. 이 경로는 생성 검토용 run store이며, 사람이 만족한 run은 apply 단계에서 `data/tables`에 바로 등록할 수 있다.

## 목표

- web에서 smoke run 목록을 조회한다.
- web에서 smoke run의 `final-result.json`을 렌더링한다.
- 두 개 이상의 smoke run을 같은 조건에서 비교한다.
- 최종 RenderTree끼리 structure, layout, props, state coverage 차이를 확인한다.
- validation report와 quality review finding을 run 비교 화면에서 함께 본다.
- smoke 저장 위치와 web 조회 위치를 명시적 계약으로 만든다.

## 비목표

- smoke 결과를 생성 성공만으로 자동 반영하지 않는다.
- web이 generation pipeline을 직접 실행하지 않는다.
- web source tree를 pipeline artifact storage로 암묵 사용하지 않는다.
- `@cx/pipeline`이 Next.js app 구조를 알게 하지 않는다.

승인된 smoke result를 `data/tables`에 적용하는 것은 목표에 포함한다. 단, apply는 별도 사용자 승인 또는 명시적 action 뒤에만 수행한다.

## 저장 위치 검토

### Option A: 계속 `tmp/generation-runs` 사용

장점:

- 현재 구조 변경이 가장 작다.
- 실험 산출물과 source-controlled data가 섞이지 않는다.
- pipeline이 web app 구조를 몰라도 된다.

단점:

- web이 `tmp`를 정식 데이터처럼 읽어야 한다.
- 삭제되기 쉬운 임시 디렉터리라 baseline 관리에 약하다.
- run index, 태그, 승인 상태 같은 메타데이터를 붙이기 어렵다.

판단:

- 단기 smoke 실행에는 유지할 수 있다.
- 비교 테스트베드의 정식 저장소로는 부족하다.

### Option B: `apps/web` 내부에 smoke 결과 내장

예시:

```text
apps/web/data/smoke-runs/<run-id>/
apps/web/src/data/smoke-runs/<run-id>/
apps/web/public/smoke-runs/<run-id>/
```

장점:

- web에서 상대적으로 읽기 쉽다.
- static fixture처럼 배포/공유하기 쉽다.
- 특정 benchmark run을 UI 개발 fixture로 고정하기 쉽다.

단점:

- app source와 생성 artifact가 섞인다.
- Next build 대상, public asset, server-only file read 경계가 흐려진다.
- 대용량 agent request/result가 web bundle이나 public surface로 새어 나갈 위험이 있다.
- smoke CLI가 web app 디렉터리 정책을 알아야 한다.

판단:

- 기본 저장소로 쓰지 않는다.
- 선별된 fixture만 `apps/web/fixtures/smoke-runs` 같은 명시적 fixture 경로에 둘 수 있다.
- raw agent request/result 전체를 `public` 아래에 두면 안 된다.

### Option C: `data/runs/screen-generation` artifact store 신설

권장 경로:

```text
data/
  runs/
    screen-generation/
      <run-id>/
        manifest.json
        artifacts/
          01-parse-result.json
          ...
          final-result.json
          27-validation-report.json
          28-pipeline-result.json
```

장점:

- `tmp`보다 정식 산출물 저장소로 명확하다.
- 생성 검토 산출물이 `data/tables`와 같은 data 경계 아래에 있어 후속 apply 흐름이 자연스럽다.
- web, smoke, pipeline이 같은 artifact contract를 공유할 수 있다.
- run index, baseline, tags, comparison metadata를 붙이기 쉽다.
- source-controlled fixture와 local transient run을 구분할 수 있다.

단점:

- `.gitignore`/fixture 승격 규칙이 필요하다.
- 기존 `tmp/generation-runs` 참조 문서와 CLI 기본값을 갱신해야 한다.
- `data/runs`와 `data/tables` 책임을 분리하지 않으면 검토 전 산출물이 승인 데이터처럼 오해될 수 있다.

판단:

- 비교 테스트베드의 기본 방향으로 적합하다.
- pipeline은 특정 물리 경로가 아니라 artifact store preset을 받도록 설계한다.
- `data/runs`는 후보 산출물, `data/tables`는 승인 반영 데이터라는 경계를 문서와 UI에서 분명히 표시한다.

## 권장 방향

기본 smoke 저장 위치를 `data/runs/screen-generation`으로 전환한다. `tmp/generation-runs`는 legacy/debug override로만 남긴다.

```text
local-transient preset
-> tmp/generation-runs/<run-id>

data-run preset
-> data/runs/screen-generation/<run-id>/artifacts

web-fixture preset
-> apps/web/fixtures/smoke-runs/<run-id>/artifacts
```

기본 CLI와 web 비교 테스트베드는 `data/runs/screen-generation`을 기본 조회 루트로 삼는다. web fixture는 사람이 승격한 작은 benchmark set만 보관한다.

승인 흐름:

```text
data/runs/screen-generation/<run-id>/artifacts/final-result.json
-> 사람이 web에서 preview/diff/review 확인
-> approve/apply action
-> final RenderTree를 screen, area, component table layer로 분해
-> data/tables/*.json 갱신
```

apply 단계는 새 생성을 하지 않는다. 승인된 `final-result.json` RenderTree만 `data/tables` 반영 입력으로 사용한다.

정본 기준은 `final-result.json` RenderTree다. 과거 `apps/web/src/adapters/render-tree-to-tables.ts`에 있던 `renderTreeToTables()` 알고리즘을 현재 `@cx/schema`의 `RenderTreeContract`와 `data/tables` 구조에 맞게 이식해 사용한다. `tableGenerationResult`는 검증/비교 참고 artifact로 남기되 apply 입력 정본으로 삼지 않는다.

과거 구현에서 가져올 수 있는 핵심은 다음이다.

- `Screen` root를 찾는다.
- `Screen.Header`, `Screen.Contents`, `Screen.Bottom`을 region으로 분리한다.
- `area.static`/`area.dynamic` node는 area row로 분해한다.
- area 아래 component node는 component row로 분해한다.
- generated wrapper 성격의 layout node는 table row로 저장하지 않고 warning 또는 flatten 처리한다.
- screen/region/area children은 `{ kind, id }` 참조로 다시 저장한다.

현재 구조에 맞춰 바꿔야 할 점은 다음이다.

- 과거 `composites` 출력은 현재 `components` 출력으로 바꾼다.
- 과거 `pattern: { id, variant }`는 현재 `layout: "layout.<target>.<PatternName>"`로 바꾼다.
- 과거 `events`는 현재 `hooks` 계약으로만 유지한다.
- 과거 `@cx/types` 기반 node type 판정은 현재 `@cx/schema`/현재 node type 계약을 따른다.

## Pipeline I/O 개선

현재 `ScreenGenerationPipelineOptions`는 `outDir?: string`만 받는다. 이 옵션은 간단하지만 저장 목적을 표현하지 못한다.

개선안:

```ts
type ArtifactStorePreset = "data-run" | "local-transient" | "web-fixture";

type ScreenGenerationPipelineOptions = {
  artifactStore?: {
    preset?: ArtifactStorePreset;
    rootDir?: string;
    saveLocal?: boolean;
  };
  outDir?: string; // legacy alias
};
```

운영 규칙:

- `outDir`는 당분간 유지하되 legacy override로 문서화한다.
- `artifactStore.rootDir`는 repo-relative 또는 absolute path를 허용한다.
- 기본 preset은 `data-run`이며 기본 root는 `data/runs/screen-generation`이다.
- `saveLocal: false`는 dry-run이나 remote artifact store 도입 전까지 `write-artifacts`를 생략하지 않고 `mode: "dry-run"`에 연결한다.
- `@cx/pipeline`은 artifact path를 계산하되 web-specific path를 하드코딩하지 않는다.
- artifact write command는 계속 `versioned-artifact-write`를 사용한다.

## Artifact Manifest

web이 디렉터리 파일명을 추측하지 않도록 각 run에 manifest를 추가한다.

```json
{
  "schemaVersion": "smoke-run-manifest.v0.1",
  "pipelineId": "screen-generation",
  "runId": "codex-inference-check",
  "createdAt": "2026-05-29T00:00:00.000Z",
  "sourcePath": "data/client-imports/{id}/260528_mbr/NOVA-MBR-PG-001-0.md",
  "agentMode": "claude-local-first",
  "artifactRoot": "artifacts",
  "finalResult": "artifacts/final-result.json",
  "agentResult": "artifacts/18-agent-result.json",
  "tableGenerationResult": {
    "source": "agentResult.payload.tableGenerationResult",
    "usage": "validation-and-comparison-only"
  },
  "validationReport": "artifacts/27-validation-report.json",
  "qualityReview": "artifacts/22-quality-review-agent-result.json",
  "pipelineResult": "artifacts/28-pipeline-result.json",
  "summary": {
    "ok": true,
    "validationOk": true,
    "errorCount": 0,
    "warningCount": 1
  },
  "tags": []
}
```

Manifest 책임:

- run 목록 조회의 정본이다.
- web은 manifest를 먼저 읽고 필요한 artifact만 lazy read한다.
- 파일 번호 변경이 생겨도 web은 manifest key를 사용한다.

## Web 기능 계획

### Phase 1: Run Browser

- `data/runs/screen-generation/*/manifest.json` 목록 조회
- run id, source path, 생성 시각, agent mode, validation summary 표시
- run 선택 시 `final-result.json` 렌더
- validation report와 quality review finding 표시

완료 기준:

- web에서 `codex-inference-check` 같은 run을 선택해 preview할 수 있다.
- `final-result.json` wrapper 여부와 root/region summary를 표시한다.

### Phase 2: Side-by-side Compare

- 두 run 선택
- 동일 viewport의 모바일 preview를 나란히 표시
- scroll position 동기화
- Header/Contents/Bottom overlay toggle
- 선택 node summary 표시

완료 기준:

- 같은 source의 baseline/candidate run을 한 화면에서 비교할 수 있다.

### Phase 3: RenderTree Diff

- node type/id/layout/props diff
- added/removed/changed node count
- layout missing/fallback/repetition summary
- placeholder leakage count
- state coverage summary

완료 기준:

- "중간 inference가 늘었는데 최종 RenderTree가 왜 비슷한지"를 diff로 설명할 수 있다.

### Phase 4: Baseline And Annotation

- run에 `baseline`, `candidate`, `accepted`, `rejected` 태그 부여
- source별 baseline 지정
- manual note 저장
- baseline 대비 regression score 표시

완료 기준:

- source별 품질 기준 run을 고정하고 다음 run과 비교할 수 있다.

### Phase 5: Approve And Apply

- web에서 선택 run의 validation/review/diff를 확인한다.
- 사용자가 만족하면 explicit approve/apply action을 실행한다.
- apply는 manifest를 통해 `final-result.json`과 validation report를 찾는다.
- `final-result.json` RenderTree를 screen, area, component table row로 분해한다.
- apply 성공 후 `data/tables` 변경 요약을 보여준다.

완료 기준:

- 만족한 smoke run을 별도 수동 파일 탐색 없이 `data/tables`에 반영할 수 있다.
- validation error가 있는 run은 기본적으로 apply를 막고, override는 명시적으로만 허용한다.

## 디렉터리 변경안

권장 최종 구조:

```text
data/
  runs/
    screen-generation/
      <run-id>/
        manifest.json
        artifacts/
          01-parse-result.json
          02-source-spec.json
          ...
          final-result.json
          27-validation-report.json
          28-pipeline-result.json
  tables/
    screens.json
    areas.json
    components.json

apps/web/
  fixtures/
    smoke-runs/
      README.md
      <curated-run-id>/
        manifest.json
        artifacts/
          final-result.json
          27-validation-report.json
          22-quality-review-agent-result.json
  src/
    lib/
      smoke-runs.ts
      render-tree-diff.ts
      quality-scorecard.ts
    components/
      smoke/
        RunBrowser.tsx
        RunPreview.tsx
        RunCompare.tsx
        RenderTreeDiffPanel.tsx

packages/pipeline/
  src/
    public/
      render-tree-apply.ts
      render-tree-to-tables.ts
      table-merge.ts
    __tests__/
      render-tree-apply.test.ts

apps/smoke/
  src/
    apply-tables-cli.ts
```

`data/runs`는 검토용 생성 산출물이다. 전체를 commit할지, 선별 run만 commit할지는 `.gitignore`와 fixture 승격 정책에서 결정한다. `apps/web/fixtures/smoke-runs`는 web UI 테스트용 curated fixture만 보관한다.

### 책임별 디렉터리

| 경로                                                    | 책임                                                    |
| ------------------------------------------------------- | ------------------------------------------------------- |
| `data/runs/screen-generation/<run-id>`                  | smoke 생성 후보와 검토 artifact 저장                    |
| `data/tables`                                           | 승인된 화면 table read model                            |
| `apps/web/src/lib/smoke-runs.ts`                        | run manifest 목록 조회와 artifact lazy read             |
| `apps/web/src/lib/render-tree-diff.ts`                  | RenderTree 간 비교용 derived diff                       |
| `apps/web/src/lib/quality-scorecard.ts`                 | web 테스트베드용 비교 점수 산출                         |
| `apps/web/src/components/smoke/*`                       | run browser, preview, compare UI                        |
| `packages/pipeline/src/public/render-tree-to-tables.ts` | 순수 `RenderTreeContract -> generated table rows` 분해  |
| `packages/pipeline/src/public/render-tree-apply.ts`     | 기존 `data/tables`에 분해 결과를 merge하는 apply helper |
| `apps/smoke/src/apply-tables-cli.ts`                    | manifest 기반 dry-run/write CLI                         |

`render-tree-to-tables.ts`는 과거 web adapter였던 `render-tree-to-tables.ts`의 알고리즘을 이식하지만, 위치는 web이 아니라 pipeline public helper로 둔다. 이유는 apply가 web UI 전용 기능이 아니라 CLI/server action에서도 재사용되는 side effect 전 단계이기 때문이다.

## 구현 순서

1. `smoke-run-manifest.v0.1` 타입과 manifest 작성 command 추가
2. pipeline option에 artifact store preset 추가
3. CLI에 `--artifact-store`, `--artifact-root`, `--save-local` 옵션 추가
4. 기본 smoke output root와 web 조회 root를 `data/runs/screen-generation`으로 변경
5. 과거 `render-tree-to-tables.ts` 알고리즘을 현재 `RenderTreeContract -> data/tables` 구조로 이식
6. `mergeRenderTreeIntoTables()` 또는 동등한 apply helper 추가
7. `apply-tables` CLI를 manifest + `final-result.json` 기준으로 변경
8. web Run Browser 구현
9. Side-by-side preview 구현
10. RenderTree diff와 scorecard 구현
11. web approve/apply action 연결
12. selected run을 web fixture로 승격하는 smoke command 추가

현재 구현 상태:

- 1~10은 pipeline manifest, `data-run` artifact store, web Run Browser, side-by-side preview, RenderTree diff/scorecard로 구현했다.
- 11은 `/api/smoke-runs/apply`와 web `Dry`/`Apply` 버튼으로 연결했다.
- 12는 `npm run smoke:promote-fixture` 명령으로 연결했다.

## 열린 이슈

- `data/runs`를 완전히 local-only로 둘지, 일부 benchmark를 commit할지 결정해야 한다.
- quality score를 `@cx/validation`에 둘지 web-only derived metric으로 둘지 결정해야 한다.
- annotation 저장 위치를 local JSON으로 둘지, 후속 backend/read model로 둘지 결정해야 한다.
- `apply-tables` CLI는 앞으로 `17-agent-result.json` 같은 번호 파일을 직접 보지 말고 manifest key를 따라가야 한다.
- generated wrapper node를 flatten할지 warning 후 drop할지, 또는 table row로 남길지 세부 규칙을 정해야 한다.
- RenderTree component node의 `metadata.id`를 그대로 component id로 쓸지, 충돌 방지를 위해 screen id prefix를 강제할지 정해야 한다.
- RenderTree root `metadata`와 `Screen` node `metadata` 중 어느 값을 screen row metadata의 우선순위로 쓸지 정해야 한다.

## 결론

스모크 결과를 web 내부에 기본 내장하는 것은 권장하지 않는다. 대신 `data/runs/screen-generation` artifact store를 만들고, web은 이를 읽는 테스트베드가 되는 편이 낫다.

web 내부에는 장기 비교에 필요한 curated fixture만 둔다. 만족한 run은 명시적 approve/apply action으로 `final-result.json` RenderTree를 분해해 `data/tables`에 등록한다. 이렇게 하면 smoke/pipeline I/O 경계는 유지하면서도 web에서 조회, 비교, 승인 반영이 가능해진다.
