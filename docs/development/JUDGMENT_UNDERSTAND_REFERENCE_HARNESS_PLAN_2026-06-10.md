# 판단-중심 understand 계약 + Figma SOT 정답지 하네스 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** understand 단계(screen-intent)를 판단-중심 6질문 골격(v0.2)으로 개선하고, category별 Figma SOT 정답지를 flat-kind + 단일 제네릭 리졸버로 파이프라인 단계에 주입하는 하네스를 추가한다.

**Architecture:** 스키마(`@cx/schema`) → 정답지 코퍼스(`@cx/agent` docs) → 제네릭 리졸버(`@cx/agent`) → knowledge 배관(`@cx/inference`) → 파이프라인 references → 프롬프트 순으로 쌓는다. 정답지는 마크다운 SSOT + category별 `catalog.generated.ts`(frontmatter+경로 인덱스), 리졸버는 `reference-{category}-{index|catalog}` 정규식 dispatch 하나로 모든 category를 처리한다.

**Tech Stack:** TypeScript(ESM), Vitest, JSON Schema(draft 2020-12), tsx 생성 스크립트, Biome(탭), pnpm workspace.

**설계 출처:** `docs/development/JUDGMENT_UNDERSTAND_REFERENCE_HARNESS_2026-06-10.md` (커밋됨).

---

## File Structure

**생성:**
- `packages/schema/src/reference-catalog.ts` — `ReferenceCatalogEntry`/`ReferenceCatalogDocument`/`ReferenceCatalogData`/`ReferenceCatalogObject` 타입 (※ 단순 타입이라 schema 패키지에 둠; SSOT union과 함께)
- `packages/agent/src/reference-catalog/categories.ts` — `REFERENCE_CATEGORIES`(category→docs 디렉토리) 단일 레지스트리
- `packages/agent/src/reference-catalog/catalog.ts` — `resolveReferenceForInference(category, mode)` 제네릭 리졸버 1개
- `packages/agent/src/reference-catalog/index.ts` — 재노출
- `packages/agent/docs/skills/references/screens/ref-*.md` — 정답지 시드(본문 SSOT)
- `packages/agent/docs/skills/references/screens/catalog.generated.ts` — 생성물(frontmatter+경로 인덱스)
- `scripts/sync-reference-catalog/index.ts` — 생성 스크립트
- 테스트: `packages/schema/src/__tests__/screen-intent-schema.test.ts`, `packages/agent/src/reference-catalog/__tests__/{resolver,catalog-generated}.test.ts`

**수정:**
- `packages/schema/src/versions.ts:14` — `screenIntent: "screen-intent.v0.2"`
- `packages/schema/src/screen-intent.ts` — 타입 필드 교체
- `packages/schema/src/json-schema-registry.ts:211-296,298-336` — screen-intent/composition-plan JSON Schema
- `packages/schema/src/composition-plan.ts` — 타입 필드 추가
- `packages/schema/src/inference-reference.ts:93-100` — `InferenceReference` union에 `ReferenceCatalogObject`
- `packages/schema/src/index.ts` — 신규 타입 재노출
- `packages/agent/src/index.ts:22-26` — `resolveReferenceForInference` 재노출
- `packages/inference/src/contracts/step.ts:7-17` — `KnowledgeRef.source` union
- `packages/inference/src/knowledge/knowledge-base.ts:44-50` — `reference-*` 분기
- `packages/inference/src/pipelines/screen-generation-v1.ts:33-37,49-54` — references 주입
- `packages/agent/docs/prompts/screen-intent.md`, `composition-planning.md` — 지시 갱신
- `package.json:12` — `sync:reference` 스크립트
- `packages/agent/tsconfig.json` — `docs/**/*.generated.ts` include 확인

---

## Task 1: screen-intent v0.2 스키마 (타입 + JSON Schema + 버전)

**Files:**
- Modify: `packages/schema/src/versions.ts:14`
- Modify: `packages/schema/src/screen-intent.ts`
- Modify: `packages/schema/src/json-schema-registry.ts:211-296`
- Create: `packages/validation/src/__tests__/screen-intent-v0_2.test.ts` (※ JSON Schema 검증은 ajv를 가진 `@cx/validation`에 둔다 — `@cx/schema`는 ajv 의존 없음)

- [ ] **Step 1: 실패 테스트 작성** — v0.2 스키마가 신규 필드를 강제하고 구필드를 거부하는지

```ts
// packages/validation/src/__tests__/screen-intent-v0_2.test.ts
import { getJsonSchema, SCHEMA_VERSION } from "@cx/schema";
import { validateSchemaArtifact } from "@cx/validation";
import { describe, expect, it } from "vitest";

const valid = {
	schemaVersion: SCHEMA_VERSION.screenIntent,
	coreJudgment: "사용자는 두 요금제 중 하나를 선택해야 한다",
	firstUnderstanding: "현재 요금제와 변경 후 요금제의 차액",
	ctaPromise: "선택한 요금제로 즉시 변경됨을 약속한다",
	contentPriority: ["area.summary", "area.options"],
	sourceInterpretation: { preserve: ["price"], summarize: [], defer: [] },
};

describe("screen-intent.v0.2 JSON Schema", () => {
	it("$id가 v0.2다", () => {
		expect(getJsonSchema("screen-intent").$id).toBe("screen-intent.v0.2");
	});

	it("신규 required 필드를 포함한 객체는 통과한다", () => {
		expect(validateSchemaArtifact("screen-intent", valid).ok).toBe(true);
	});

	it("coreJudgment 누락 시 거부한다", () => {
		const { coreJudgment, ...rest } = valid;
		expect(validateSchemaArtifact("screen-intent", rest).ok).toBe(false);
	});

	it("optional referenceMatch 형태를 허용한다", () => {
		expect(
			validateSchemaArtifact("screen-intent", {
				...valid,
				referenceMatch: { referenceIds: ["ref-x"], matchedPattern: "choice" },
			}).ok,
		).toBe(true);
	});

	it("제거된 screenPurpose는 additionalProperties:false로 거부한다", () => {
		expect(validateSchemaArtifact("screen-intent", { ...valid, screenPurpose: "x" }).ok).toBe(false);
	});
});
```

> `getJsonSchema`가 `@cx/schema`에서 export되는지 확인(`packages/schema/src/index.ts`). 안 되어 있으면 한 줄 추가: `export { getJsonSchema } from "./json-schema-registry";`

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `pnpm --filter @cx/validation test screen-intent-v0_2`
Expected: FAIL (`$id`가 아직 `screen-intent.v0.1`, 신규 필드 미정의)

- [ ] **Step 3: 버전 범프** — `packages/schema/src/versions.ts:14`

```ts
	screenIntent: "screen-intent.v0.2",
```

- [ ] **Step 4: 타입 교체** — `packages/schema/src/screen-intent.ts`의 `ScreenIntentContract`를 통째로 교체

```ts
export type ReferenceMatch = {
	referenceIds: string[];
	matchedPattern: string;
};

export type ScreenIntentContract = {
	audience?: string;
	contentPriority: string[];
	coreJudgment: string;
	ctaPromise: string;
	firstUnderstanding: string;
	missingDecisions?: string[];
	primaryTask?: string;
	rationale?: string;
	referenceMatch?: ReferenceMatch;
	schemaVersion: typeof SCHEMA_VERSION.screenIntent;
	sourceInterpretation: {
		defer: string[];
		preserve: string[];
		summarize: string[];
	};
	stateCoverageHints?: StateCoverageHint[];
	successMoment?: string;
	usedSkills?: UsedSkillRef[];
};
```

(`screenPurpose`, `primaryUserAction` 제거. `UsedSkillRef`는 그대로 둔다.)

- [ ] **Step 5: JSON Schema 교체** — `json-schema-registry.ts`의 `createScreenIntentJsonSchema` `properties`/`required`

`properties`에서 `screenPurpose`, `primaryUserAction` 라인(L226, L230)을 삭제하고 다음 3개를 추가:

```ts
				coreJudgment: { type: "string", minLength: 1 },
				ctaPromise: { type: "string", minLength: 1 },
				firstUnderstanding: { type: "string", minLength: 1 },
				referenceMatch: {
					type: "object",
					additionalProperties: false,
					required: ["referenceIds", "matchedPattern"],
					properties: {
						matchedPattern: { type: "string", minLength: 1 },
						referenceIds: { type: "array", items: { type: "string", minLength: 1 } },
					},
				},
```

`required`(L260)를 교체:

```ts
			required: [
				"schemaVersion",
				"coreJudgment",
				"firstUnderstanding",
				"ctaPromise",
				"contentPriority",
				"sourceInterpretation",
			],
```

- [ ] **Step 6: 테스트 실행 → 통과 확인**

Run: `pnpm --filter @cx/validation test screen-intent-v0_2`
Expected: PASS (5 tests)

- [ ] **Step 7: schema + validation 타입체크 + 전체 테스트** — 구필드 참조 회귀 탐지

Run: `pnpm --filter @cx/schema typecheck && pnpm --filter @cx/schema test && pnpm --filter @cx/validation typecheck`
Expected: PASS. (실패 시: `screenPurpose`/`primaryUserAction`을 참조하는 다른 테스트가 있다는 신호 → 그 테스트의 기대값을 신규 필드로 갱신)

- [ ] **Step 8: 커밋**

```bash
git add packages/schema/src/versions.ts packages/schema/src/screen-intent.ts packages/schema/src/json-schema-registry.ts packages/schema/src/index.ts packages/validation/src/__tests__/screen-intent-v0_2.test.ts
git commit -m "feat(schema): screen-intent v0.2 — coreJudgment/firstUnderstanding/ctaPromise/referenceMatch"
```

---

## Task 2: composition-plan에 currentFitAssessment / compositionProposal 추가

**Files:**
- Modify: `packages/schema/src/composition-plan.ts`
- Modify: `packages/schema/src/json-schema-registry.ts:298-336`
- Create: `packages/validation/src/__tests__/composition-plan-fit.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `packages/validation/src/__tests__/composition-plan-fit.test.ts`

```ts
import { SCHEMA_VERSION } from "@cx/schema";
import { validateSchemaArtifact } from "@cx/validation";
import { describe, expect, it } from "vitest";

const base = {
	schemaVersion: SCHEMA_VERSION.compositionPlan,
	screenLayout: "layout.screen.mobile",
	layoutStrategy: "s",
	sections: [{ priority: 1, role: "content", sourceRefs: ["a"], strategy: "s", targetRegion: "contents" }],
	visualHierarchy: "v",
	primaryUserAction: "p",
	sectionRhythm: "r",
	density: "medium",
	patternRationale: "pr",
	rejectedPatterns: [],
	currentFitAssessment: { supportsJudgment: false, problems: ["타이틀이 판단을 가린다"] },
	compositionProposal: { shouldChangeAreaComposite: true, recommendedAreas: ["summary", "options"] },
};

describe("composition-plan JSON Schema — currentFit/proposal", () => {
	it("신규 필드 포함 객체는 통과한다", () => {
		expect(validateSchemaArtifact("composition-plan", base).ok).toBe(true);
	});
	it("currentFitAssessment 누락 시 거부한다", () => {
		const { currentFitAssessment, ...rest } = base;
		expect(validateSchemaArtifact("composition-plan", rest).ok).toBe(false);
	});
	it("compositionProposal.recommendedAreas는 문자열 배열이어야 한다", () => {
		expect(
			validateSchemaArtifact("composition-plan", {
				...base,
				compositionProposal: { shouldChangeAreaComposite: true, recommendedAreas: [1] },
			}).ok,
		).toBe(false);
	});
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `pnpm --filter @cx/validation test composition-plan-fit`
Expected: FAIL (신규 필드 미정의 + required 아님)

- [ ] **Step 3: 타입 추가** — `composition-plan.ts`의 `CompositionPlanContract`에 필드 추가 + 보조 타입

```ts
export type CompositionCurrentFit = {
	problems: string[];
	supportsJudgment: boolean;
};

export type CompositionProposal = {
	recommendedAreas: string[];
	shouldChangeAreaComposite: boolean;
};
```

`CompositionPlanContract`에 두 필드 삽입(알파벳 순 위치):

```ts
	compositionProposal: CompositionProposal;
	currentFitAssessment: CompositionCurrentFit;
```

- [ ] **Step 4: JSON Schema 갱신** — `createCompositionPlanJsonSchema`의 `properties`에 추가

```ts
				compositionProposal: {
					type: "object",
					additionalProperties: false,
					required: ["shouldChangeAreaComposite", "recommendedAreas"],
					properties: {
						recommendedAreas: { type: "array", items: { type: "string", minLength: 1 } },
						shouldChangeAreaComposite: { type: "boolean" },
					},
				},
				currentFitAssessment: {
					type: "object",
					additionalProperties: false,
					required: ["supportsJudgment", "problems"],
					properties: {
						problems: { type: "array", items: { type: "string", minLength: 1 } },
						supportsJudgment: { type: "boolean" },
					},
				},
```

`required` 배열(L323-334)에 두 항목 추가:

```ts
				"currentFitAssessment",
				"compositionProposal",
```

- [ ] **Step 5: 테스트 실행 → 통과 확인**

Run: `pnpm --filter @cx/validation test composition-plan-fit && pnpm --filter @cx/schema typecheck`
Expected: PASS (3 tests)

- [ ] **Step 6: 커밋**

```bash
git add packages/schema/src/composition-plan.ts packages/schema/src/json-schema-registry.ts packages/validation/src/__tests__/composition-plan-fit.test.ts
git commit -m "feat(schema): composition-plan currentFitAssessment/compositionProposal"
```

---

## Task 3: 정답지 타입 + category 레지스트리 + 디렉토리 + 시드 1개

**Files:**
- Create: `packages/schema/src/reference-catalog.ts`
- Modify: `packages/schema/src/index.ts`
- Create: `packages/agent/src/reference-catalog/categories.ts`
- Create: `packages/agent/docs/skills/references/screens/ref-detail-confirmation.md`

- [ ] **Step 1: 정답지 entry/문서 타입 작성** — `packages/schema/src/reference-catalog.ts`

```ts
import type { SsotObject } from "./inference-reference";

export type ReferenceCatalogEntry = {
	id: string;
	situation: string;
	tags: string[];
	sotNodeRef?: string;
	sourceRef: string;
};

export type ReferenceCatalogDocument = ReferenceCatalogEntry & {
	body?: string;
};

export type ReferenceCatalogData = {
	category: string;
	mode: "catalog" | "index";
	documents: ReferenceCatalogDocument[];
};

export type ReferenceCatalogObject = SsotObject<"reference-catalog", ReferenceCatalogData>;
```

- [ ] **Step 2: schema 재노출** — `packages/schema/src/index.ts`에 추가

```ts
export type {
	ReferenceCatalogData,
	ReferenceCatalogDocument,
	ReferenceCatalogEntry,
	ReferenceCatalogObject,
} from "./reference-catalog";
```

- [ ] **Step 3: category 레지스트리 작성** — `packages/agent/src/reference-catalog/categories.ts`

```ts
// category → @cx/agent 패키지 기준 docs 디렉토리(상대). sync 스크립트와 런타임이 공유하는 단일 진실원.
// 새 category 추가 = 여기 한 줄 + 디렉토리 생성 + 정답지 작성.
export const REFERENCE_CATEGORIES = {
	screen: "docs/skills/references/screens",
} as const;

export type ReferenceCategory = keyof typeof REFERENCE_CATEGORIES;

export function isReferenceCategory(value: string): value is ReferenceCategory {
	return value in REFERENCE_CATEGORIES;
}
```

- [ ] **Step 4: 시드 정답지 1개 작성** — `figma-sot-observations.md`와 `figma-source.md`를 읽고 "상세 확인/선택" 상황 하나를 골라 아래 템플릿을 채운다. (sotNodeRef는 `docs/design/reference/figma-source.md`에 등록된 node id를 복사. 해당 화면 node가 없으면 frontmatter에서 줄을 생략 — optional이다.)

`packages/agent/docs/skills/references/screens/ref-detail-confirmation.md` (아래는 구조 모델; 본문 문장은 observations 근거로 교체):

```markdown
---
id: ref-detail-confirmation
situation: 사용자가 선택 결과를 최종 확인하고 비가역 액션을 실행하기 직전 상태
tags: [detail-confirmation, irreversible-action, summary-first]
sotNodeRef: <figma-source.md에 등록된 node id, 없으면 이 줄 삭제>
---

## 상황
무엇을 확정하는 화면인지, 사용자가 내려야 하는 판단과 비가역성의 무게를 1~2문단으로.

## 선택한 화면 구조 (areas / composites)
- contents: 요약 area(확정 대상 핵심 값) → 상세 area(부가 정보)
- bottom: 고정 CTA(약속이 분명한 단일 액션)
실제 SOT에서 쓰인 area/composite 조합을 근거로 기술.

## 그 구조를 쓴 이유 (판단)
요약을 먼저 보여 판단을 돕고, 비가역 액션을 bottom 고정으로 분리해 오조작을 줄인 이유.
```

- [ ] **Step 5: 시드 frontmatter 파싱 검증 테스트** — `packages/agent/src/reference-catalog/__tests__/seed.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { readAgentMarkdownDocument } from "../../docs/package-markdown";

describe("정답지 시드 frontmatter", () => {
	it("ref-detail-confirmation는 id/situation/tags를 가진다", () => {
		const doc = readAgentMarkdownDocument("../docs/skills/references/screens/ref-detail-confirmation.md");
		expect(doc.frontmatter.id).toBe("ref-detail-confirmation");
		expect(typeof doc.frontmatter.situation).toBe("string");
		expect(Array.isArray(doc.frontmatter.tags)).toBe(true);
		expect(doc.body.length).toBeGreaterThan(0);
	});
});
```

- [ ] **Step 6: 실행 → 통과 확인**

Run: `pnpm --filter @cx/schema typecheck && pnpm --filter @cx/agent test seed`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add packages/schema/src/reference-catalog.ts packages/schema/src/index.ts packages/agent/src/reference-catalog/categories.ts packages/agent/docs/skills/references/screens/ref-detail-confirmation.md packages/agent/src/reference-catalog/__tests__/seed.test.ts
git commit -m "feat(agent): 정답지 entry 타입 + category 레지스트리 + 시드 1개"
```

---

## Task 4: ReferenceCatalogObject를 InferenceReference union에 등록

**Files:**
- Modify: `packages/schema/src/inference-reference.ts:93-100`

- [ ] **Step 1: 실패 테스트 작성** — `packages/schema/src/__tests__/reference-catalog-union.test.ts`

```ts
import { describe, expect, it } from "vitest";
import type { InferenceReference, ReferenceCatalogObject } from "../index";
import { SSOT_OBJECT_SCHEMA_VERSION } from "../index";

describe("InferenceReference union", () => {
	it("ReferenceCatalogObject를 InferenceReference로 받는다", () => {
		const obj: ReferenceCatalogObject = {
			kind: "reference-catalog",
			id: "screen.index",
			owner: "@cx/agent",
			sourceRef: "docs/skills/references/screens",
			schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
			data: { category: "screen", mode: "index", documents: [] },
		};
		const asRef: InferenceReference = obj;
		expect(asRef.kind).toBe("reference-catalog");
	});
});
```

- [ ] **Step 2: 실행 → 실패 확인 (타입 에러)**

Run: `pnpm --filter @cx/schema typecheck`
Expected: FAIL (`ReferenceCatalogObject`가 `InferenceReference`에 할당 불가)

- [ ] **Step 3: union 확장** — `inference-reference.ts`에 import + union 추가

상단에 import 추가:

```ts
import type { ReferenceCatalogObject } from "./reference-catalog";
```

`InferenceReference` union(L93-100)에 한 줄 추가:

```ts
	| ReferenceCatalogObject
```

- [ ] **Step 4: 실행 → 통과 확인**

Run: `pnpm --filter @cx/schema typecheck && pnpm --filter @cx/schema test reference-catalog-union`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add packages/schema/src/inference-reference.ts packages/schema/src/__tests__/reference-catalog-union.test.ts
git commit -m "feat(schema): InferenceReference에 ReferenceCatalogObject 등록"
```

---

## Task 5: sync-reference-catalog 스크립트 + 생성 카탈로그 + diff guard

**Files:**
- Create: `scripts/sync-reference-catalog/index.ts`
- Modify: `package.json:12` (scripts)
- Create (생성물): `packages/agent/docs/skills/references/screens/catalog.generated.ts`
- Create: `packages/agent/src/reference-catalog/__tests__/catalog-generated.test.ts`
- Modify: `packages/agent/tsconfig.json` (필요 시 include)

- [ ] **Step 1: 생성 스크립트 작성** — `scripts/sync-reference-catalog/index.ts`

```ts
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { REFERENCE_CATEGORIES } from "../../packages/agent/src/reference-catalog/categories";
import type { ReferenceCatalogEntry } from "../../packages/schema/src/reference-catalog";

const ROOT = resolve(import.meta.dirname, "..", "..");
const AGENT = join(ROOT, "packages", "agent");

const GEN_HEADER =
	"// AUTO-GENERATED by scripts/sync-reference-catalog — DO NOT EDIT. Run `pnpm sync:reference`.";

// packages/agent/src 기준 상대경로 (readAgentMarkdownDocument 규약: "../docs/...")
function sourceRefOf(categoryDir: string, file: string): string {
	return `../${categoryDir}/${file}`;
}

function parseFrontmatter(body: string): Record<string, unknown> {
	if (!body.startsWith("---\n")) return {};
	const end = body.indexOf("\n---", 4);
	if (end < 0) return {};
	const fm: Record<string, unknown> = {};
	let listKey: string | undefined;
	for (const raw of body.slice(4, end).split("\n")) {
		const line = raw.trimEnd();
		if (!line.trim()) continue;
		if (line.trimStart().startsWith("- ") && listKey) {
			const items = Array.isArray(fm[listKey]) ? (fm[listKey] as string[]) : [];
			items.push(line.trimStart().slice(2).trim());
			fm[listKey] = items;
			continue;
		}
		listKey = undefined;
		const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
		if (!m) continue;
		const [, key, value] = m;
		if (value.length === 0) {
			fm[key] = [];
			listKey = key;
			continue;
		}
		// inline array: tags: [a, b]
		if (value.startsWith("[") && value.endsWith("]")) {
			fm[key] = value
				.slice(1, -1)
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			continue;
		}
		fm[key] = value.replace(/^["']|["']$/g, "");
	}
	return fm;
}

function collect(categoryDir: string): ReferenceCatalogEntry[] {
	const abs = join(AGENT, categoryDir);
	const files = readdirSync(abs)
		.filter((f) => f.endsWith(".md"))
		.sort();
	const seen = new Set<string>();
	return files.map((file) => {
		const fm = parseFrontmatter(readFileSync(join(abs, file), "utf8"));
		const id = fm.id;
		if (typeof id !== "string" || id.length === 0) {
			throw new Error(`${categoryDir}/${file}: missing frontmatter \`id\``);
		}
		if (seen.has(id)) throw new Error(`${categoryDir}/${file}: duplicate id '${id}'`);
		seen.add(id);
		return {
			id,
			situation: typeof fm.situation === "string" ? fm.situation : "",
			tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
			...(typeof fm.sotNodeRef === "string" ? { sotNodeRef: fm.sotNodeRef } : {}),
			sourceRef: sourceRefOf(categoryDir, file),
		};
	});
}

export function emitCatalog(category: string, entries: ReferenceCatalogEntry[]): string {
	const constName = `reference${category[0].toUpperCase()}${category.slice(1)}Catalog`;
	const body = entries
		.map((e) => {
			const parts = [
				`\t\tid: ${JSON.stringify(e.id)}`,
				`\t\tsituation: ${JSON.stringify(e.situation)}`,
				`\t\ttags: ${JSON.stringify(e.tags)}`,
				...(e.sotNodeRef ? [`\t\tsotNodeRef: ${JSON.stringify(e.sotNodeRef)}`] : []),
				`\t\tsourceRef: ${JSON.stringify(e.sourceRef)}`,
			];
			return `\t{\n${parts.join(",\n")},\n\t}`;
		})
		.join(",\n");
	return [
		GEN_HEADER,
		'import type { ReferenceCatalogEntry } from "../../../../src/reference-catalog/types";',
		"",
		`export const ${constName}: ReferenceCatalogEntry[] = [`,
		body,
		"];",
		"",
	].join("\n");
}

function main() {
	const generated: string[] = [];
	for (const [category, dir] of Object.entries(REFERENCE_CATEGORIES)) {
		const entries = collect(dir);
		const out = join(AGENT, dir, "catalog.generated.ts");
		writeFileSync(out, emitCatalog(category, entries), "utf8");
		generated.push(out);
	}
	execFileSync(join(ROOT, "node_modules", ".bin", "biome"), ["format", "--write", ...generated], {
		stdio: "ignore",
	});
	// eslint-disable-next-line no-console
	console.log(`sync-reference-catalog: ${generated.length} categories`);
}

// import-safe: 테스트가 collect를 import해도 main()이 돌지 않는다.
export { collect };

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
	main();
}
```

> 주의: 생성물 import 경로 `"../../../../src/reference-catalog/types"`는 `packages/agent/docs/skills/references/screens/`에서 `packages/agent/src/reference-catalog/types`로 가는 4단계 상위 경로다. Step 2에서 `types.ts`를 만들어 이 경로를 실재화한다. `collect`는 위에서 `export { collect }`로 노출돼 diff-guard 테스트가 import한다.

- [ ] **Step 2: 생성물이 import할 로컬 타입 alias 작성** — `packages/agent/src/reference-catalog/types.ts`

```ts
export type { ReferenceCatalogEntry } from "@cx/schema";
```

- [ ] **Step 3: package.json에 스크립트 등록** — `package.json` scripts(L12 `sync:layout` 아래)

```json
		"sync:reference": "tsx scripts/sync-reference-catalog/index.ts",
```

- [ ] **Step 4: 생성 실행 → 카탈로그 산출**

Run: `pnpm sync:reference`
Expected: `packages/agent/docs/skills/references/screens/catalog.generated.ts` 생성. 내용에 `ref-detail-confirmation` 엔트리 포함, `sourceRef: "../docs/skills/references/screens/ref-detail-confirmation.md"`.

- [ ] **Step 5: tsconfig include 확인** — `packages/agent/tsconfig.json`의 include가 `docs/**/*.generated.ts`를 포함하는지 확인. `src`만 포함하면 다음을 include 배열에 추가:

```json
		"docs/**/*.generated.ts"
```

Run: `pnpm --filter @cx/agent typecheck`
Expected: PASS (생성물이 타입체크 대상에 포함되고 에러 없음)

- [ ] **Step 6: 무결성 + diff-guard 테스트 작성** — `packages/agent/src/reference-catalog/__tests__/catalog-generated.test.ts` (스크립트는 Step 1에서 이미 import-safe + `collect`/`emitCatalog` export됨)

```ts
import { describe, expect, it } from "vitest";
import { REFERENCE_CATEGORIES } from "../categories";
import { collect } from "../../../../../scripts/sync-reference-catalog/index";
import { referenceScreenCatalog } from "../../../docs/skills/references/screens/catalog.generated";

describe("reference catalog.generated 무결성", () => {
	it("screens 카탈로그가 비어 있지 않고 id가 고유하다", () => {
		expect(referenceScreenCatalog.length).toBeGreaterThan(0);
		const ids = referenceScreenCatalog.map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("모든 엔트리가 sourceRef를 가진다", () => {
		expect(referenceScreenCatalog.every((e) => e.sourceRef.startsWith("../docs/"))).toBe(true);
	});

	it("커밋된 생성물이 소스 .md 재수집 결과와 일치한다 (drift 가드)", () => {
		// 텍스트가 아니라 파싱된 데이터를 비교 — biome 포맷(따옴표/트레일링 콤마) 차이에 영향받지 않는다.
		expect(referenceScreenCatalog).toEqual(collect(REFERENCE_CATEGORIES.screen));
	});
});
```

- [ ] **Step 7: 실행 → 통과 확인**

Run: `pnpm --filter @cx/agent test catalog-generated`
Expected: PASS (3 tests)

- [ ] **Step 8: 커밋**

```bash
git add scripts/sync-reference-catalog package.json packages/agent/src/reference-catalog/types.ts packages/agent/docs/skills/references/screens/catalog.generated.ts packages/agent/src/reference-catalog/__tests__/catalog-generated.test.ts packages/agent/tsconfig.json
git commit -m "feat(agent): sync-reference-catalog 생성 스크립트 + 카탈로그 + diff guard"
```

---

## Task 6: 제네릭 리졸버 resolveReferenceForInference

**Files:**
- Create: `packages/agent/src/reference-catalog/catalog.ts`
- Create: `packages/agent/src/reference-catalog/index.ts`
- Modify: `packages/agent/src/index.ts`
- Create: `packages/agent/src/reference-catalog/__tests__/resolver.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `packages/agent/src/reference-catalog/__tests__/resolver.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { resolveReferenceForInference } from "../catalog";

describe("resolveReferenceForInference", () => {
	it("index 모드는 frontmatter만 반환하고 body는 없다", () => {
		const obj = resolveReferenceForInference("screen", "index");
		expect(obj.kind).toBe("reference-catalog");
		expect(obj.data.category).toBe("screen");
		expect(obj.data.mode).toBe("index");
		expect(obj.data.documents.length).toBeGreaterThan(0);
		expect(obj.data.documents.every((d) => d.body === undefined)).toBe(true);
		expect(obj.data.documents[0].id).toBeTruthy();
	});

	it("catalog 모드는 body를 채운다", () => {
		const obj = resolveReferenceForInference("screen", "catalog");
		expect(obj.data.mode).toBe("catalog");
		expect(obj.data.documents.every((d) => typeof d.body === "string" && d.body.length > 0)).toBe(true);
	});

	it("미등록 category는 throw한다", () => {
		expect(() => resolveReferenceForInference("nope", "index")).toThrow(/Unknown reference category/);
	});
});
```

- [ ] **Step 2: 실행 → 실패 확인**

Run: `pnpm --filter @cx/agent test resolver`
Expected: FAIL (`../catalog` 미존재)

- [ ] **Step 3: 리졸버 작성** — `packages/agent/src/reference-catalog/catalog.ts`

```ts
import type { ReferenceCatalogEntry, ReferenceCatalogObject } from "@cx/schema";
import { SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";
import { readAgentMarkdownDocument } from "../docs/package-markdown";
import { referenceScreenCatalog } from "../../docs/skills/references/screens/catalog.generated";
import { isReferenceCategory, REFERENCE_CATEGORIES, type ReferenceCategory } from "./categories";

// satisfies가 category 누락을 컴파일 타임에 강제한다(새 category 추가 시 여기 한 줄 필수).
const ENTRIES_BY_CATEGORY = {
	screen: referenceScreenCatalog,
} satisfies Record<ReferenceCategory, ReferenceCatalogEntry[]>;

export function resolveReferenceForInference(
	category: string,
	mode: "catalog" | "index",
): ReferenceCatalogObject {
	if (!isReferenceCategory(category)) {
		throw new Error(`Unknown reference category: ${category}`);
	}
	const entries = ENTRIES_BY_CATEGORY[category];
	const documents = entries.map((entry) => ({
		...entry,
		body: mode === "catalog" ? readAgentMarkdownDocument(entry.sourceRef).body : undefined,
	}));
	return {
		kind: "reference-catalog",
		id: `${category}.${mode}`,
		owner: "@cx/agent",
		sourceRef: REFERENCE_CATEGORIES[category],
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: { category, mode, documents },
	};
}
```

- [ ] **Step 4: 재노출** — `packages/agent/src/reference-catalog/index.ts`

```ts
export { isReferenceCategory, REFERENCE_CATEGORIES, type ReferenceCategory } from "./categories";
export { resolveReferenceForInference } from "./catalog";
```

`packages/agent/src/index.ts` 하단에 추가:

```ts
export { resolveReferenceForInference } from "./reference-catalog";
```

- [ ] **Step 5: 실행 → 통과 확인**

Run: `pnpm --filter @cx/agent test resolver && pnpm --filter @cx/agent typecheck`
Expected: PASS (3 tests)

- [ ] **Step 6: 커밋**

```bash
git add packages/agent/src/reference-catalog/catalog.ts packages/agent/src/reference-catalog/index.ts packages/agent/src/index.ts packages/agent/src/reference-catalog/__tests__/resolver.test.ts
git commit -m "feat(agent): resolveReferenceForInference 제네릭 리졸버"
```

---

## Task 7: knowledge 배관 — KnowledgeRef union + reference-* 분기

**Files:**
- Modify: `packages/inference/src/contracts/step.ts:7-17`
- Modify: `packages/inference/src/knowledge/knowledge-base.ts`
- Create: `packages/inference/src/knowledge/__tests__/reference-resolve.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `packages/inference/src/knowledge/__tests__/reference-resolve.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { createInferenceKnowledgeBase } from "../knowledge-base";

describe("knowledge base — reference-* dispatch", () => {
	const kb = createInferenceKnowledgeBase();

	it("reference-screen-index를 reference-catalog object로 resolve한다", async () => {
		const ref = await kb.resolve({ source: "reference-screen-index" });
		expect(Array.isArray(ref) ? ref[0].kind : ref.kind).toBe("reference-catalog");
	});

	it("reference-screen-catalog는 body를 포함한다", async () => {
		const ref = await kb.resolve({ source: "reference-screen-catalog" });
		const obj = Array.isArray(ref) ? ref[0] : ref;
		expect(obj.kind).toBe("reference-catalog");
		if (obj.kind === "reference-catalog") {
			expect(obj.data.mode).toBe("catalog");
		}
	});
});
```

- [ ] **Step 2: 실행 → 실패 확인**

Run: `pnpm --filter @cx/inference test reference-resolve`
Expected: FAIL (`source: "reference-screen-index"` 타입 불가 + 분기 없음)

- [ ] **Step 3: KnowledgeRef union 확장** — `step.ts`의 `source` 유니온에 추가

```ts
	source:
		| "component-catalog"
		| "layout-catalog"
		| "prompt-catalog"
		| "skill"
		| "stage-skillset"
		| "token-catalog"
		| `reference-${string}`;
```

- [ ] **Step 4: knowledge-base 분기 추가** — `knowledge-base.ts`

상단 import에 추가:

```ts
import { resolveReferenceForInference } from "@cx/agent";
```

`createInferenceKnowledgeBase().resolve`를 교체:

```ts
		async resolve(ref) {
			const reference = parseReferenceSource(ref.source);
			if (reference) {
				return resolveReferenceForInference(reference.category, reference.mode);
			}
			const resolver =
				KNOWLEDGE_RESOLVERS[ref.source as keyof typeof KNOWLEDGE_RESOLVERS];
			if (!resolver) throw new Error(`Unknown knowledge source: ${ref.source}`);
			if (resolver.requiresId) readRequiredKnowledgeId(ref);
			return resolver.resolve(ref);
		},
```

파일 하단에 헬퍼 추가:

```ts
function parseReferenceSource(
	source: string,
): { category: string; mode: "catalog" | "index" } | undefined {
	const m = /^reference-(.+)-(index|catalog)$/.exec(source);
	if (!m) return undefined;
	return { category: m[1], mode: m[2] as "catalog" | "index" };
}
```

- [ ] **Step 5: 실행 → 통과 확인**

Run: `pnpm --filter @cx/inference test reference-resolve && pnpm --filter @cx/inference typecheck`
Expected: PASS (2 tests)

- [ ] **Step 6: 커밋**

```bash
git add packages/inference/src/contracts/step.ts packages/inference/src/knowledge/knowledge-base.ts packages/inference/src/knowledge/__tests__/reference-resolve.test.ts
git commit -m "feat(inference): reference-{category}-{index|catalog} knowledge dispatch"
```

---

## Task 8: 파이프라인 references 주입

**Files:**
- Modify: `packages/inference/src/pipelines/screen-generation-v1.ts:33-37,49-54`
- Modify: `packages/inference/src/__tests__/pipeline-authoring.test.ts` (또는 신규 파이프라인 테스트)

- [ ] **Step 1: 실패 테스트 작성** — `packages/inference/src/__tests__/screen-generation-references.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { screenGenerationPipelineV1 } from "../pipelines/screen-generation-v1";

function stepById(id: string) {
	const step = screenGenerationPipelineV1.steps.find((s) => s.id === id);
	if (!step) throw new Error(`step ${id} not found`);
	return step;
}

describe("screen-generation-v1 reference refs", () => {
	it("02-screen-intent가 reference-screen-index를 참조한다", () => {
		expect(stepById("02-screen-intent").references?.referenceIndex).toEqual({
			source: "reference-screen-index",
			id: undefined,
			version: undefined,
		});
	});

	it("03-composition이 reference-screen-catalog를 참조한다", () => {
		expect(stepById("03-composition").references?.referenceCatalog).toEqual({
			source: "reference-screen-catalog",
			id: undefined,
			version: undefined,
		});
	});
});
```

> export 이름은 `screenGenerationPipelineV1`(확인됨, `screen-generation-v1.ts:17`).

- [ ] **Step 2: 실행 → 실패 확인**

Run: `pnpm --filter @cx/inference test screen-generation-references`
Expected: FAIL (references에 해당 키 없음)

- [ ] **Step 3: references 주입** — `screen-generation-v1.ts`

`02-screen-intent`의 `references`(L34-37)에 추가:

```ts
			references: {
				skillset: knowledge("stage-skillset", "understand.screen-intent"),
				referenceIndex: knowledge("reference-screen-index"),
			},
```

`03-composition`의 `references`(L51-54)에 추가:

```ts
			references: {
				layoutCatalog: knowledge("layout-catalog"),
				skillset: knowledge("stage-skillset", "compose.composition-planning"),
				referenceCatalog: knowledge("reference-screen-catalog"),
			},
```

- [ ] **Step 4: 실행 → 통과 확인 + 기존 authoring 테스트 회귀 없음**

Run: `pnpm --filter @cx/inference test`
Expected: PASS (신규 2 + 기존 pipeline-authoring 포함 전부)

- [ ] **Step 5: 커밋**

```bash
git add packages/inference/src/pipelines/screen-generation-v1.ts packages/inference/src/__tests__/screen-generation-references.test.ts
git commit -m "feat(inference): screen-intent/composition에 reference 정답지 주입"
```

---

## Task 9: 프롬프트 갱신 (screen-intent.md / composition-planning.md)

**Files:**
- Modify: `packages/agent/docs/prompts/screen-intent.md`
- Modify: `packages/agent/docs/prompts/composition-planning.md`

- [ ] **Step 1: screen-intent.md 갱신** — frontmatter `tags`와 본문 L22, L29 교체

L22 `match \`screen-intent.v0.1\`` → `match \`screen-intent.v0.2\``

L29(`4. Capture ...`)를 교체하고 L29 뒤에 referenceMatch 지시 삽입:

```markdown
4. Capture `coreJudgment` (the single decision the user must make on this screen), `firstUnderstanding` (the information the user must grasp first), `ctaPromise` (what the primary CTA promises in this state), `contentPriority`, and `sourceInterpretation`.
5. When a reference index is provided, set `referenceMatch.referenceIds` to the ids whose `situation` matches this screen, and `referenceMatch.matchedPattern` to the shared pattern name. Leave `referenceMatch` absent when nothing matches — never invent ids.
```

(이후 기존 번호 5~8은 6~9로 밀린다. `screenPurpose`/`primaryUserAction` 언급 제거.)

- [ ] **Step 2: composition-planning.md 갱신** — L12 버전 참조 유지(`composition-plan.v0.1`), 본문에 currentFit/proposal + reference 사용 지시 추가

L13(`## Instructions` 위) 직전 "must include" 목록에 추가:

```markdown
- reference screen catalog (matched answer-key structures), when available
```

`## Instructions` 목록 끝(L28 `13.` 뒤)에 추가:

```markdown
14. Read the upstream `screenIntent.referenceMatch.referenceIds`; from the reference screen catalog, use only those matched entries' structures as precedent.
15. Set `currentFitAssessment.supportsJudgment` and `currentFitAssessment.problems` by judging whether the source's given area arrangement supports `screenIntent.coreJudgment`.
16. Set `compositionProposal.shouldChangeAreaComposite` and `compositionProposal.recommendedAreas` for a better Area/Composite arrangement, grounded in the matched references.
```

- [ ] **Step 2b: 프롬프트 정합 테스트(있으면) 갱신** — 프롬프트 본문을 단언하는 스냅샷/계약 테스트가 있는지 확인

Run: `pnpm --filter @cx/agent test`
Expected: PASS. (프롬프트 body 스냅샷 테스트가 깨지면 신규 본문으로 스냅샷 갱신: `pnpm --filter @cx/agent test -u`)

- [ ] **Step 3: 커밋**

```bash
git add packages/agent/docs/prompts/screen-intent.md packages/agent/docs/prompts/composition-planning.md
git commit -m "docs(agent): screen-intent v0.2 + composition reference 지시 프롬프트"
```

---

## Task 10: 전체 검증 + graphify + 마무리

**Files:** 없음(검증)

- [ ] **Step 1: 워크스페이스 전체 테스트**

Run: `pnpm test`
Expected: 신규 실패 0. (사전 알려진 실패 베이스라인 — App.test.tsx 5건 등 — 외 신규 실패 없을 것)

- [ ] **Step 2: 전체 타입체크 + 포맷 + hooks 정책**

Run: `pnpm -r typecheck && pnpm format && node scripts/check-react-hooks-policy.mjs`
Expected: PASS, 변경 파일 biome 클린.

- [ ] **Step 3: sync 재실행으로 drift 없음 확인**

Run: `pnpm sync:reference && git diff --stat`
Expected: 변경 없음(생성물이 이미 최신).

- [ ] **Step 4: graphify 갱신**

Run: `graphify update .`
Expected: 그래프 갱신 완료.

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "chore: graphify update + reference 하네스 검증"
```

---

## 후속 (이 계획 범위 밖, 명시적 분리)

- **정답지 시드 확장**: Task 3은 시드 1개만 만든다. 나머지 4~9개는 `figma-sot-observations.md`를 증류해 같은 디렉토리에 추가 후 `pnpm sync:reference` — 하네스를 안 건드리는 반복 작업.
- **두 번째 category(`areas` 등)**: `REFERENCE_CATEGORIES`에 한 줄 + 디렉토리 + 정답지 + `ENTRIES_BY_CATEGORY`에 한 줄(`satisfies`가 강제) + `catalog.ts` import 한 줄. `step.ts`/`knowledge-base.ts`/리졸버 로직은 안 건드림.
- **동적 id 해석**: compose가 매칭된 id 본문만 받도록 하려면 `KnowledgeRef`+worker resolution 확장 필요. 코퍼스가 커질 때.
