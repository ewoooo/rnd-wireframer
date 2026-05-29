# 디자인 컨텍스트 주입 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디자인 지식을 prompt context에 실제로 주입하고, 컴포넌트 제안 레이어와 디자인 자기비평 루프를 추가해 화면 추론 완성도를 높인다.

**Architecture:** orchestration은 ref만 선택(순수), pipeline이 번들 본문을 로드해 agent-inputs가 context에 임베드한다. generation은 카탈로그에 bounded 유지, 제안은 비파괴 아티팩트, 비평은 독립 리포트. 결정론(`--tools ""`) 유지.

**Tech Stack:** TypeScript 모노레포, vitest, biome, Claude Agent SDK(local-first), node fs adapter.

**설계 문서:** `docs/superpowers/specs/2026-05-29-design-context-injection-design.md`

**테스트 실행:** `bun run test -- <패턴>` (vitest). 린트: `bun run lint`. 타입: `bun run typecheck`(있으면) 또는 `bunx tsc -p tsconfig.json --noEmit`.

---

## 진행 단계 개요

- [x] Phase 0 — 공통 토대: 번들 본문 주입(누수 1·2 해결) — Task 1~5 ✅ (전체 test 144 green, lint green, smoke 주입 실측)
- [ ] Phase 1 — 세퍼레이터·스페이싱·시각 위계 강화 — Task 6
- [ ] Phase 2 — 컴포넌트 제안 레이어 — Task 7~11
- [ ] Phase 3 — 디자인 품질 자기비평 루프 — Task 12~14
- [ ] Phase 4 — 문서·거버넌스 정합 — Task 15

각 Task 완료 시 커밋한다. Phase 경계에서 `bun run test`·`bun run lint` 전체 green을 확인한다.

---

## Phase 0 — 공통 토대: 번들 본문 주입

### Task 1: schema에 `DesignContextBundleContent` 타입 추가 ✅ 완료

**Files:**
- Modify: `packages/schema/src/design-context.ts`
- Modify: `packages/schema/src/index.ts:17-21`
- Test: `packages/schema/src/__tests__/public-api.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `packages/schema/src/__tests__/public-api.test.ts`에 추가

```ts
import type { DesignContextBundleContent } from "..";

it("exposes DesignContextBundleContent with ref provenance and body", () => {
	const content: DesignContextBundleContent = {
		id: "visual-foundation",
		version: "2026-05-29",
		reason: "test",
		sourceDocs: ["docs/design/VISUAL_FOUNDATION_OBSERVATIONS.md"],
		body: "rule lines",
	};
	expect(content.id).toBe("visual-foundation");
	expect(content.body.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: 실패 확인** — Run: `bun run test -- packages/schema`. Expected: FAIL (`DesignContextBundleContent` 타입 없음, 컴파일/테스트 에러).

- [ ] **Step 3: 타입 추가** — `packages/schema/src/design-context.ts`의 `DesignContextBundleRef` 아래에 추가

```ts
export type DesignContextBundleContent = DesignContextBundleRef & {
	/** 선택된 번들 문서를 결합한 에이전트용 규칙 본문. */
	body: string;
};
```

- [ ] **Step 4: export 추가** — `packages/schema/src/index.ts`의 design-context export 블록(현재 17-21줄)에 `DesignContextBundleContent` 추가

```ts
export type {
	DesignContextBundleContent,
	DesignContextBundleId,
	DesignContextBundleRef,
	StateCoverageHint,
} from "./design-context";
```

- [ ] **Step 5: 통과 확인** — Run: `bun run test -- packages/schema`. Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add packages/schema/src/design-context.ts packages/schema/src/index.ts packages/schema/src/__tests__/public-api.test.ts
git commit -m "schema: add DesignContextBundleContent type"
```

---

### Task 2: 4개 design-context 번들 .md 실체화 ✅ 완료

> 이 Task는 코드가 아니라 디자인 규칙 저작이다. 효과의 절반이 여기서 나온다. `docs/design/`의 해당 source docs를 읽고, 에이전트가 바로 적용 가능한 **압축된 bounded 규칙**으로 린트한다. prose 복붙 금지.

**Files (모두 Modify — 현재 경로만 가리키는 빈 껍데기):**
- `packages/agent/docs/design-context/visual-foundation.md`
- `packages/agent/docs/design-context/layout-composition.md`
- `packages/agent/docs/design-context/interaction-state.md`
- `packages/agent/docs/design-context/quality-review.md`

각 번들의 source docs는 `packages/orchestration/src/public/design-context.ts`의 `DESIGN_CONTEXT_BUNDLE_SOURCE_DOCS` 매핑을 기준으로 한다.

- [ ] **Step 1: source docs 읽기** — 각 번들의 source docs(`docs/design/*.md`, `packages/agent/docs/*/checklist.md`)를 읽는다.

- [ ] **Step 2: visual-foundation.md 작성** — 다음 골격으로, `docs/design/LAYOUT_SPACING_CONTRACT.md`·`VISUAL_FOUNDATION_OBSERVATIONS.md`·`COMPONENT_INVENTORY.md`의 구체 수치를 규칙으로 변환

```markdown
# Visual Foundation Bundle

Bundle id: `visual-foundation`

## Divider rules (when to separate)
- 리스트 행(ListText 등) 사이: 1px Divider.
- 섹션(TitleSection 단위) 사이: 4px Divider.
- 카드/그룹 컨테이너(Card, Local_CardSection)가 이미 시각적 분리를 제공하면 Divider 생략.
- bottom-action 영역 위에는 콘텐츠와 분리하는 Divider 또는 spacing을 둔다.
- Divider는 component node로만 표현한다. raw border 금지.

## Spacing & rail
- (docs/design/LAYOUT_SPACING_CONTRACT.md의 width rail / spacing 관찰을 규칙으로)

## Hierarchy & emphasis
- 섹션 제목은 TitleSection, 행 레이블/값은 ListText로 위계를 만든다.
- 강조는 component props(예: emphasis/variant)로만. 임의 색/그라디언트/이모지 금지.

## Boundaries
- 우선순위: source evidence ≥ schema/catalog > 이 번들 규칙.
- 카탈로그에 없는 component/prop/layout id를 발명하지 않는다.
```

> 실제 수치(1px/4px는 COMPONENT_INVENTORY.md 근거 확인됨)는 읽은 내용으로 정확히 채운다.

- [ ] **Step 3: layout-composition.md 작성** — `COMPOSITION_LAYERS.md`·`SECTION_PATTERNS.md`·`SCREEN_PATTERN_SUMMARY.md`·`LAYOUT_SPACING_CONTRACT.md` 기반. Screen>Region>Area>(PageStack/layout wrapper)>components 골격, 섹션 그룹핑·list rail·divider-separated section 규칙.

- [ ] **Step 4: interaction-state.md 작성** — `INTERACTION_PATTERNS.md`·`SECTION_PATTERNS.md` 기반. form/list/search/detail/async surface별 state coverage(empty/loading/error/validation/disabled) 규칙.

- [ ] **Step 5: quality-review.md 작성** — `packages/agent/docs/quality-review/checklist.md`·`screen-generation/checklist.md` 기반. source fidelity, composition alignment, visual hierarchy, action clarity, accessibility의 통과/실패 게이트.

- [ ] **Step 6: 길이 점검** — 각 파일이 prose가 아닌 규칙 목록인지, 과도하게 길지 않은지(목표 번들당 ≤ 120줄) 확인.

- [ ] **Step 7: 커밋**

```bash
git add packages/agent/docs/design-context/
git commit -m "agent-docs: materialize design-context bundles with bounded rules"
```

---

### Task 3: pipeline 번들 본문 로더 `design-context-catalog.ts` ✅ 완료

> `skill-catalog.ts`(이미 에이전트 docs를 읽어 주입하는 패턴) 미러. 번들 id→파일 매핑은 contract 테이블로 구동(switch 금지).

**Files:**
- Create: `packages/pipeline/src/pipelines/screen-generation/design-context-catalog.ts`
- Test: `packages/pipeline/src/pipelines/screen-generation/__tests__/design-context-catalog.test.ts` (없으면 생성; 기존 테스트 위치 관례 따름 — 먼저 `find packages/pipeline -name "*.test.ts"`로 확인)

- [ ] **Step 1: 기존 패턴 확인** — Read `packages/pipeline/src/pipelines/screen-generation/skill-catalog.ts` 전체와 기존 pipeline 테스트 1개로 테스트 관례 파악.

- [ ] **Step 2: 실패 테스트 작성** — 선택된 bundleRefs를 주면 각 id에 대해 body가 채워진 `DesignContextBundleContent[]`를 반환하고, 파일이 없으면 그 번들은 생략하는지 검증

```ts
import { describe, expect, it } from "vitest";
import { loadDesignContextBundleContents } from "../design-context-catalog";

describe("loadDesignContextBundleContents", () => {
	it("loads body for selected bundle refs from agent docs", async () => {
		const contents = await loadDesignContextBundleContents([
			{
				id: "visual-foundation",
				reason: "r",
				sourceDocs: [],
				version: "2026-05-29",
			},
		]);
		expect(contents).toHaveLength(1);
		expect(contents[0].id).toBe("visual-foundation");
		expect(contents[0].body.length).toBeGreaterThan(0);
	});

	it("skips bundles whose file is missing", async () => {
		const contents = await loadDesignContextBundleContents(
			[{ id: "visual-foundation", reason: "r", sourceDocs: [], version: "v" }],
			"packages/agent/docs/__nonexistent__",
		);
		expect(contents).toHaveLength(0);
	});
});
```

- [ ] **Step 3: 실패 확인** — Run: `bun run test -- design-context-catalog`. Expected: FAIL (모듈 없음).

- [ ] **Step 4: 구현** — `design-context-catalog.ts` 작성

```ts
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { DesignContextBundleContent, DesignContextBundleId, DesignContextBundleRef } from "@cx/schema";

const DEFAULT_DESIGN_CONTEXT_DIR = "packages/agent/docs/design-context";

/** 번들 id -> agent docs 파일명. switch 대신 테이블로 구동. */
const BUNDLE_FILE_BY_ID = {
	"interaction-state": "interaction-state.md",
	"layout-composition": "layout-composition.md",
	"quality-review": "quality-review.md",
	"visual-foundation": "visual-foundation.md",
} as const satisfies Record<DesignContextBundleId, string>;

export async function loadDesignContextBundleContents(
	refs: DesignContextBundleRef[],
	rootDir = DEFAULT_DESIGN_CONTEXT_DIR,
): Promise<DesignContextBundleContent[]> {
	const contents: DesignContextBundleContent[] = [];
	for (const ref of refs) {
		const fileName = BUNDLE_FILE_BY_ID[ref.id];
		if (!fileName) continue;
		const fullPath = path.join(rootDir, fileName);
		if (!(await isFile(fullPath))) continue;
		contents.push({ ...ref, body: await readFile(fullPath, "utf8") });
	}
	return contents;
}

async function isFile(filePath: string): Promise<boolean> {
	try {
		return (await stat(filePath)).isFile();
	} catch {
		return false;
	}
}
```

- [ ] **Step 5: 통과 확인** — Run: `bun run test -- design-context-catalog`. Expected: PASS.

- [ ] **Step 6: pipeline export 정합** — 새 모듈이 외부 export가 필요하면 `packages/pipeline` 해당 entrypoint 확인. 내부 전용이면 export 불필요.

- [ ] **Step 7: 커밋**

```bash
git add packages/pipeline/src/pipelines/screen-generation/design-context-catalog.ts packages/pipeline/src/pipelines/screen-generation/__tests__/design-context-catalog.test.ts
git commit -m "pipeline: add design-context bundle content loader"
```

---

### Task 4: orchestration agent-inputs가 번들 본문을 context에 임베드 ✅ 완료

**Files:**
- Modify: `packages/orchestration/src/public/agent-inputs.ts` (generation/quality/revision)
- Modify: `packages/orchestration/src/public/types.ts` (context 타입에 `designContextBundles?` 추가)
- Test: `packages/orchestration/src/__tests__/public-api.test.ts`

- [ ] **Step 1: 타입 확인** — Read `packages/orchestration/src/public/types.ts`에서 `ScreenGenerationAgentInput`/`QualityReviewAgentInput`의 context 타입과 `designContextBundleRefs` 위치 파악.

- [ ] **Step 2: 실패 테스트 작성** — `buildScreenGenerationAgentInput`에 `designContextBundles`를 넘기면 context에 본문이 실리고, query에 본문 사용 지시가 포함되는지 검증

```ts
it("embeds design-context bundle bodies into generation context", () => {
	const input = buildScreenGenerationAgentInput(sampleSourceSpec, {
		designContextBundles: [
			{ id: "visual-foundation", reason: "r", sourceDocs: [], version: "v", body: "DIVIDER RULE LINE" },
		],
	});
	expect(JSON.stringify(input.context)).toContain("DIVIDER RULE LINE");
	expect(input.query).toContain("context.designContextBundles");
});
```

> `sampleSourceSpec`은 기존 테스트의 픽스처를 재사용한다(파일 상단에서 import/정의 확인).

- [ ] **Step 3: 실패 확인** — Run: `bun run test -- packages/orchestration`. Expected: FAIL.

- [ ] **Step 4: 타입 추가** — `types.ts`의 generation/quality/revision context 타입에 추가

```ts
designContextBundles?: DesignContextBundleContent[];
```
그리고 함수 옵션 타입(`buildScreenGenerationAgentInput`의 options, quality/revision input의 인자)에도 `designContextBundles?: DesignContextBundleContent[]` 추가. `DesignContextBundleContent`를 `@cx/schema`에서 import.

- [ ] **Step 5: 구현** — `agent-inputs.ts`:
  - `buildScreenGenerationAgentInput` options에 `designContextBundles` 받아 `context.designContextBundles = options.designContextBundles`로 실어준다.
  - query 배열에 한 줄 추가(기존 designContextBundleRefs 지시 근처):
    `"Use context.designContextBundles[].body as the actual design rules to apply (divider/spacing/hierarchy/state coverage). Keep priority: source evidence and schema/catalog over these rules."`
  - `buildQualityReviewAgentInput`·`buildScreenRevisionAgentInput`도 동일하게 `designContextBundles`를 받아 `context`에 실어준다(이들은 `generationInput.context`를 spread하므로 options를 generation 호출에 전달).

- [ ] **Step 6: 통과 확인** — Run: `bun run test -- packages/orchestration`. Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add packages/orchestration/src/public/agent-inputs.ts packages/orchestration/src/public/types.ts packages/orchestration/src/__tests__/public-api.test.ts
git commit -m "orchestration: embed design-context bundle bodies into agent inputs"
```

---

### Task 5: pipeline 배선 — 본문 로드 후 generation/quality/revision에 주입 ✅ 완료

**Files:**
- Modify: `packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts`
- Test: 기존 `packages/pipeline/src/__tests__/public-api.test.ts` 또는 pipeline 통합 테스트

- [ ] **Step 1: state 필드 추가** — `ScreenGenerationPipelineState`(97-131줄 부근)에 추가

```ts
designContextBundleContents?: DesignContextBundleContent[];
```
`DesignContextBundleContent`를 `@cx/schema`에서 import. import 블록에 `loadDesignContextBundleContents`를 `./design-context-catalog`에서 추가.

- [ ] **Step 2: 로드 헬퍼 호출 배선** — `runGenerateRenderTreeStage`(393줄~)에서 generation input 만들기 전에

```ts
state.designContextBundleContents = await loadDesignContextBundleContents(
	state.designContextBundleSelection?.bundleRefs ?? [],
);
```
그리고 `buildScreenGenerationAgentInput(sourceSpec, { ... })` 옵션에 `designContextBundles: state.designContextBundleContents` 추가.

- [ ] **Step 3: quality/revision 배선** — `runReviewQualityStage`(456줄~)의 `buildQualityReviewAgentInput`와 revision input(516줄~)의 `buildScreenRevisionAgentInput` 호출에 `designContextBundles: state.designContextBundleContents` 추가. (review 단계에서 validate가 번들 재선택을 하므로, review 진입 시 contents가 비어있으면 한 번 더 로드.)

- [ ] **Step 4: 실패→통과 테스트** — fake 에이전트 모드로 파이프라인을 돌렸을 때 generation runnerRequest의 context/metadata에 번들 body가 포함되는지 단언하는 테스트 추가. 기존 fake 모드 통합 테스트를 미러.

```ts
it("injects design-context bundle bodies into the generation runner request", async () => {
	const result = await runScreenGenerationPipeline(screenGenerationDefinition, fakeOptions);
	// runnerRequest 또는 산출된 agentInput.context에서 body 존재 확인
	expect(JSON.stringify(result /* 또는 캡처된 request */)).toContain("Divider");
});
```
> 실제 단언 지점은 Step 1 전 기존 테스트가 runnerRequest를 어떻게 노출하는지 확인 후 정한다.

- [ ] **Step 5: 전체 회귀** — Run: `bun run test -- packages/pipeline`. Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts packages/pipeline/src/__tests__/
git commit -m "pipeline: load and inject design-context bundle bodies into agent stages"
```

- [ ] **Phase 0 게이트:** `bun run test` 및 `bun run lint` 전체 green. smoke로 1개 화면 생성해 final-result.json에 변화(divider/spacing) 육안 확인.

---

## Phase 1 — 세퍼레이터·스페이싱·시각 위계 강화

### Task 6: generation/revision 프롬프트의 divider·spacing·hierarchy 지시 강화

**Files:**
- Modify: `packages/orchestration/src/public/agent-inputs.ts`
- Modify: `packages/agent/docs/screen-generation/prompt-contract.md`, `checklist.md` (지시 정합)
- Test: `packages/orchestration/src/__tests__/public-api.test.ts`

- [ ] **Step 1: 실패 테스트** — generation query에 divider 맥락 판단 지시가 포함되는지

```ts
it("instructs contextual divider and spacing decisions", () => {
	const input = buildScreenGenerationAgentInput(sampleSourceSpec, {});
	expect(input.query).toContain("design-context bundle");
	expect(input.query.toLowerCase()).toContain("divider");
	expect(input.query.toLowerCase()).toContain("spacing");
});
```

- [ ] **Step 2: 실패 확인** — Run: `bun run test -- packages/orchestration`.

- [ ] **Step 3: 구현** — `buildScreenGenerationAgentInput` query에 기존 Divider 라인을 보강

```text
"Decide Divider and spacing from context.designContextBundles rules and screen context: add 1px between list rows, 4px between sections, and omit dividers when card/group containers already separate content."
"Apply visual hierarchy via component choice and props (titles vs rows, emphasis) within the catalog. Do not invent colors, gradients, or icons."
```

- [ ] **Step 4: 통과 확인** — Run: `bun run test -- packages/orchestration`. Expected: PASS.

- [ ] **Step 5: 참조 문서 정합** — prompt-contract.md/checklist.md에 동일 규칙 한 줄씩 반영.

- [ ] **Step 6: 커밋**

```bash
git add packages/orchestration/src/public/agent-inputs.ts packages/agent/docs/screen-generation/
git commit -m "orchestration: strengthen contextual divider/spacing/hierarchy guidance"
```

---

## Phase 2 — 컴포넌트 제안 레이어

### Task 7: schema `ComponentProposalContract`

**Files:**
- Create: `packages/schema/src/component-proposal.ts`
- Modify: `packages/schema/src/versions.ts`, `artifact-kind.ts`, `json-schema-registry.ts`, `index.ts`
- Test: `packages/schema/src/__tests__/public-api.test.ts`

- [ ] **Step 1: 실패 테스트** — 타입·schemaVersion·getJsonSchema 존재 확인

```ts
it("exposes component-proposal schema and version", () => {
	const proposal: ComponentProposalContract = {
		schemaVersion: SCHEMA_VERSION.componentProposal,
		proposals: [
			{
				id: "proposal-1",
				title: "Highlighted price callout",
				rationale: "Source emphasizes total price",
				sourceEvidence: ["area.price"],
				nearestCatalogMatch: "Callout",
				suggestedProps: { emphasis: "strong" },
			},
		],
	};
	expect(proposal.proposals[0].nearestCatalogMatch).toBe("Callout");
	expect(getJsonSchema("component-proposal").$id).toBe(SCHEMA_VERSION.componentProposal);
});
```

- [ ] **Step 2: 실패 확인** — Run: `bun run test -- packages/schema`.

- [ ] **Step 3: 타입 파일 작성** — `component-proposal.ts`

```ts
import type { SCHEMA_VERSION } from "./versions";

export type ComponentProposal = {
	id: string;
	title: string;
	rationale: string;
	sourceEvidence: string[];
	nearestCatalogMatch: string;
	suggestedProps?: Record<string, unknown>;
};

export type ComponentProposalContract = {
	proposals: ComponentProposal[];
	schemaVersion: typeof SCHEMA_VERSION.componentProposal;
};
```

- [ ] **Step 4: versions.ts** — `componentProposal: "component-proposal.v0.1",` 추가.

- [ ] **Step 5: artifact-kind.ts** — `GenerationArtifactKind` 유니온에 `"component-proposal"`, `SCHEMA_VERSION_BY_ARTIFACT_KIND`에 `"component-proposal": SCHEMA_VERSION.componentProposal,` 추가.

- [ ] **Step 6: json-schema-registry.ts** — `createComponentProposalJsonSchema()` 추가하고 `JSON_SCHEMA_BY_ARTIFACT_KIND`에 `"component-proposal": createComponentProposalJsonSchema(),` 등록. 스키마 골격은 quality-inspection 스키마를 미러:

```ts
function createComponentProposalJsonSchema(): JsonSchemaDocument {
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: SCHEMA_VERSION.componentProposal,
		additionalProperties: false,
		required: ["schemaVersion", "proposals"],
		title: "component-proposal",
		type: "object",
		properties: {
			schemaVersion: { const: SCHEMA_VERSION.componentProposal },
			proposals: { type: "array", items: { $ref: "#/$defs/proposal" } },
		},
		$defs: {
			proposal: {
				type: "object",
				additionalProperties: false,
				required: ["id", "title", "rationale", "sourceEvidence", "nearestCatalogMatch"],
				properties: {
					id: { type: "string", minLength: 1 },
					title: { type: "string", minLength: 1 },
					rationale: { type: "string", minLength: 1 },
					sourceEvidence: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
					nearestCatalogMatch: { type: "string", minLength: 1 },
					suggestedProps: { type: "object", additionalProperties: true },
				},
			},
		},
	};
}
```

- [ ] **Step 7: index.ts** — `export type { ComponentProposal, ComponentProposalContract } from "./component-proposal";` 추가.

- [ ] **Step 8: 통과 확인** — Run: `bun run test -- packages/schema`. Expected: PASS.

- [ ] **Step 9: 커밋**

```bash
git add packages/schema/src/
git commit -m "schema: add ComponentProposalContract"
```

---

### Task 8: orchestration `buildComponentProposalAgentInput`

**Files:**
- Modify: `packages/orchestration/src/public/agent-inputs.ts`, `types.ts`
- Test: `packages/orchestration/src/__tests__/public-api.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
it("builds bounded component-proposal input", () => {
	const input = buildComponentProposalAgentInput({
		sourceSpec: sampleSourceSpec,
		candidate: { foo: "bar" },
	});
	expect(input.query).toContain("propose");
	expect(input.query).toContain("nearestCatalogMatch");
	expect(input.context.sourceSpec).toBeDefined();
});
```

- [ ] **Step 2: 실패 확인** — Run: `bun run test -- packages/orchestration`.

- [ ] **Step 3: 구현** — `agent-inputs.ts`에 추가(quality-review input을 미러; `componentContractCatalog`·`designContextBundles`·`candidate` 받음). query 핵심:

```text
"Propose components or variants that are NOT in the catalog but would improve this screen."
"Each proposal must include sourceEvidence (refs from context.sourceReferenceCatalog.allowedRefs), a nearestCatalogMatch from context.componentContractCatalog, rationale, and optional suggestedProps."
"Return at most 5 proposals. Do not confirm or apply anything; this is a non-binding proposal artifact."
"Return one JSON object only using schemaVersion: component-proposal.v0.1."
```
`types.ts`에 `ComponentProposalAgentInput` 타입 추가(query+context).

- [ ] **Step 4: 통과 확인** — Run: `bun run test -- packages/orchestration`. Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add packages/orchestration/src/public/agent-inputs.ts packages/orchestration/src/public/types.ts packages/orchestration/src/__tests__/public-api.test.ts
git commit -m "orchestration: add buildComponentProposalAgentInput"
```

---

### Task 9: agent `component-proposal` 태스크 + 참조 자산

**Files:**
- Create: `packages/agent/src/tasks/component-proposal/{prompt.ts,runner.ts,index.ts}`
- Create: `packages/agent/docs/component-proposal/{prompt-contract.md,output-contract.md,checklist.md}`
- Modify: agent task-catalog/등록 지점(`packages/agent/src/contract/task-catalog.ts`, `packages/agent/src/tasks/index.ts`)
- Test: `packages/agent/src/__tests__/agent-runtime.test.ts`

- [ ] **Step 1: 기존 태스크 미러 확인** — Read `packages/agent/src/tasks/quality-review/{prompt.ts,runner.ts,index.ts}`와 `contract/task-catalog.ts`로 등록 방식 파악.

- [ ] **Step 2: 실패 테스트** — task-catalog에 `component-proposal` taskKind가 존재하고 prompt가 생성되는지

```ts
it("registers component-proposal task", () => {
	const prompt = createComponentProposalPrompt({ query: "q", context: {} });
	expect(prompt.metadata?.taskKind).toBe("component-proposal");
});
```

- [ ] **Step 3: 실패 확인** — Run: `bun run test -- packages/agent`.

- [ ] **Step 4: 구현** — `prompt.ts`는 `quality-review/prompt.ts`를 미러(system 문구 + taskKind `"component-proposal"`). `runner.ts`·`index.ts` 동일 미러. task-catalog와 `tasks/index.ts`에 등록.

- [ ] **Step 5: docs 작성** — `prompt-contract.md`(입력 계약), `output-contract.md`(JSON only, schemaVersion component-proposal.v0.1, 필드), `checklist.md`(근거·최근접 매치·개수 상한 확인).

- [ ] **Step 6: 통과 확인** — Run: `bun run test -- packages/agent`. Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add packages/agent/src/tasks/component-proposal/ packages/agent/docs/component-proposal/ packages/agent/src/contract/task-catalog.ts packages/agent/src/tasks/index.ts packages/agent/src/__tests__/
git commit -m "agent: add component-proposal task and reference assets"
```

---

### Task 10: validation `validateComponentProposal`

**Files:**
- Create: `packages/validation/src/<contract>/component-proposal.ts` (기존 contract 디렉토리 관례 따름)
- Modify: validation index/contract export
- Test: validation 테스트 디렉토리

- [ ] **Step 1: 기존 패턴 확인** — Read `packages/validation/src/index.ts`와 기존 contract 1개(예: render-tree 검증)로 결과 모양 파악. 결과는 [[validation-result-shape]] `{ok, issues, data?}` + ValidationIssue 메타를 따른다.

- [ ] **Step 2: 실패 테스트** — 근거 없는 제안/카탈로그 외 nearestMatch/개수 초과를 issue로 반환

```ts
it("flags proposal without source evidence", () => {
	const result = validateComponentProposal(
		{ schemaVersion: "component-proposal.v0.1", proposals: [{ id: "p", title: "t", rationale: "r", sourceEvidence: [], nearestCatalogMatch: "Callout" }] },
		{ allowedRefs: ["area.x"], catalogComponentTypes: ["Callout"] },
	);
	expect(result.ok).toBe(false);
});
```

- [ ] **Step 3: 실패 확인** — Run: `bun run test -- packages/validation`.

- [ ] **Step 4: 구현** — `validateComponentProposal(contract, { allowedRefs, catalogComponentTypes, maxProposals=5 })`:
  - 각 proposal: sourceEvidence ⊆ allowedRefs(비어있으면 error), nearestCatalogMatch ∈ catalogComponentTypes(아니면 warning/error), proposals.length ≤ maxProposals.
  - 결과는 기존 validation 결과 모양으로 반환. errorsOf/warningsOf 헬퍼 재사용.

- [ ] **Step 5: 통과 확인** — Run: `bun run test -- packages/validation`. Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add packages/validation/src/
git commit -m "validation: add validateComponentProposal bounded checks"
```

---

### Task 11: pipeline `propose-components` 스테이지 + 아티팩트 write

**Files:**
- Modify: `packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts` (스테이지 등록·executor·state)
- Modify: `packages/pipeline/src/pipelines/screen-generation/artifact-commands.ts` (component-proposal.json write)
- Test: pipeline 테스트

- [ ] **Step 1: 스테이지 추가** — `stages` 배열(81-94줄)에서 `validate-render-tree` 뒤(또는 review-quality 뒤)에 `"propose-components"` 삽입. `screenGenerationStageExecutors`에 `"propose-components": runProposeComponentsStage` 등록.

- [ ] **Step 2: executor 구현** — `runGenerateRenderTreeStage` 미러. `buildComponentProposalAgentInput`로 입력 만들고 fake/real runner로 실행, 결과를 `state.componentProposalResult`에 저장. fake 모드는 빈 proposals 반환.

- [ ] **Step 3: validation 연결** — propose 후 `validateComponentProposal` 호출, issue를 state에 기록(파이프라인 실패시키지 않음; 비파괴).

- [ ] **Step 4: write 추가** — `artifact-commands.ts`에 `createWriteCommand("write-component-proposal", input.outDir, "component-proposal.json", input.componentProposal)` 추가. write-artifacts 스테이지 입력에 componentProposal 전달.

- [ ] **Step 5: 실패→통과 테스트** — fake 모드 파이프라인 산출물에 `component-proposal.json` write 커맨드가 존재하는지(기존 write 커맨드 테스트 184줄 부근 미러).

- [ ] **Step 6: 회귀** — Run: `bun run test -- packages/pipeline`. Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add packages/pipeline/src/pipelines/screen-generation/
git commit -m "pipeline: add propose-components stage and artifact write"
```

- [ ] **Phase 2 게이트:** `bun run test`·`bun run lint` green. smoke 실행 시 component-proposal.json 생성 확인.

---

## Phase 3 — 디자인 품질 자기비평 루프

### Task 12: schema `QualityInspection`에 디자인 차원 점수 확장

**Files:**
- Modify: `packages/schema/src/quality-inspection.ts`, `json-schema-registry.ts`
- Test: `packages/schema/src/__tests__/public-api.test.ts`

- [ ] **Step 1: 실패 테스트** — `inspection`에 점수 필드 추가 확인

```ts
it("includes design dimension scores in quality inspection", () => {
	const q: QualityInspectionContract = {
		schemaVersion: SCHEMA_VERSION.qualityInspection,
		inspection: { compositionAligned: true, sourceFaithful: true, visualHierarchyClear: true },
		scores: { hierarchy: 4, separation: 3, fidelity: 5 },
		findings: [],
		summary: { errorCount: 0, warningCount: 0 },
	};
	expect(q.scores.hierarchy).toBe(4);
});
```

- [ ] **Step 2: 실패 확인** — Run: `bun run test -- packages/schema`.

- [ ] **Step 3: 타입 확장** — `QualityInspectionContract`에 추가(하위호환 위해 optional)

```ts
scores?: {
	hierarchy: number;
	separation: number;
	fidelity: number;
};
```

- [ ] **Step 4: json-schema 확장** — `createQualityInspectionJsonSchema`의 properties에 `scores` 추가(0~5 integer 3필드, additionalProperties:false). `additionalProperties:false`이므로 반드시 추가해야 통과.

- [ ] **Step 5: 통과 확인** — Run: `bun run test -- packages/schema`. Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add packages/schema/src/quality-inspection.ts packages/schema/src/json-schema-registry.ts packages/schema/src/__tests__/
git commit -m "schema: add design dimension scores to quality inspection"
```

---

### Task 13: agent quality-review 프롬프트에 디자인 비평 + 점수 지시

**Files:**
- Modify: `packages/orchestration/src/public/agent-inputs.ts` (`buildQualityReviewAgentInput` query)
- Modify: `packages/agent/docs/quality-review/{prompt-contract.md,output-contract.md,checklist.md}`
- Test: `packages/orchestration/src/__tests__/public-api.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
it("instructs design scoring using injected bundles", () => {
	const input = buildQualityReviewAgentInput({ candidate: {}, sourceSpec: sampleSourceSpec, designContextBundles: [{ id: "quality-review", reason: "r", sourceDocs: [], version: "v", body: "GATE" }] });
	expect(input.query).toContain("scores");
	expect(JSON.stringify(input.context)).toContain("GATE");
});
```

- [ ] **Step 2: 실패 확인** — Run: `bun run test -- packages/orchestration`.

- [ ] **Step 3: 구현** — query에 추가

```text
"Score hierarchy, separation, and fidelity from 0-5 using context.designContextBundles rules."
"Emit findings with severity for any rule the candidate violates (e.g., missing dividers between sections, overused dividers inside cards)."
```

- [ ] **Step 4: docs 정합** — quality-review docs에 점수 차원·게이트 반영.

- [ ] **Step 5: 통과 확인** — Run: `bun run test -- packages/orchestration`. Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add packages/orchestration/src/public/agent-inputs.ts packages/agent/docs/quality-review/
git commit -m "orchestration: add design scoring to quality-review prompt"
```

---

### Task 14: pipeline design-critique write + revision 환류(P0/P1)

**Files:**
- Modify: `packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts`
- Modify: `packages/pipeline/src/pipelines/screen-generation/artifact-commands.ts`
- Test: pipeline 테스트

- [ ] **Step 1: critique write** — quality 결과(QualityInspection)를 `design-critique.json`으로 write 추가(artifact-commands에 `createWriteCommand("write-design-critique", outDir, "design-critique.json", input.qualityInspection)`).

- [ ] **Step 2: revision 트리거 보강** — `runReviseRenderTreeIfInvalidStage`에서 validation 에러뿐 아니라 quality findings 중 severity `error`(P0)가 있으면 revision을 돌리도록 조건 확장. revision input에 `qualityInspection` 전달(이미 인자 존재).

- [ ] **Step 3: 실패→통과 테스트** — quality findings에 error가 있을 때 revision 스테이지가 실행되는지(fake 모드로 quality 결과 주입). design-critique.json write 커맨드 존재 확인.

- [ ] **Step 4: 회귀** — Run: `bun run test -- packages/pipeline`. Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add packages/pipeline/src/pipelines/screen-generation/
git commit -m "pipeline: write design-critique and feed P0 findings into revision"
```

- [ ] **Phase 3 게이트:** `bun run test`·`bun run lint` green. smoke로 design-critique.json·점수·revision 동작 확인.

---

## Phase 4 — 문서·거버넌스 정합

### Task 15: 문서 업데이트

**Files:**
- Modify: `MASTER_PLAN.md` (§6 비목표 정정), `PACKAGE_MAP.md` (제안 레이어/비평/디자인 컨텍스트 로더 반영), `AGENTS_HISTORY.md` (이력)
- Modify: `docs/design/` 에 README 추가(사람용 SSOT → agent/docs 린트 관계 명시)
- Modify: 관련 패키지 README(schema/pipeline/agent/validation/orchestration)에 신규 surface 반영

- [ ] **Step 1: MASTER_PLAN 비목표 정정** — "AI가 ... 임의 값을 확정하지 않는다"에 "단, 비파괴 제안 아티팩트로 후보 제시 가능, 확정은 사람의 카탈로그 mutation으로만" 추가.

- [ ] **Step 2: PACKAGE_MAP** — 생성 흐름 관계망에 design-context bundle content load, propose-components, design-critique 반영. 신규 public surface(`@cx/schema` component-proposal 타입 등) 반영.

- [ ] **Step 3: docs/design/README.md** — 이 폴더가 사람용 관찰 SSOT이며 `packages/agent/docs/design-context/`가 에이전트용 린트본임을 명시.

- [ ] **Step 4: 패키지 README** — 변경된 패키지의 README에 신규 함수/타입 한 줄씩.

- [ ] **Step 5: AGENTS_HISTORY** — 이번 작업 요약 1블록 추가.

- [ ] **Step 6: 커밋**

```bash
git add MASTER_PLAN.md PACKAGE_MAP.md AGENTS_HISTORY.md docs/design/README.md packages/*/README.md
git commit -m "docs: reflect design-context injection, proposal layer, and critique loop"
```

---

## 최종 검증

- [ ] `bun run test` 전체 green
- [ ] `bun run lint` 전체 green
- [ ] 타입 체크 green
- [ ] smoke로 대표 화면 1~2개 생성 → 번들 on/off diff, divider/spacing 개선, component-proposal.json, design-critique.json 점수 확인
- [ ] 성공 기준(spec §7) 5개 충족 확인
- [ ] PR 준비(/ship 또는 수동)
