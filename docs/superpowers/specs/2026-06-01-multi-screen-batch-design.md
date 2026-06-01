# 다중 화면 배치 인퍼런스 설계

**작성일:** 2026-06-01
**상태:** 확정 (plan 생략, TDD 직접 구현)

## 목표

여러 화면 markdown을 한 번의 명령으로 순차 추론하고, 화면별 독립 run 폴더 + 집계 요약을 만든다. 첫 사용 대상은 `260527_prdd`의 base 화면 17개를 fake 러너로 돌려 design-context 개선이 다양한 화면 유형에 일관되게 적용되는지 눈으로 검증하는 것.

## 비목표 (YAGNI)

- 병렬 실행 (순차로 충분, fake 러너는 빠르고 결정적)
- 배치 전용 web 그룹 UI (flat run + tag로 식별)
- family/variant 인지 캐싱 (resolver-variant 최적화는 별도 작업)
- pipeline의 multi-source 모드 (파이프라인은 "1회 = 1화면" 단일 책임 유지)

## 아키텍처

배치는 순수 IO 오케스트레이션이므로 CLI 엔트리인 `apps/smoke`에 둔다. 기존 단일 화면 `runPipeline`/`runGenerationSmoke`를 파일마다 순차 호출하는 얇은 루프. web explorer(`apps/web/src/lib/smoke-runs.ts`)는 `data/runs/screen-generation/` 아래 모든 run 폴더를 자동 수집·정렬하므로 web 변경 불필요.

```
CLI(--target-dir,--glob,--batch-id)
  → resolveBatchTargets(dir, glob?)        # .md 수집 + glob 필터 + 정렬
  → runGenerationBatch(targets, options)   # 순차 runGenerationSmoke 루프 + 집계
      ↳ 화면마다 runId=<batch-id>-<basename>, tags=[batch-id]
  → 집계 테이블 출력 + exit code
```

## 유닛 (각 단일 책임)

### 1. 파이프라인 `tags` 옵션 (additive)
- `ScreenGenerationPipelineOptions`에 `tags?: string[]` 추가.
- `screen-generation-pipeline.ts`의 manifest 작성부(`tags: []` 하드코딩)를 `state.options.tags ?? []`로 교체.
- 기존 동작 보존: tags 미지정 시 빈 배열.

### 2. `resolveBatchTargets(dir, glob?)` — `apps/smoke/src/generation/batch/resolve-targets.ts`
- 디렉터리 내 항목 읽어 `.md` 파일만 필터.
- glob 제공 시 basename에 glob→regex 변환 매칭 (`*` → `.*`, `?` → `.`, 그 외 escape).
- 절대경로 정렬 배열 반환. 디렉터리 없으면 빈 배열.
- glob→regex는 별도 작은 순수 함수 `globToRegExp(pattern)`로 분리해 단위 테스트.

### 3. `runGenerationBatch(options)` — `apps/smoke/src/generation/batch/run-batch.ts`
- 입력: `{ targetDir, glob?, batchId?, useAI?, artifactStore?, artifactRoot?, disableDesignContext? }`.
- batchId 기본값 `batch-<timestamp>`.
- `resolveBatchTargets`로 타깃 확보 → 순차 루프.
- 화면마다 `runGenerationSmoke(target, { runId: \`${batchId}-${basename}\`, tags: [batchId], ...shared })`.
- continue-on-error: try/catch로 실패 기록 후 다음 화면 진행.
- 반환: `{ batchId, results: Array<{ screen, ok, errorCount, warningCount, runDir, error? }>, okCount, failCount }`.

### 4. CLI 인자 확장 — `apps/smoke/src/cli.ts`
- `--target-dir <dir>`, `--glob <pattern>`, `--batch-id <id>` 파싱.
- `--target-dir` 있으면 배치 경로(`runGenerationBatch`), 없으면 기존 단일 경로 유지(하위호환).
- 배치 종료 시 화면→ok/error/warning 테이블 출력, 실패 1개 이상이면 exit code 1.
- 루트 스크립트 `smoke:batch` 추가(선택).

## 데이터 흐름

CLI 파싱 → `resolveBatchTargets` → 타깃 리스트 → 순차 `runGenerationSmoke`(화면별 run 폴더 생성, manifest.tags/runId 설정) → 화면별 결과 수집 → 집계 테이블 출력.

## 에러 처리

- 화면 단위 parse/validate 실패는 배치를 중단하지 않는다(continue-on-error). 결과 배열에 `error`/`ok:false` 기록.
- 배치 끝에 요약 테이블 출력. 실패가 하나라도 있으면 process exit code 1.
- 디렉터리가 비었거나 매칭 0건이면 명확한 메시지 출력 후 비정상 종료.

## 테스트

- `globToRegExp`: `*`/`?`/리터럴/특수문자 escape 매칭 유닛 테스트.
- `resolveBatchTargets`: 임시 fixture 디렉터리로 `.md`만 수집·glob 필터·정렬 검증.
- `runGenerationBatch`: fake 러너로 prdd 소수 fixture(또는 임시 md) 배치 실행 → run 폴더 수, manifest.tags/runId, 집계(okCount/failCount) 검증. 임시 artifact-root로 격리.

## 검증 (실사용)

`--target-dir data/client-imports/{id}/260527_prdd --glob '*-0.md'` 를 fake 러너로 실행 → 17개 run 생성 확인 → apps/web `/smoke`에서 tag로 묶인 배치 결과 확인.
