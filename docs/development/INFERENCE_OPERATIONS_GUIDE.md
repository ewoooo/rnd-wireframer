# Inference 조작 가이드 (For AI Agents & Operators)

이 문서는 screen-generation inference 파이프라인을 **조작하고 변경하려는 사람/AI**를 위한 운영 가이드다.
아키텍처 자체의 SSOT는 [SCREEN_INFERENCE_ARCHITECTURE.md](./SCREEN_INFERENCE_ARCHITECTURE.md)이며, 이 문서는 "어디를 어떻게 고치면 무엇이 바뀌는가"에 집중한다.

빠른 길찾기:

| 하고 싶은 일 | 봐야 할 섹션 |
| --- | --- |
| 파이프라인 실행/재실행/특정 step부터 재개 | §1 |
| step 추가·삭제·순서 변경, 조건부 실행 | §1.3 |
| 프롬프트/스킬/정답지(reference) 수정·추가 | §2 |
| step 간 데이터 전달 바꾸기 | §3 |
| 실행 결과 디버깅 (왜 이렇게 나왔지?) | §4 |
| 산출물 스키마(필드) 추가·변경 | §5 |

---

## 0. 전체 구조 한 장 요약

```
Job Input ─▶ [01 source-spec(fn)] ─▶ [02 screen-intent(claude)] ─▶ [03 composition(claude)]
          ─▶ [04 render-tree(claude)] ─▶ [05 validation(fn)] ─▶ [06 revision(claude, 조건부)]
          ─▶ [07 validation-after-revision(fn, 조건부)] ─▶ [08 quality(claude)]
```

- **파이프라인 정의(선언)**: `packages/inference/src/pipelines/screen-generation-v1.ts`
- **Knowledge (Long-term Memory, 읽기 전용)**: `@cx/agent`(프롬프트·스킬·skillset·reference), `@cx/schema`(output contract), `@cx/external`(component catalog), `@cx/layout`(layout catalog), `@cx/tokens`
- **Working Memory (run-local, 읽기/쓰기)**: `.data/inference-jobs/{jobId}/context/*.json`
- **중간 산출물(감사 로그)**: `.data/inference-jobs/{jobId}/steps/{stepId}/*.json`
- **엔진**: `claude`(LLM 호출, `@cx/agent` task로 위임) / `function`(결정적 TS 함수)

세 메모리의 역할 구분이 모든 조작의 기준이다:

| 계층 | 성격 | 쓰기 주체 | 수명 |
| --- | --- | --- | --- |
| Knowledge Base | Long-term Memory. 코드/문서로 버전 관리 | 사람/AI가 repo 커밋으로 | 영구 |
| Pipeline Context | Working Memory. step 간 데이터 전달 | step의 `writeToContext` | job 1회 실행 |
| Step Artifacts | 감사·재현용 스냅샷 | worker가 자동 기록 | job 디렉터리 수명 |

---

## 1. 파이프라인 운영 방식

### 1.1 실행 진입점

웹 앱이 런타임을 소유한다. 런타임 조립은 `apps/web/src/server/inference-runtime.ts`:

```ts
export const inferenceRuntime: InferenceRuntime = createInferenceRuntime({
	dataRoot,                                      // .data/inference-jobs
	pipelines: [screenGenerationPipelineV1],
	functions: { "source-spec-mvp": buildSourceSpec },
	claudeRunner: createClaudeRunner({ localFirst: true }),
});
```

REST API (전체 목록은 [API_ENDPOINTS.md](./API_ENDPOINTS.md)):

| 엔드포인트 | 용도 |
| --- | --- |
| `POST /api/inference` | job 생성 + 실행 시작 |
| `GET /api/inference/runs` | job 목록 |
| `GET /api/inference/{jobId}` | job 상태 |
| `POST /api/inference/{jobId}/rerun` | 재실행. body `{ "startFromStepId": "04-render-tree", "contextOverrides": { "composition-plan": {…} } }` — overrides는 step 실행 전에 working memory에 기록. job이 terminal(succeeded/failed) 상태일 때만 허용(진행 중이면 `409`), 모르는 step id는 `400` |
| `GET /api/inference/{jobId}/steps` · `/events` | step 상태 · 이벤트 스트림(ndjson) |
| `GET /api/inference/{jobId}/artifacts/{...path}` | 산출물 직접 조회 |
| `POST /api/inference/{jobId}/apply` | 결과를 앱 DB에 적용 |

### 1.2 실행 의미론 (worker가 보장하는 것)

`packages/inference/src/worker/run-inference-job.ts`가 단일 루프로 실행한다. 조작 시 알아야 할 규칙:

1. **순차 실행**: steps 배열 순서대로 돈다. 병렬 없음.
2. **`startFromStepId` 재개**: 이전 step들은 건너뛰지만, 같은 jobId의 디스크에 남은 `context/*.json`을 그대로 읽는다. → **앞 step의 working memory가 이미 있어야 중간 재개가 동작한다.** 새 job에 `startFromStepId`를 주면 context read에서 실패한다.
3. **조건부 실행 `runWhen`**: 현재 유일한 조건은 `onValidationReportErrors(contextKey)` — context의 validation-report에 error가 있을 때만 실행. 06/07 step이 이 방식으로 "수정 루프"를 만든다.
4. **실패 정책 `output.failWhen`**: `failOnValidationReportErrors`가 걸린 step(07)은 출력에 error가 남아 있으면 job 자체를 `failed`로 만든다.
5. **step 실패 = job 실패**: step 하나가 throw하면 이후 step은 돌지 않고 `job_failed` 이벤트가 기록된다. 단, 실패 step의 execution artifacts(inputs/prompt/raw-response)는 이미 기록돼 있으므로 디버깅 가능(§4).

### 1.3 파이프라인 정의 변경하기

파이프라인은 **선언만** 한다 (`screen-generation-v1.ts`). step 하나의 모양:

```ts
defineStep({
	id: "03-composition",                  // startFromStepId, 산출물 디렉터리명
	task: "composition-planning",          // claude step 표식 + 동명 skillset 자동 로드
	inputs: contexts("source-spec", "screen-intent"), // Working Memory 읽기 (camelCase key 자동)
	references: {                          // task skillset 외에 추가로 줄 지식만
		layoutCatalog: knowledge("layout-catalog"),
		referenceCatalog: referenceCatalog("screen"),
	},
	output: {
		contractRef: outputContractRef("composition-plan"), // @cx/schema artifact kind
		// writeToContext 생략 시 contract id("composition-plan")로 자동 기록. false면 기록 안 함
	},
})
```

규약 세 가지가 선언을 짧게 만든다:

- **`task` 하나가 세 가지를 결정**: claude 엔진 라우팅, `docs/skills/skillsets/{task}.md` skillset 자동 로드, 프롬프트의 작업 명칭. `run`이 있으면 function step, `task`가 있으면 claude step (`defineStep`이 정확히 하나만 허용).
- **skillset 자동 주입**: 자동 로드된 skillset도 `references.json`에 그대로 스냅샷되므로 감사 가능성은 동일하다. `references.skillset`을 명시하면 규약을 덮어쓴다.
- **`writeToContext` 디폴트 = contract id**: v1의 모든 step이 디폴트를 쓴다. 06-revision이 `render-tree`를 덮어쓰는 것도 contract id가 같기 때문.

**claude step 추가 절차** (의존 순서대로):

1. `@cx/schema`에 output contract 준비 (§5) — 이미 있으면 생략
2. skillset 매니페스트 작성: `docs/skills/skillsets/{task}.md` + `pnpm sync:skillset` (§2.3)
3. `screen-generation-v1.ts`에 `defineStep({ task: "{task}", ... })` 추가. `inputs`는 앞 step들의 context key만 참조 가능
4. 테스트 픽스처 갱신: `packages/inference/src/__tests__/screen-generation-v1.test.ts` 등이 step 목록·참조를 검증한다

**function step 추가 절차**:

1. `InferenceFunction` 시그니처(`(request: EngineRequest) => output`)로 함수 작성. 예: `packages/inference/src/functions/deterministic-validation.ts`
2. 등록: 패키지 공용이면 `create-inference-runtime.ts`의 기본 `functions` 맵, 앱 전용이면 `apps/web/src/server/inference-runtime.ts`의 `functions` config
3. step에서 `run: { id: "함수-키" }`로 참조

**주의 — least-context 원칙**: step은 선언한 `inputs`/`references`만 받는다. "전체 context" 와일드카드는 의도적으로 없다. step에 정보가 부족하면 **필요한 key를 명시적으로 추가**하는 것이 정답이고, 거대한 입력을 통째로 넘기는 것은 안티패턴이다.

---

## 2. Knowledge (Long-term Memory) 작성·등록

Knowledge는 **run 중 읽기 전용**이며, 전부 repo의 코드/문서로 버전 관리된다. step에서는 `knowledge(source, id?)`로 참조하고, 리졸버 테이블은 `packages/inference/src/knowledge/knowledge-base.ts`의 `KNOWLEDGE_RESOLVERS`다.

| source | 참조 방법 | 소유 패키지 / 등록 위치 |
| --- | --- | --- |
| `skillset` | step의 `task`가 자동 로드 (추가분은 `skillset("{task}")`) | `@cx/agent` `docs/skills/skillsets/{task}.md` + `pnpm sync:skillset` |
| `reference-{category}-{index\|catalog}` | `referenceIndex("screen")` / `referenceCatalog("screen")` | `@cx/agent` `docs/references/` + `pnpm sync:reference` |
| `component-catalog` | `knowledge("component-catalog")` | `@cx/external/resolver` |
| `layout-catalog` | `knowledge("layout-catalog")` | `@cx/layout/resolver` |
| `token-catalog` | `knowledge("token-catalog")` | `@cx/tokens` |

> markdown 지식(skillset·reference)은 전부 **".md 작성 → `pnpm sync:*` 실행"** 한 가지 패턴이다.
> 생성된 `catalog.generated.ts`는 직접 수정하지 말 것.

모든 리졸버는 `SsotObject`(`{ kind, id, owner, sourceRef, schemaVersion: "ssot-object.v1", data }`)를 반환하고, 이 객체가 그대로 step의 `references.json`에 기록된다.

### 2.1 프롬프트 추가/수정

1. 본문 작성: `packages/agent/docs/prompts/{name}.md`
2. 해당 task의 skillset 매니페스트(§2.3)에 `- prompt ../docs/prompts/{name}.md` 한 줄 추가 후 `pnpm sync:skillset`

별도의 task 정의/카탈로그는 없다 — claude 엔진이 step의 `task` 이름과 output contract로 프롬프트를 직접 조립한다.

### 2.2 스킬 추가/수정

1. 본문 작성: `packages/agent/docs/skills/{group}/{skill}/` 아래 markdown
2. 사용할 skillset 매니페스트(§2.3)에 `- skill <경로>` 한 줄 추가 후 `pnpm sync:skillset`

### 2.3 Skillset (task당 하나, step에 자동 로드되는 지식 패키지)

skillset은 `packages/agent/docs/skills/skillsets/{task}.md` 매니페스트가 SSOT다.
**파일명 = task명 = skillset id**이고(`screen-intent.md` → step의 `task: "screen-intent"`가 자동 로드),
frontmatter의 `documents`가 LLM에 전달될 문서를 **순서대로** 나열한다:

```yaml
---
documents:
  - prompt ../docs/prompts/screen-intent.md
  - skill ../docs/skills/review-skills/source-fidelity-review/README.md
---
```

- 항목 형식은 `<kind> <sourceRef>` (kind: `prompt` | `skill`), sourceRef는 `packages/agent/src` 기준 상대경로
- 수정 후 `pnpm sync:skillset` 실행 → `src/skillset-catalog/catalog.generated.ts` 재생성 (직접 수정 금지)
- **특정 step에 지식을 더 주고 싶다** → 매니페스트에 한 줄 추가 + sync가 가장 작은 변경이다 (코드 변경 없음)
- 문서 id는 각 문서의 frontmatter `id`에서 읽고, 없으면 sourceRef 경로에서 유추된다.

### 2.4 Reference (정답지 화면)

reference는 markdown + frontmatter가 SSOT이고, 카탈로그 TS는 **생성물**이다:

1. `packages/agent/docs/references/screens/{reference-id}/README.md` 작성. frontmatter에 `id`, `situation`, `tags`, (선택) `sotNodeRef`
2. `pnpm sync:reference` 실행 → `catalog.generated.ts` 재생성. **생성 파일을 직접 수정하지 말 것**
3. 새 카테고리가 필요하면 `src/reference-catalog/categories.ts`에 디렉터리 매핑 추가

step에서의 사용 모드 두 가지:
- `knowledge("reference-screen-index")` — 메타데이터만 (02 screen-intent가 매칭용으로 사용)
- `knowledge("reference-screen-catalog")` — 본문 포함 (03 composition이 사용)

skillset(§2.3)과 동일한 ".md + sync" 패턴이며, sync 스크립트만 다르다(`pnpm sync:reference`).

> 현재 시드가 적어 코퍼스 확장이 품질 레버다. reference 추가는 코드 변경 없이 .md + sync로 끝나는 가장 싼 품질 개선 수단이다.

### 2.5 카탈로그 계열 (component / layout / token)

이들은 각 패키지의 SSOT에서 파생되며 inference 쪽에서 등록할 것이 없다. 내용을 바꾸려면 **소유 패키지의 SSOT를 고친다** (component → `@cx/external`, layout → `@cx/layout` + `pnpm sync:layout`, token → `@cx/tokens`).

### 2.6 새 knowledge source 종류 추가

`knowledge-base.ts`의 `KNOWLEDGE_RESOLVERS`에 항목 추가 + `@cx/schema`의 `InferenceReference` union에 새 SsotObject kind 추가. source 문자열 분기는 이 테이블이 유일한 진실원이다 — 다른 곳에 switch를 만들지 말 것.

---

## 3. Working Memory 사용 방식

Working Memory = Pipeline Context. 구현은 `packages/inference/src/context/context-store.ts`, 물리적으로는 `.data/inference-jobs/{jobId}/context/{key}.json`.

**쓰기** — step 성공 시 worker가 출력을 **contract id와 같은 key**로 자동 저장한다. 다른 key가 필요하면 `writeToContext: "key"`, 저장을 끄려면 `writeToContext: false`. step 코드가 직접 쓰는 경로는 없다.

**읽기** — 다음 step이 `inputs: { foo: context("key") }`로 선언한다. key는 `^[a-z0-9-]+$`만 허용.

운영 시 알아야 할 성질:

1. **덮어쓰기로 최신본 유지**: 06-revision은 `render-tree` key를 다시 쓴다. 이후 step(07, 08)은 자동으로 수정본을 읽는다. "수정 결과를 별도 key로 만들고 분기"하지 말고 같은 key를 덮어쓰는 것이 이 파이프라인의 관례다.
2. **재실행과의 상호작용 = 실험 루프**: `startFromStepId` 재개는 디스크에 남은 context를 그대로 읽고, `contextOverrides`는 step 실행 전에 해당 key를 덮어쓴다. 즉 **API 한 번으로 "중간값을 바꿔서 그 지점부터 다시 돌리기"가 끝난다**:
   ```json
   POST /api/inference/{jobId}/rerun
   { "startFromStepId": "04-render-tree", "contextOverrides": { "composition-plan": { …수정본… } } }
   ```
   key는 `^[a-z0-9-]+$`만 허용(위반 시 400). 파일을 직접 고치는 방법도 여전히 동작하지만 API가 표준 경로다.

   > ⚠️ **override 값은 output-contract 스키마 검증을 거치지 않는다** — step 출력과 달리 HTTP로 받은 값이 그대로 working memory에 들어간다. 이건 의도된 설계(중간값을 일부러 틀어서 하류 동작을 실험)지만, 부작용으로 게이팅 신호를 조작할 수 있다. 예: `validation-report`를 `{summary:{errorCount:0}}`로 덮으면 06-revision/07-validation의 `runWhen`이 꺼져 수정·재검증을 건너뛴 채 job이 성공으로 보고된다. 실험용으로만 쓰고, 신뢰할 수 없는 입력을 이 엔드포인트에 노출하지 말 것(현재 inference API 전체가 무인증이다).
3. **Context는 감사 로그가 아니다**: UI/리뷰어가 봐야 할 것은 events 또는 step artifacts에 기록된다. context는 언제든 다음 step에 의해 덮일 수 있는 스크래치다.
4. **key 추가 = 계약 추가**: 새 key를 쓰면 그 key를 읽는 step과의 암묵적 계약이 생긴다. 어떤 step이 어떤 key를 읽고 쓰는지는 파이프라인 정의 파일 한 곳에서 전부 보이므로, 변경 전 반드시 그 파일에서 사용처를 확인할 것.

현재 v1의 context key 흐름:

| key | 쓰는 step | 읽는 step |
| --- | --- | --- |
| `source-spec` | 01 | 02, 03, 05, 06, 07 |
| `screen-intent` | 02 | 03, 04, 05, 06, 07 |
| `composition-plan` | 03 | 04, 05, 06, 07, 08 |
| `render-tree` | 04, **06(덮어씀)** | 05, 06, 07, 08 |
| `validation-report` | 05, **07(덮어씀)** | 06(runWhen+input), 07(runWhen), 08 |
| `quality-inspection` | 08 | (최종 산출물) |

---

## 4. Inference 중간 산출물

job 하나의 디렉터리 (`.data/inference-jobs/{jobId}/`):

```
job.json                      job 메타 (pipelineId/version, status, input, 타임스탬프)
events.ndjson                 job/step 라이프사이클 이벤트 스트림
context/{key}.json            Working Memory (§3)
steps/{stepId}/
  inputs.json                 resolve된 working memory 입력 — step이 실제로 받은 값
  references.json             resolve된 knowledge — step이 실제로 받은 지식 (SsotObject 그대로)
  output-contract.json        이 step에 적용된 JSON Schema 스냅샷
  prompt.json                 (claude step만) 엔진이 실제로 조립해 보낸 프롬프트(system/user/metadata)
  raw-response.json           엔진의 원본 응답 (실패한 step에만 — 성공 시 output.json과 동일해서 생략)
  output.json                 검증 통과한 최종 출력 (성공한 step에만)
  step.json                   step 상태/타이밍
```

즉 `output.json`과 `raw-response.json`은 상호 배타다: **output이 있으면 성공, raw-response가 있으면 실패**.

경로 상수의 단일 진실원: `packages/inference/src/contracts/artifact-paths.ts` (`INFERENCE_ARTIFACT_PATH`). 경로 문자열을 하드코딩하지 말 것.

### 디버깅 순서 (출력이 이상할 때)

1. `steps/{stepId}/inputs.json` — 입력이 잘못 들어왔나? (앞 step 문제)
2. `steps/{stepId}/references.json` — 지식이 빠졌거나 낡았나? (knowledge 등록 문제, §2)
3. `steps/{stepId}/prompt.json` — 프롬프트가 의도대로 렌더됐나? (@cx/agent task 문제)
4. `steps/{stepId}/raw-response.json` — 실패한 step에만 남는 엔진 원본 응답. 이게 있고 output.json이 없으면 contract 검증 실패 또는 failWhen 정책 발동 (§5)
5. `context/validation-report.json` — validator가 뭐라고 했나?

실패한 step도 1~4는 기록돼 있다. 원인 수정 후 `rerun + startFromStepId`로 해당 step부터만 재실행하면 된다.

---

## 5. Output Contract 조정 방식

Output contract는 `@cx/schema`가 소유하는 **JSON Schema (Draft 2020-12)** 다. zod가 아니라 TS 객체로 직접 작성된 JSON Schema임에 주의.

관련 파일 (모두 `packages/schema/src/`):

| 파일 | 역할 |
| --- | --- |
| `artifact-kind.ts` | `GenerationArtifactKind` — 허용되는 contract id 목록 |
| `json-schema-registry.ts` | kind별 `create{Name}JsonSchema()` 함수 + `JSON_SCHEMA_BY_ARTIFACT_KIND` |
| `inference-reference.ts` | `resolveOutputContractForInference(id)` + `DTO_NAME_BY_ARTIFACT_KIND` |

### 5.1 기존 contract에 필드 추가/변경

1. `json-schema-registry.ts`의 해당 `create...JsonSchema()` 수정 (`properties` + 필요 시 `required`)
2. **영향 전파 체크리스트** — 스키마는 단순 문서가 아니라 게이트다:
   - `@cx/validation`의 semantic validator (`validateRenderTree`, `validateCompositionPlan` 등)가 새 필드를 검사해야 하면 함께 수정
   - 테스트 픽스처: required 필드를 추가하면 `packages/inference`·`packages/validation`의 e2e/validator 픽스처가 깨진다 (최근 커밋 `dc0904af`, `caa02ded`가 정확히 이 패턴)
   - 해당 필드를 **생산**하는 프롬프트/스킬(§2)도 갱신 — 스키마만 늘리고 프롬프트를 안 고치면 claude step이 검증 실패로 죽는다
3. 재현 확인: 기존 job에서 해당 step부터 rerun

### 5.2 새 contract(산출물 종류) 추가

1. `artifact-kind.ts`의 `GenerationArtifactKind`에 id 추가 + `SCHEMA_VERSION_BY_ARTIFACT_KIND` 버전 매핑
2. `json-schema-registry.ts`에 `create{Name}JsonSchema()` 작성, `JSON_SCHEMA_BY_ARTIFACT_KIND`에 등록
3. `inference-reference.ts`의 `DTO_NAME_BY_ARTIFACT_KIND`에 DTO 이름 매핑
4. 파이프라인 step에서 `outputContractRef("{id}")`로 참조

### 5.3 contract가 실행에 미치는 효과

- **claude step**: engine이 `outputContract.data.jsonSchema`를 LLM context에 넣고 "Produce {dtoName}"을 요구한다. 즉 스키마가 곧 프롬프트의 일부다.
- **검증 게이트**: `runStep`이 출력에 schema validate를 적용한다. 통과 못 하면 `output.json`이 안 생기고 step 실패.
- **스냅샷**: 적용된 스키마가 `steps/{stepId}/output-contract.json`으로 동결되므로, 과거 job과 현재 스키마의 diff로 회귀 원인을 추적할 수 있다.

---

## 6. 변경 유형별 최소 비용 요약

| 바꾸고 싶은 것 | 건드리는 곳 | 코드 변경? |
| --- | --- | --- |
| 프롬프트 문구 | `packages/agent/docs/prompts/*.md` | ❌ |
| step에 지식 추가 | skillset 매니페스트 한 줄 + `pnpm sync:skillset` | ❌ |
| 정답지 추가 | reference .md + `pnpm sync:reference` | ❌ |
| 산출물 필드 추가 | schema registry + 프롬프트 + 픽스처 | ✅ |
| claude step 추가 | skillset 매니페스트 + `defineStep({ task })` | ✅ (defineStep 한 블록) |
| step 순서 변경 | `screen-generation-v1.ts` steps 배열 | ✅ |
| 검증 규칙 추가 | `@cx/validation` + deterministic-validation | ✅ |
| 실험 (중간값 조작 후 재실행) | rerun API `{ startFromStepId, contextOverrides }` 한 번 | ❌ |
