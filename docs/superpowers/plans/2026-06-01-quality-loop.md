# 품질 루프 (Quality Loop) 구현 계획

> **For agentic workers:** TDD로 task 단위 구현. 각 task는 red→green→commit. 순수 orchestration + 프롬프트 변경만, IO·catalog 변형 없음.

**Goal:** quality-review의 layer/dimension 점수(hierarchy/separation/fidelity)가 낮으면 — P0 finding이 없어도 — 단일 표적 revision을 1회 걸어 품질을 끌어올린다.

**Architecture:** `buildGenerationNextAction`(순수 결정 함수)에 점수 임계 판정을 추가하고, revision 입력이 낮은 차원에 집중하도록 프롬프트를 보강한다. stage 재실행·영속화 없음. 기존 단일 revision agent를 "표적화"만 한다.

**Tech Stack:** TypeScript, `@cx/orchestration`(순수), vitest, biome.

---

## 1. 배경 / 현재 한계

`packages/orchestration/src/public/next-action.ts`의 `buildGenerationNextAction`은 현재 quality inspection을 **findings.severity로만** 읽는다(`readQualityInspection`은 finding 개수만 셈). 방금 landing된 `scores: {hierarchy, separation, fidelity}`(0–5)와 findings의 `layer` 메타는 **전혀 읽지 않는다.** 따라서 점수가 2여도 P0 finding이 없으면 `write-artifacts`로 통과한다.

증거: 이번 세션 mbr eval에서 PU-003 hierarchy=3, PG-001 separation=3 등 낮은 점수가 있었지만 어떤 revision도 트리거되지 않았다.

## 2. 기대 효과

- **품질 점수가 행동으로 이어진다.** "기록만 되던" layer 점수가 revision을 구동 → 낮은 위계/구분/충실도가 자동으로 1회 교정된다.
- **표적 교정.** revision이 "전체 다시"가 아니라 "점수 낮은 차원 + 그 layer의 findings"에 집중 → 유효한 구조 보존, 토큰 효율.
- **루프의 첫 단추.** layer 점수 → next-action 연결이 생기면, 이후 "layer별 stage 재생성" 같은 정교한 표적화로 확장할 토대가 된다.
- **회귀 가시성.** 점수 트리거가 생기면 어느 차원이 자주 낮은지(=guidance/catalog 보강 지점)가 next-action 로그로 드러난다.

## 3. 성공 기준

기능:
- 점수 하나라도 `< 3`이고 validation error·P0 finding이 없으면 → `request-revision` (target `"quality"`, `focus`에 낮은 차원·점수 채워짐).
- 재시도 후(retryCount>0)에도 점수가 낮으면 → `request-human-review` (무한 루프 없음).
- 모든 점수 `≥ 3` + finding 없음 → `write-artifacts` (기존 동작 보존).
- `scores`가 없으면(undefined) 기존 동작 100% 보존(하위호환).
- 우선순위 불변: validation error > P0 finding > **낮은 점수** > warning.

검증:
- `npx tsc -p tsconfig.json --noEmit` exit 0.
- `npx vitest run packages/orchestration` 전부 green (신규 4 케이스 포함, 기존 케이스 무회귀).
- `npx biome lint` 변경 파일 clean.
- fake smoke 1회: 낮은 점수를 만드는 fixture에서 `trace.json`의 revision decision이 `request-revision`/target quality로 찍힘 (또는 점수 충분하면 write-artifacts).

품질(실증, 별도 후속):
- real `--use-ai`로 mbr base 재실행 시, 점수 트리거 revision이 hierarchy/separation 점수를 올리는지 1건 이상 확인.

## 4. 예상 시스템 변동성 (blast radius)

**변경 파일 (좁음, 순수 레이어):**
- `packages/orchestration/src/public/next-action.ts` — 판정 로직 (핵심)
- `packages/orchestration/src/public/types.ts` — `GenerationNextAction`의 request-revision 변형에 `focus?` 추가
- `packages/orchestration/src/public/agent-inputs.ts` — `buildScreenRevisionAgentInput` query에 focus 지시 1줄
- `packages/orchestration/src/__tests__/public-api.test.ts` — 신규 테스트
- (선택) `packages/agent/docs/quality-review/checklist.md` — "점수 < 3 = revision 대상" 기준 명문화

**동작 변동:**
- **revision 트리거 빈도 증가.** 지금은 error/P0에서만 revision. 추가 후엔 "점수 낮음"에서도 1회 더 걸릴 수 있음 → real `--use-ai`에서 **AI 호출이 화면당 최대 1회 증가**(retry 상한 1 유지하므로 그 이상 없음). fake 모드는 비용 0.
- **fake 모드 결과 변동 가능.** fake quality inspection이 낮은 점수를 내면 fake revision이 한 번 더 돈다(payload는 previousCandidate 반환이라 트리 불변). 산출물 구조는 동일.
- **하위호환:** `scores` 없는 기존 run/픽스처는 분기 진입 안 함 → 무변동.

**위험 & 완화:**
- *과도한 revision 루프* → retryCount 상한 1로 캡. 점수 트리거도 같은 예산 공유. (완화됨)
- *임계값 자의성(3)* → 명명 상수 `MIN_ACCEPTABLE_SCORE`로 한 곳에 두고, 튜닝은 후속. P0/error보다 항상 후순위라 안전.
- *옆 세션과 파일 겹침* → next-action.ts·types.ts는 옆 세션 미수정. agent-inputs.ts는 공유 → revision query 한 줄만 추가(최소 표면), 커밋 직후 충돌 확인.
- *대상 매핑 모호(점수↔layer)* → 강제 매핑하지 않음. focus엔 dimension+score만 싣고, findings의 `layer`가 위치 단서를 제공. (단일 진실원: layer는 finding이 소유)

## 5. File Structure

| 파일 | 책임 | 변경 |
|---|---|---|
| `next-action.ts` | 결정 함수 | 점수 읽기 + 임계 분기 |
| `types.ts` | 계약 | `focus?: QualityFocus[]` |
| `agent-inputs.ts` | revision 입력 | focus 집중 지시 1줄 |
| `public-api.test.ts` | 테스트 | 신규 4 케이스 |

---

## Task 1: GenerationNextAction에 focus 필드 추가

**Files:**
- Modify: `packages/orchestration/src/public/types.ts`

- [ ] **Step 1: 타입 추가**

```ts
export type QualityFocusDimension = "fidelity" | "hierarchy" | "separation";

export type QualityFocus = {
	dimension: QualityFocusDimension;
	score: number;
};

export type GenerationNextAction =
	| { action: "request-human-review"; reason: string }
	| {
			action: "request-revision";
			reason: string;
			target: "contract" | "quality";
			focus?: QualityFocus[];
	  }
	| { action: "stop"; reason: string }
	| { action: "write-artifacts"; reason: string };
```

- [ ] **Step 2: tsc**

Run: `bunx tsc -p tsconfig.json --noEmit`
Expected: exit 0 (focus는 optional이라 기존 호출부 무변).

- [ ] **Step 3: commit**

```bash
git add packages/orchestration/src/public/types.ts
git commit -m "feat(orchestration): add QualityFocus to GenerationNextAction"
```

## Task 2: next-action 점수 임계 판정 (TDD)

**Files:**
- Modify: `packages/orchestration/src/public/next-action.ts`
- Test: `packages/orchestration/src/__tests__/public-api.test.ts`

- [ ] **Step 1: 실패 테스트 추가** (`describe("@cx/orchestration public API")` 안)

```ts
it("requests a targeted revision when a quality score is below threshold", () => {
	const decision = buildGenerationNextAction({
		retryCount: 0,
		validationReport: { summary: { errorCount: 0, warningCount: 0 } },
		qualityInspection: { findings: [], scores: { hierarchy: 2, separation: 4, fidelity: 5 } },
	});
	expect(decision.action).toBe("request-revision");
	if (decision.action !== "request-revision") throw new Error("expected revision");
	expect(decision.target).toBe("quality");
	expect(decision.focus).toEqual([{ dimension: "hierarchy", score: 2 }]);
});

it("escalates to human review when scores stay low after a retry", () => {
	const decision = buildGenerationNextAction({
		retryCount: 1,
		validationReport: { summary: { errorCount: 0, warningCount: 0 } },
		qualityInspection: { findings: [], scores: { hierarchy: 2, separation: 4, fidelity: 5 } },
	});
	expect(decision.action).toBe("request-human-review");
});

it("writes artifacts when all quality scores meet the threshold", () => {
	const decision = buildGenerationNextAction({
		retryCount: 0,
		validationReport: { summary: { errorCount: 0, warningCount: 0 } },
		qualityInspection: { findings: [], scores: { hierarchy: 4, separation: 3, fidelity: 5 } },
	});
	expect(decision.action).toBe("write-artifacts");
});

it("prioritizes validation errors over low quality scores", () => {
	const decision = buildGenerationNextAction({
		retryCount: 0,
		validationReport: { summary: { errorCount: 1, warningCount: 0 } },
		qualityInspection: { findings: [], scores: { hierarchy: 1, separation: 1, fidelity: 1 } },
	});
	expect(decision.action).toBe("request-revision");
	if (decision.action !== "request-revision") throw new Error("expected revision");
	expect(decision.target).toBe("contract");
});
```

- [ ] **Step 2: red 확인**

Run: `npx vitest run packages/orchestration -t "quality score|human review when scores|threshold|prioritizes validation"`
Expected: FAIL (focus 미구현, 점수 분기 없음).

- [ ] **Step 3: 구현** — `next-action.ts`

`readScores` 헬퍼 추가:

```ts
const MIN_ACCEPTABLE_SCORE = 3;

const SCORE_DIMENSIONS = ["hierarchy", "separation", "fidelity"] as const;

function readLowScores(input: unknown): Array<{ dimension: (typeof SCORE_DIMENSIONS)[number]; score: number }> {
	if (!isRecord(input) || !isRecord(input.scores)) return [];
	const scores = input.scores;
	return SCORE_DIMENSIONS.flatMap((dimension) => {
		const score = scores[dimension];
		return typeof score === "number" && score < MIN_ACCEPTABLE_SCORE
			? [{ dimension, score }]
			: [];
	});
}
```

`buildGenerationNextAction`에서 P0-finding 블록(`qualityInspection.errorCount > 0` 분기) **다음, warning 블록 앞**에 삽입:

```ts
	const lowScores = readLowScores(input.qualityInspection);
	if (lowScores.length > 0) {
		if (input.retryCount > 0) {
			return {
				action: "request-human-review",
				reason: "Quality scores stay below threshold after a revision attempt.",
			};
		}
		return {
			action: "request-revision",
			reason: `Quality scores below ${MIN_ACCEPTABLE_SCORE}: ${lowScores
				.map((entry) => `${entry.dimension}=${entry.score}`)
				.join(", ")}.`,
			target: "quality",
			focus: lowScores,
		};
	}
```

- [ ] **Step 4: green 확인**

Run: `npx vitest run packages/orchestration`
Expected: PASS (신규 4 + 기존 전부).

- [ ] **Step 5: commit**

```bash
git add packages/orchestration/src/public/next-action.ts packages/orchestration/src/__tests__/public-api.test.ts
git commit -m "feat(orchestration): request targeted revision on low quality scores"
```

## Task 3: revision 입력에 focus 집중 지시

**Files:**
- Modify: `packages/orchestration/src/public/agent-inputs.ts` (`buildScreenRevisionAgentInput` query 배열)

- [ ] **Step 1: query 줄 추가** (`"When context.qualityInspection is present..."` 줄 근처)

```ts
"When context.qualityInspection.scores has a dimension below 3 (hierarchy/separation/fidelity), prioritize raising that dimension and address findings whose layer matches it, without rewriting unrelated valid structure.",
```

- [ ] **Step 2: tsc + 기존 테스트**

Run: `bunx tsc -p tsconfig.json --noEmit && npx vitest run packages/orchestration`
Expected: exit 0, green.

- [ ] **Step 3: commit**

```bash
git add packages/orchestration/src/public/agent-inputs.ts
git commit -m "feat(orchestration): focus revision on low-scoring quality dimensions"
```

## Task 4: fake smoke 검증

- [ ] **Step 1: fake run**

Run: `npx tsx apps/smoke/src/cli.ts --target "data/client-imports/{id}/260528_mbr/NOVA-MBR-PU-003-0.md" --artifact-root /tmp/ql-probe --run-id ql`

- [ ] **Step 2: revision decision 확인**

`trace.json`의 `revisionDecision`이 점수에 따라 `request-revision`(target quality, focus) 또는 `write-artifacts`로 찍히는지 확인. (fake scores에 따라 분기)

- [ ] **Step 3: (선택) real --use-ai 1건**

mbr base 1화면 `--use-ai` 재실행 → 점수 트리거 시 revision이 1회 더 돌고 점수가 오르는지 관찰. 비용 인지하 수동.

---

## Out of scope (다음)
- 프로모션 사이클(proposal→candidate→promote→generation 사용).
- layer별 stage 재생성(plan-composition만 재실행 등).
- 임계값 설정화/차원별 가중치.
- score↔layer 강제 매핑.
