# Validation Rule Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@cx/validation`의 에러 코드 메타데이터(layer, severity, docRef, owner)를 단일 registry 테이블로 모으고, 품질 rule 5개를 rule당 1파일 구조로 분리해 확장 가능하게 만든다.

**Architecture:** ESLint 모델. (1) `registry.ts` — 모든 `ValidationIssueCode`의 메타데이터 테이블, 타입은 `keyof typeof`로 파생, `addIssue`가 severity를 여기서 조회. (2) `rules/` — render-tree 품질 rule(`single-section-divider`, `bottom-cta-state-ungated`, `source-prop-mismatch`, `source-ref-not-materialized`, `state-coverage-missing`)을 `{ meta, check }` 모듈로 분리, 엔진은 `runQualityRules`로 기계적 순회. 입력 가드·스키마·카탈로그 검증 엔진(A·B층)은 validators.ts에 그대로 둔다. (3) 드리프트 가드 테스트가 registry ⇔ rules ⇔ 테스트 파일의 1:1 대응을 강제.

**Tech Stack:** TypeScript (strict), vitest, pnpm workspace. 패키지: `packages/validation` (`@cx/validation`).

**중요 컨텍스트:**
- 공개 API(`validateRenderTree` 등 함수 시그니처, `ValidationReport` 모양)는 변경하지 않는다. 기존 테스트 455개(validation 55개)는 수정 없이 계속 통과해야 한다.
- 코드별 severity는 현재 호출부에 흩어져 있으나 코드당 단일 값으로 일관됨(검증 완료). warning 코드: `unknown-prop`, `uses-candidate-component`, `internal-visible-title`, `source-ref-not-materialized`, `unknown-source-ref`, `state-coverage-missing`, `layout-ref-outside-candidates`, `proposal-nearest-match-unknown`. 나머지는 전부 error.
- `source-ref-not-materialized`는 render-tree(rule)와 composition-plan(엔진) 양쪽에서 발생한다 → registry의 `owners`는 배열이다.
- 테스트 실행 명령: `pnpm vitest run packages/validation` (워크트리 루트에서).
- 커밋 메시지 스타일: `type(scope): 한국어 설명` (예: `refactor(validation): ...`).

---

## File Structure

```
packages/validation/src/
  index.ts                                  # 수정: registry export 추가
  public/
    registry.ts                             # 생성: 코드 메타데이터 테이블 (단일 진실원)
    types.ts                                # 수정: ValidationIssueCode/Severity를 registry에서 재수출
    validators.ts                           # 수정: addIssue severity 조회, 품질 rule 함수 제거, runQualityRules 추가
    contract.ts                             # 변경 없음
    report.ts                               # 변경 없음
  rules/
    define-rule.ts                          # 생성: QualityRule 타입 + defineRule + RuleContext
    helpers.ts                              # 생성: walkTree, collectRenderNodesByMetadataId
    source-spec.ts                          # 생성: SourceSpec 인덱싱 헬퍼 (validators.ts에서 이동)
    index.ts                                # 생성: QUALITY_RULES 배열
    single-section-divider.ts               # 생성
    bottom-cta-state-ungated.ts             # 생성
    source-prop-mismatch.ts                 # 생성
    source-ref-not-materialized.ts          # 생성
    state-coverage-missing.ts               # 생성
  __tests__/
    registry.test.ts                        # 생성: registry 완전성 + 드리프트 가드
    validators.test.ts                      # 변경 없음 (회귀 가드 역할)
  rules/__tests__/
    helpers.test.ts                         # 생성: walkTree 단위 테스트
    single-section-divider.test.ts          # 생성: rule.check 단위 테스트
    bottom-cta-state-ungated.test.ts        # 생성
    source-prop-mismatch.test.ts            # 생성
    source-ref-not-materialized.test.ts     # 생성
    state-coverage-missing.test.ts          # 생성
```

---

### Task 1: 코드 메타데이터 registry

**Files:**
- Create: `packages/validation/src/public/registry.ts`
- Modify: `packages/validation/src/public/types.ts`
- Modify: `packages/validation/src/public/validators.ts` (addIssue + 호출부 severity 제거)
- Test: `packages/validation/src/__tests__/registry.test.ts`

- [ ] **Step 1: registry 완전성 테스트 작성 (실패 확인용)**

`packages/validation/src/__tests__/registry.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest";
import { VALIDATION_CODE_REGISTRY } from "../public/registry";

const LAYERS = ["input-guard", "system", "quality"] as const;
const SEVERITIES = ["error", "warning"] as const;
const OWNERS = ["engine", "rule"] as const;

describe("VALIDATION_CODE_REGISTRY", () => {
	it("declares layer, severity, owners, and a description for every code", () => {
		for (const [code, meta] of Object.entries(VALIDATION_CODE_REGISTRY)) {
			expect(LAYERS, `${code}.layer`).toContain(meta.layer);
			expect(SEVERITIES, `${code}.severity`).toContain(meta.severity);
			expect(meta.owners.length, `${code}.owners`).toBeGreaterThan(0);
			for (const owner of meta.owners) {
				expect(OWNERS, `${code}.owners`).toContain(owner);
			}
			expect(meta.description.length, `${code}.description`).toBeGreaterThan(0);
		}
	});

	it("keeps severity decisions in the registry, matching the legacy call-site values", () => {
		const warningCodes = Object.entries(VALIDATION_CODE_REGISTRY)
			.filter(([, meta]) => meta.severity === "warning")
			.map(([code]) => code)
			.sort();
		expect(warningCodes).toEqual([
			"internal-visible-title",
			"layout-ref-outside-candidates",
			"proposal-nearest-match-unknown",
			"source-ref-not-materialized",
			"state-coverage-missing",
			"unknown-prop",
			"unknown-source-ref",
			"uses-candidate-component",
		]);
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run packages/validation/src/__tests__/registry.test.ts`
Expected: FAIL — `Cannot find module '../public/registry'` 또는 유사 import 에러

- [ ] **Step 3: registry.ts 작성**

`packages/validation/src/public/registry.ts` 생성:

```ts
export type ValidationSeverity = "error" | "warning";
export type ValidationLayer = "input-guard" | "system" | "quality";

/**
 * 에러 코드의 단일 진실원.
 * - layer: 어느 검증 층에서 발생하는가 (input-guard=파싱, system=스키마/카탈로그 계약, quality=품질 rule)
 * - severity: 코드 단위로 고정. addIssue가 여기서 조회하므로 호출부에서 덮어쓸 수 없다
 * - owners: 발생 주체. "rule"이면 rules/ 디렉토리의 rule 파일이 발생시킨다 (드리프트 가드가 강제)
 * - docRef: 이 코드가 강제하는 계약의 근거 문서 (생성 단계 skill과의 연결 고리)
 */
export type ValidationCodeMeta = {
	layer: ValidationLayer;
	severity: ValidationSeverity;
	owners: ReadonlyArray<"engine" | "rule">;
	description: string;
	docRef?: string;
};

export const VALIDATION_CODE_REGISTRY = {
	"json-invalid": {
		layer: "input-guard",
		severity: "error",
		owners: ["engine"],
		description: "입력이 유효한 JSON이 아니거나 JSON 객체가 아니다.",
	},
	"schema-invalid": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "산출물이 JSON Schema 계약을 위반했다 (ajv).",
	},
	"required-field-missing": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "필수 필드(type, metadata, required prop, layout ref 등)가 없다.",
	},
	"duplicate-id": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "RenderTree 안에서 metadata.id가 중복됐다.",
	},
	"unknown-component-type": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "렌더러 계약(카탈로그·구조 노드 타입)에 없는 노드 타입이다.",
	},
	"unknown-prop": {
		layer: "system",
		severity: "warning",
		owners: ["engine"],
		description: "카탈로그 prop 계약에 선언되지 않은 prop이다.",
	},
	"invalid-prop-type": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "prop 값이 카탈로그에 선언된 타입과 다르다.",
	},
	"invalid-enum-value": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "enum prop 값이 허용 목록에 없다.",
	},
	"readonly-prop-written": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "aiWritable=false인 prop을 에이전트가 작성했다.",
	},
	"invalid-render-node": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "RenderTree 노드 구조(children 배열, Screen 리전, display, binding 등)가 깨졌다.",
	},
	"invalid-layout-prop": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "layout 노드 prop이 layout 계약을 위반했다.",
	},
	"internal-visible-title": {
		layer: "quality",
		severity: "warning",
		owners: ["engine"],
		description: "사용자에게 보이는 metadata.title이 내부 소스 이름(…Section/…Component)처럼 보인다.",
	},
	"list-text-dot-subtext-missing": {
		layer: "quality",
		severity: "error",
		owners: ["engine"],
		description: "ListText dot 행은 subText가 가시 텍스트인데 title만 제공됐다.",
	},
	"source-ref-not-materialized": {
		layer: "quality",
		severity: "warning",
		owners: ["engine", "rule"],
		description: "SourceSpec/CompositionPlan의 ref가 생성 산출물 어디에도 보이지 않는다 (누락 의심).",
	},
	"source-prop-mismatch": {
		layer: "quality",
		severity: "error",
		owners: ["rule"],
		description: "RenderTree가 SourceSpec의 원시 prop 값을 변조했다 (원본 보존 위반).",
	},
	"single-section-divider": {
		layer: "quality",
		severity: "error",
		owners: ["rule"],
		description: "Screen.Contents에 섹션이 하나뿐인데 section divider를 과적용했다.",
		docRef: "packages/agent/docs/skills/generate-skills/divider-usage-rules/README.md",
	},
	"state-coverage-missing": {
		layer: "quality",
		severity: "warning",
		owners: ["rule"],
		description: "상태가 있는 화면(폼·목록·검색 등)인데 loading/empty/error 등 상태 커버리지가 없다.",
	},
	"unknown-source-ref": {
		layer: "quality",
		severity: "warning",
		owners: ["engine"],
		description: "CompositionPlan의 sourceRef가 SourceSpec에 존재하지 않는다.",
	},
	"unknown-layout-ref": {
		layer: "system",
		severity: "error",
		owners: ["engine"],
		description: "layout 패턴 id가 카탈로그에 없거나 노드 target과 맞지 않는다.",
	},
	"layout-ref-outside-candidates": {
		layer: "quality",
		severity: "warning",
		owners: ["engine"],
		description: "layout ref가 선택된 패턴 후보 밖이다.",
	},
	"proposal-source-evidence-missing": {
		layer: "quality",
		severity: "error",
		owners: ["engine"],
		description: "component-proposal의 sourceEvidence가 allowedRefs에 없다.",
	},
	"proposal-nearest-match-unknown": {
		layer: "quality",
		severity: "warning",
		owners: ["engine"],
		description: "component-proposal의 nearestCatalogMatch가 카탈로그 컴포넌트 타입이 아니다.",
	},
	"proposal-limit-exceeded": {
		layer: "quality",
		severity: "error",
		owners: ["engine"],
		description: "component-proposal 개수가 상한을 초과했다.",
	},
	"bottom-cta-state-ungated": {
		layer: "quality",
		severity: "error",
		owners: ["rule"],
		description: "Screen.Bottom의 state-variant ActionButton이 display.when 게이팅 없이 항상 렌더된다.",
	},
	"uses-candidate-component": {
		layer: "quality",
		severity: "warning",
		owners: ["engine"],
		description: "stable로 승격되지 않은 candidate 카탈로그 컴포넌트를 사용했다.",
	},
} as const satisfies Record<string, ValidationCodeMeta>;

export type ValidationIssueCode = keyof typeof VALIDATION_CODE_REGISTRY;

export function getValidationCodeMeta(code: ValidationIssueCode): ValidationCodeMeta {
	return VALIDATION_CODE_REGISTRY[code];
}
```

- [ ] **Step 4: types.ts에서 union 제거, registry 재수출**

`packages/validation/src/public/types.ts`에서 `ValidationSeverity`와 `ValidationIssueCode` 정의를 삭제하고 재수출로 교체:

기존 (삭제):

```ts
export type ValidationSeverity = "error" | "warning";

export type ValidationIssueCode =
	| "json-invalid"
	| "schema-invalid"
	// ... (25개 union 전체)
	| "uses-candidate-component";
```

교체 (파일 상단 import 아래에 추가):

```ts
export type {
	ValidationCodeMeta,
	ValidationIssueCode,
	ValidationLayer,
	ValidationSeverity,
} from "./registry";
```

`ValidationIssue`, `ValidationReport`가 같은 파일의 타입을 참조하므로 type import도 필요하다:

```ts
import type { ValidationIssueCode, ValidationSeverity } from "./registry";
```

(`ValidationIssue`의 필드 정의는 그대로: `code: ValidationIssueCode; severity: ValidationSeverity;`)

- [ ] **Step 5: addIssue가 registry에서 severity를 조회하게 변경**

`packages/validation/src/public/validators.ts`:

(a) import 추가:

```ts
import { VALIDATION_CODE_REGISTRY } from "./registry";
```

(b) `IssueInput` 타입과 `addIssue`를 교체 (validators.ts 하단):

기존:

```ts
type IssueInput = Omit<ValidationIssue, "severity"> & {
	severity?: ValidationSeverity;
};
// ...
function addIssue(issues: ValidationIssue[], issue: IssueInput) {
	issues.push({
		severity: "error",
		...issue,
	});
}
```

교체:

```ts
type IssueInput = Omit<ValidationIssue, "severity">;
// ...
function addIssue(issues: ValidationIssue[], issue: IssueInput) {
	issues.push({
		severity: VALIDATION_CODE_REGISTRY[issue.code].severity,
		...issue,
	});
}
```

(c) 호출부 9곳의 ad-hoc `severity: "warning",` 줄을 전부 삭제한다. 대상 코드: `proposal-nearest-match-unknown`, `unknown-source-ref`, `source-ref-not-materialized`(2곳), `state-coverage-missing`, `layout-ref-outside-candidates`, `uses-candidate-component`, `internal-visible-title`, `unknown-prop`. `IssueInput`에서 severity 필드가 사라졌으므로 지우지 않으면 타입 에러가 난다 — 컴파일러가 누락을 잡아준다.

(d) `ValidationSeverity` import가 더 이상 필요 없으면 `./types` import 목록에서 제거한다.

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm vitest run packages/validation`
Expected: PASS — registry.test.ts 2개 + 기존 55개 전부 (severity 동작이 동일해야 기존 테스트가 통과한다)

- [ ] **Step 7: 커밋**

```bash
git add packages/validation/src/public/registry.ts packages/validation/src/public/types.ts packages/validation/src/public/validators.ts packages/validation/src/__tests__/registry.test.ts
git commit -m "refactor(validation): 에러 코드 메타데이터를 registry 테이블로 중앙화

ValidationIssueCode union을 VALIDATION_CODE_REGISTRY에서 파생하고,
severity를 addIssue가 registry에서 조회하도록 변경. 호출부의
ad-hoc severity 지정 제거.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: rule 계약 + 순회 헬퍼

**Files:**
- Create: `packages/validation/src/rules/define-rule.ts`
- Create: `packages/validation/src/rules/helpers.ts`
- Create: `packages/validation/src/rules/source-spec.ts`
- Modify: `packages/validation/src/public/validators.ts` (SourceSpec 헬퍼를 source-spec.ts로 이동)
- Test: `packages/validation/src/rules/__tests__/helpers.test.ts`

- [ ] **Step 1: walkTree 실패 테스트 작성**

`packages/validation/src/rules/__tests__/helpers.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest";
import { walkTree } from "../helpers";

describe("walkTree", () => {
	const tree = {
		type: "Screen",
		children: [
			{
				type: "Screen.Bottom",
				children: [{ type: "ActionButton", props: { label: "확인" } }],
			},
		],
	};

	it("visits every record node with its path", () => {
		const visited: Array<{ type: unknown; path: Array<string | number> }> = [];
		walkTree(tree, (node, path) => {
			visited.push({ type: node.type, path });
		});
		expect(visited).toEqual([
			{ type: "Screen", path: [] },
			{ type: "Screen.Bottom", path: ["children", 0] },
			{ type: "ActionButton", path: ["children", 0, "children", 0] },
		]);
	});

	it("provides ancestors from root to parent", () => {
		let buttonAncestors: unknown[] = [];
		walkTree(tree, (node, _path, ancestors) => {
			if (node.type === "ActionButton") {
				buttonAncestors = ancestors.map((ancestor) => ancestor.type);
			}
		});
		expect(buttonAncestors).toEqual(["Screen", "Screen.Bottom"]);
	});

	it("ignores non-record nodes and walks array roots", () => {
		const visited: unknown[] = [];
		walkTree([null, "text", { type: "A" }], (node) => {
			visited.push(node.type);
		});
		expect(visited).toEqual(["A"]);
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run packages/validation/src/rules`
Expected: FAIL — `Cannot find module '../helpers'`

- [ ] **Step 3: helpers.ts 작성**

`packages/validation/src/rules/helpers.ts` 생성:

```ts
import { isRecord } from "@cx/schema";

export type IssuePath = Array<string | number>;

type TreeVisitor = (
	node: Record<string, unknown>,
	path: IssuePath,
	ancestors: Array<Record<string, unknown>>,
) => void;

/**
 * RenderTree 모양(children 재귀)을 깊이 우선으로 순회한다.
 * rule들이 각자 재귀를 재구현하지 않도록 하는 공용 순회기.
 */
export function walkTree(
	node: unknown,
	visit: TreeVisitor,
	path: IssuePath = [],
	ancestors: Array<Record<string, unknown>> = [],
): void {
	if (Array.isArray(node)) {
		node.forEach((child, index) => {
			walkTree(child, visit, [...path, index], ancestors);
		});
		return;
	}
	if (!isRecord(node)) return;

	visit(node, path, ancestors);

	if (Array.isArray(node.children)) {
		node.children.forEach((child, index) => {
			walkTree(child, visit, [...path, "children", index], [...ancestors, node]);
		});
	}
}

/**
 * metadata.id → 노드(+발견 경로) 인덱스. source-prop-mismatch처럼
 * SourceSpec ref와 RenderTree 노드를 교차 비교하는 rule이 사용한다.
 */
export function collectRenderNodesByMetadataId(
	input: unknown,
	path: IssuePath = [],
	nodes = new Map<string, Record<string, unknown> & { path?: IssuePath }>(),
): Map<string, Record<string, unknown> & { path?: IssuePath }> {
	if (Array.isArray(input)) {
		input.forEach((child, index) => {
			collectRenderNodesByMetadataId(child, [...path, index], nodes);
		});
		return nodes;
	}
	if (!isRecord(input)) return nodes;
	const metadata = isRecord(input.metadata) ? input.metadata : undefined;
	if (typeof metadata?.id === "string" && metadata.id.length > 0) {
		nodes.set(metadata.id, { ...input, path });
	}
	if (Array.isArray(input.children)) {
		input.children.forEach((child, index) => {
			collectRenderNodesByMetadataId(child, [...path, "children", index], nodes);
		});
	}
	return nodes;
}
```

(`collectRenderNodesByMetadataId`는 validators.ts 315-337의 기존 구현을 그대로 옮긴 것. validators.ts 쪽 원본은 Task 5에서 삭제한다.)

- [ ] **Step 4: source-spec.ts 작성 — validators.ts의 SourceSpec 헬퍼 이동**

`packages/validation/src/rules/source-spec.ts` 생성. 아래 함수들은 validators.ts에 있는 기존 구현을 **그대로 잘라내어 옮긴다** (동작 변경 없음): `collectSourceComponentsByRenderRef`, `refIsMaterialized`, `collectSourceRefLabelIndex`, `collectComponentLabels`(비공개 유지), `collectSourceSpecRefs`, `collectMaterializationSourceRefs`, `isMaterializableRef`, `isPrimitiveSourcePropValue`, 상수 `STATEFUL_SURFACE_TERMS`, `STATE_COVERAGE_TERMS`.

```ts
import type { SourceSpec } from "@cx/schema";
import { isRecord } from "@cx/schema";

export function collectSourceComponentsByRenderRef(
	sourceSpec: SourceSpec,
): Map<string, Record<string, unknown>> {
	const components = new Map<string, Record<string, unknown>>();
	for (const region of sourceSpec.sourceShape.screen.regions) {
		for (const area of region.children) {
			for (const component of area.children) {
				const refs = [
					(component as { sourceId?: unknown }).sourceId,
					(component as { roleAlias?: unknown }).roleAlias,
				];
				for (const ref of refs) {
					if (typeof ref === "string" && ref.length > 0) {
						components.set(ref, component as unknown as Record<string, unknown>);
					}
				}
			}
		}
	}
	return components;
}

/**
 * A source ref counts as materialized when its id appears in the output, OR when a
 * visible label from that source component does (the element was folded into a parent
 * prop, e.g. a field-side action button rendered via TextField.buttonLabel).
 */
export function refIsMaterialized(
	ref: string,
	generatedText: string,
	labelIndex: Map<string, string[]>,
): boolean {
	if (generatedText.includes(ref)) return true;
	return (labelIndex.get(ref) ?? []).some((label) => generatedText.includes(label));
}

export function collectSourceRefLabelIndex(sourceSpec: SourceSpec): Map<string, string[]> {
	const index = new Map<string, string[]>();
	for (const region of sourceSpec.sourceShape.screen.regions) {
		for (const area of region.children) {
			for (const component of area.children) {
				const labels = collectComponentLabels(component);
				if (labels.length === 0) continue;
				for (const ref of [
					(component as { sourceId?: unknown }).sourceId,
					(component as { sourceComponentId?: unknown }).sourceComponentId,
					(component as { roleAlias?: unknown }).roleAlias,
				]) {
					if (typeof ref === "string" && ref.length > 0) {
						index.set(ref, [...(index.get(ref) ?? []), ...labels]);
					}
				}
			}
		}
	}
	return index;
}

function collectComponentLabels(component: unknown): string[] {
	if (!isRecord(component) || !isRecord(component.props)) return [];
	return Object.values(component.props).filter(
		(value): value is string => typeof value === "string" && value.trim().length >= 2,
	);
}

export function collectSourceSpecRefs(sourceSpec: SourceSpec): Set<string> {
	return new Set(
		[
			sourceSpec.sourceShape.screen.screenCode,
			sourceSpec.sourceShape.screen.route,
			...sourceSpec.sourceShape.screen.regions.flatMap((region) =>
				region.children.flatMap((area) => [
					area.sourceAreaId,
					area.sourceAreaName,
					...area.children.map((component) => component.sourceComponentId),
					...area.children.map((component) => component.sourceId),
					...area.children.map((component) => component.roleAlias),
					...area.children.map((component) => component.componentType),
				]),
			),
		].filter((ref): ref is string => Boolean(ref)),
	);
}

export function collectMaterializationSourceRefs(sourceSpec: SourceSpec): string[] {
	return [
		...new Set(
			sourceSpec.sourceShape.screen.regions.flatMap((region) =>
				region.children.flatMap((area) => [
					area.sourceAreaId,
					...area.children.map((component) => component.sourceId),
					...area.children.map((component) => component.sourceComponentId),
				]),
			),
		),
	].filter(isMaterializableRef);
}

/**
 * Structural order tokens (e.g. the "999" bottom-area sentinel or a "2"
 * sequence number) are not visible content, so they must not be checked for
 * output materialization — doing so produces phantom "ref not visible" noise.
 */
export function isMaterializableRef(ref: string | undefined): ref is string {
	return typeof ref === "string" && ref.length > 0 && !/^\d+$/.test(ref);
}

export function isPrimitiveSourcePropValue(value: unknown): value is boolean | number | string {
	return typeof value === "boolean" || typeof value === "number" || typeof value === "string";
}

export const STATEFUL_SURFACE_TERMS = [
	"async",
	"empty",
	"error",
	"form",
	"input",
	"list",
	"loading",
	"search",
	"select",
	"validation",
	"검색",
	"목록",
	"에러",
	"오류",
	"입력",
	"폼",
	"필수",
] as const;

export const STATE_COVERAGE_TERMS = [
	"disabled",
	"empty",
	"error",
	"loading",
	"stateRole",
	"validation",
	"오류",
	"로딩",
	"빈",
] as const;
```

validators.ts에서는 위 함수/상수들의 정의를 삭제하고 import로 교체:

```ts
import {
	collectSourceRefLabelIndex,
	collectSourceSpecRefs,
	refIsMaterialized,
} from "../rules/source-spec";
```

(이 시점에 validators.ts에 아직 남아 있는 품질 rule 함수들 — `validateSourcePropPreservation`, `validateSourceRefCoverage`, `validateStateCoverage` — 은 source-spec.ts에서 import한 헬퍼를 사용하도록 import만 바꾼다. 함수 자체의 이동은 Task 5~7에서 한다. `collectSourceComponentsByRenderRef`, `collectMaterializationSourceRefs`, `isMaterializableRef`, `isPrimitiveSourcePropValue`, `STATEFUL_SURFACE_TERMS`, `STATE_COVERAGE_TERMS`, `collectRenderNodesByMetadataId`도 같은 방식으로 import한다.)

- [ ] **Step 5: define-rule.ts 작성**

`packages/validation/src/rules/define-rule.ts` 생성:

```ts
import type { SourceSpec } from "@cx/schema";
import type { ValidationIssueCode } from "../public/registry";
import type { ValidationTarget } from "../public/types";
import type { IssuePath } from "./helpers";

/**
 * 품질 rule이 받는 실행 컨텍스트.
 * report()는 rule 자신의 code·severity(registry 조회)를 자동으로 채운다 —
 * rule이 자기 code 외의 issue를 발생시키는 드리프트를 구조적으로 차단한다.
 */
export type RuleContext = {
	/** 검증 대상 트리 (validateRenderTree의 input) */
	tree: Record<string, unknown>;
	/** materialization 검사 대상 산출물 (options.generatedArtifact ?? tree) */
	artifact: unknown;
	sourceSpec?: SourceSpec;
	report: (issue: { message: string; path: IssuePath }) => void;
};

export type QualityRule = {
	code: ValidationIssueCode;
	target: ValidationTarget;
	/** 선언된 입력이 없으면 엔진이 rule을 건너뛴다 (enable 조건) */
	requires?: ReadonlyArray<"sourceSpec">;
	check: (ctx: RuleContext) => void;
};

export function defineRule(rule: QualityRule): QualityRule {
	return rule;
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm vitest run packages/validation`
Expected: PASS — helpers.test.ts 3개 포함 전체 통과 (source-spec.ts 이동은 순수 이동이므로 기존 테스트가 그대로 통과해야 한다)

- [ ] **Step 7: 커밋**

```bash
git add packages/validation/src/rules packages/validation/src/public/validators.ts
git commit -m "refactor(validation): rule 계약(defineRule)과 공용 순회·SourceSpec 헬퍼 분리

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: single-section-divider rule 분리 + 엔진 연결

**Files:**
- Create: `packages/validation/src/rules/single-section-divider.ts`
- Create: `packages/validation/src/rules/index.ts`
- Modify: `packages/validation/src/public/validators.ts` (runQualityRules 추가, 기존 함수 삭제)
- Test: `packages/validation/src/rules/__tests__/single-section-divider.test.ts`

- [ ] **Step 1: rule 단위 테스트 작성**

`packages/validation/src/rules/__tests__/single-section-divider.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { singleSectionDividerRule } from "../single-section-divider";

function runRule(tree: Record<string, unknown>) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree,
		artifact: tree,
		report: (issue) => issues.push(issue),
	};
	singleSectionDividerRule.check(ctx);
	return issues;
}

describe("single-section-divider rule", () => {
	it("flags a lone contents section with a section divider", () => {
		const issues = runRule({
			type: "Screen",
			children: [
				{
					type: "Screen.Contents",
					children: [{ type: "area.stack", props: { divider: "section" } }],
				},
			],
		});
		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual([
			"children",
			0,
			"children",
			0,
			"props",
			"divider",
		]);
	});

	it("allows section dividers between multiple sections", () => {
		const issues = runRule({
			type: "Screen",
			children: [
				{
					type: "Screen.Contents",
					children: [
						{ type: "area.stack", props: { divider: "section" } },
						{ type: "area.stack", props: {} },
					],
				},
			],
		});
		expect(issues).toHaveLength(0);
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run packages/validation/src/rules`
Expected: FAIL — `Cannot find module '../single-section-divider'`

- [ ] **Step 3: rule 파일 작성**

`packages/validation/src/rules/single-section-divider.ts` 생성 (로직은 validators.ts의 `validateSingleSectionDivider`와 동일, walkTree 사용으로 재귀만 제거):

```ts
import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";
import { walkTree } from "./helpers";

export const singleSectionDividerRule = defineRule({
	code: "single-section-divider",
	target: "render-tree",
	check(ctx) {
		walkTree(ctx.tree, (node, path) => {
			if (node.type !== "Screen.Contents" || !Array.isArray(node.children)) return;
			const areaChildren = node.children.filter(isRecord);
			if (areaChildren.length !== 1) return;
			const area = areaChildren[0];
			if (!isRecord(area?.props) || area.props.divider !== "section") return;
			ctx.report({
				message:
					'Screen.Contents has a single section, so props.divider="section" is over-applied. Omit divider or use "none"; section dividers are only for boundaries between multiple contents sections.',
				path: [...path, "children", 0, "props", "divider"],
			});
		});
	},
});
```

- [ ] **Step 4: rules/index.ts 작성**

`packages/validation/src/rules/index.ts` 생성:

```ts
import type { QualityRule } from "./define-rule";
import { singleSectionDividerRule } from "./single-section-divider";

export type { QualityRule, RuleContext } from "./define-rule";
export { defineRule } from "./define-rule";

/** 등록된 품질 rule 전부. 새 rule은 여기 한 줄 추가로 등록된다. */
export const QUALITY_RULES: readonly QualityRule[] = [singleSectionDividerRule];
```

- [ ] **Step 5: validators.ts에 runQualityRules 추가, 기존 함수 삭제**

(a) import 추가:

```ts
import type { RuleContext } from "../rules/define-rule";
import { QUALITY_RULES } from "../rules/index";
```

(b) `validateRenderTree` 안에서 `validateSingleSectionDivider(input, [], issues);` 호출 한 줄만 제거하고, 기존 레거시 호출들(`validateSourceRefCoverage` 등)은 그대로 둔 채 그 **아래에** runQualityRules 호출을 추가한다 (Task 4~7이 진행되면서 레거시 호출이 하나씩 사라지고 이 호출만 남는다):

```ts
	runQualityRules(
		"render-tree",
		{
			artifact: options.generatedArtifact ?? input,
			sourceSpec: options.sourceSpec,
			tree: input,
		},
		issues,
	);
```

주의: 마이그레이션이 끝나면 issue 배열 내 순서가 레거시(`sourceRef → sourceProp → stateCoverage → divider → bottomCta`)에서 `QUALITY_RULES` 배열 순서로 바뀐다. 기존 테스트가 `issues[0]`처럼 인덱스로 단언하다 깨지면 테스트를 고치지 말고 `QUALITY_RULES` 배열 순서를 레거시 순서로 맞춰라.

(c) validators.ts 하단에 엔진 함수 추가:

```ts
function runQualityRules(
	target: ValidationTarget,
	ctx: Omit<RuleContext, "report">,
	issues: ValidationIssue[],
) {
	for (const rule of QUALITY_RULES) {
		if (rule.target !== target) continue;
		if (rule.requires?.includes("sourceSpec") && !ctx.sourceSpec) continue;
		rule.check({
			...ctx,
			report: (issue) => addIssue(issues, { code: rule.code, ...issue }),
		});
	}
}
```

(d) `validateSingleSectionDivider` 함수 정의를 validators.ts에서 삭제한다.

- [ ] **Step 6: 전체 테스트 통과 확인**

Run: `pnpm vitest run packages/validation`
Expected: PASS — 기존 validators.test.ts의 divider 테스트("errors when a single contents section uses a section divider" 등)가 rule 경유로 동일하게 통과

- [ ] **Step 7: 커밋**

```bash
git add packages/validation/src/rules packages/validation/src/public/validators.ts
git commit -m "refactor(validation): single-section-divider를 rule 모듈로 분리, runQualityRules 엔진 도입

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: bottom-cta-state-ungated rule 분리

**Files:**
- Create: `packages/validation/src/rules/bottom-cta-state-ungated.ts`
- Modify: `packages/validation/src/rules/index.ts`
- Modify: `packages/validation/src/public/validators.ts`
- Test: `packages/validation/src/rules/__tests__/bottom-cta-state-ungated.test.ts`

- [ ] **Step 1: rule 단위 테스트 작성**

`packages/validation/src/rules/__tests__/bottom-cta-state-ungated.test.ts` 생성:

```ts
import { describe, expect, it } from "vitest";
import { bottomCtaStateUngatedRule } from "../bottom-cta-state-ungated";
import type { RuleContext } from "../define-rule";

function runRule(tree: Record<string, unknown>) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree,
		artifact: tree,
		report: (issue) => issues.push(issue),
	};
	bottomCtaStateUngatedRule.check(ctx);
	return issues;
}

function bottomWith(buttons: Array<Record<string, unknown>>) {
	return {
		type: "Screen",
		children: [{ type: "Screen.Bottom", children: buttons }],
	};
}

describe("bottom-cta-state-ungated rule", () => {
	it("flags a state-variant bottom CTA without display.when", () => {
		const issues = runRule(
			bottomWith([{ type: "ActionButton", display: { stateRole: "loading" } }]),
		);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual([
			"children",
			0,
			"children",
			0,
			"display",
			"when",
		]);
	});

	it("accepts a state-variant bottom CTA gated by display.when", () => {
		const issues = runRule(
			bottomWith([
				{
					type: "ActionButton",
					display: { stateRole: "loading", when: { bind: "$.state.loading" } },
				},
			]),
		);
		expect(issues).toHaveLength(0);
	});

	it("ignores base-state and stateless CTAs", () => {
		const issues = runRule(
			bottomWith([
				{ type: "ActionButton", display: { stateRole: "base" } },
				{ type: "ActionButton" },
			]),
		);
		expect(issues).toHaveLength(0);
	});

	it("ignores ActionButtons outside Screen.Bottom", () => {
		const issues = runRule({
			type: "Screen",
			children: [
				{
					type: "Screen.Contents",
					children: [{ type: "ActionButton", display: { stateRole: "error" } }],
				},
			],
		});
		expect(issues).toHaveLength(0);
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run packages/validation/src/rules`
Expected: FAIL — `Cannot find module '../bottom-cta-state-ungated'`

- [ ] **Step 3: rule 파일 작성**

`packages/validation/src/rules/bottom-cta-state-ungated.ts` 생성. 기존 `validateBottomCtaStateGating`의 `insideBottom` 누적 파라미터를 walkTree의 `ancestors`로 대체한다:

```ts
import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";
import { walkTree } from "./helpers";

/**
 * Screen.Bottom의 state-variant CTA가 display.when 없이 항상 렌더되어 CTA가 중복 노출되는 것을 막는다.
 * 비-base display.stateRole을 가진 ActionButton은 display.when으로 게이팅돼야 한다.
 */
export const bottomCtaStateUngatedRule = defineRule({
	code: "bottom-cta-state-ungated",
	target: "render-tree",
	check(ctx) {
		walkTree(ctx.tree, (node, path, ancestors) => {
			if (node.type !== "ActionButton") return;
			if (!ancestors.some((ancestor) => ancestor.type === "Screen.Bottom")) return;
			const display = isRecord(node.display) ? node.display : undefined;
			const stateRole = display?.stateRole;
			const hasWhen = display !== undefined && "when" in display && display.when !== undefined;
			if (typeof stateRole !== "string" || stateRole === "base" || hasWhen) return;
			ctx.report({
				message: `Bottom ActionButton declares state '${stateRole}' without display.when, so multiple CTAs render at once. Gate state-variant CTAs with display.when or use a single CTA.`,
				path: [...path, "display", "when"],
			});
		});
	},
});
```

- [ ] **Step 4: index.ts 등록 + validators.ts에서 기존 함수 삭제**

`rules/index.ts`:

```ts
import { bottomCtaStateUngatedRule } from "./bottom-cta-state-ungated";
import type { QualityRule } from "./define-rule";
import { singleSectionDividerRule } from "./single-section-divider";

export type { QualityRule, RuleContext } from "./define-rule";
export { defineRule } from "./define-rule";

/** 등록된 품질 rule 전부. 새 rule은 여기 한 줄 추가로 등록된다. */
export const QUALITY_RULES: readonly QualityRule[] = [
	bottomCtaStateUngatedRule,
	singleSectionDividerRule,
];
```

validators.ts에서 `validateBottomCtaStateGating(input, [], false, issues);` 호출과 함수 정의(주석 포함)를 삭제한다.

- [ ] **Step 5: 전체 테스트 통과 확인**

Run: `pnpm vitest run packages/validation`
Expected: PASS — validators.test.ts의 "validateRenderTree bottom CTA state gating" describe 3개가 rule 경유로 통과

- [ ] **Step 6: 커밋**

```bash
git add packages/validation/src/rules packages/validation/src/public/validators.ts
git commit -m "refactor(validation): bottom-cta-state-ungated를 rule 모듈로 분리

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: source-prop-mismatch rule 분리

**Files:**
- Create: `packages/validation/src/rules/source-prop-mismatch.ts`
- Modify: `packages/validation/src/rules/index.ts`
- Modify: `packages/validation/src/public/validators.ts`
- Test: `packages/validation/src/rules/__tests__/source-prop-mismatch.test.ts`

- [ ] **Step 1: rule 단위 테스트 작성**

`packages/validation/src/rules/__tests__/source-prop-mismatch.test.ts` 생성:

```ts
import type { SourceSpec } from "@cx/schema";
import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { sourcePropMismatchRule } from "../source-prop-mismatch";

function buildSourceSpec(componentProps: Record<string, unknown>): SourceSpec {
	return {
		sourceShape: {
			screen: {
				screenCode: "SCR-001",
				route: "/sample",
				regions: [
					{
						children: [
							{
								sourceAreaId: "area-1",
								children: [
									{
										sourceId: "title-1",
										componentType: "TitleMain",
										props: componentProps,
									},
								],
							},
						],
					},
				],
			},
		},
	} as unknown as SourceSpec;
}

function runRule(sourceSpec: SourceSpec, artifact: unknown) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree: artifact as Record<string, unknown>,
		artifact,
		sourceSpec,
		report: (issue) => issues.push(issue),
	};
	sourcePropMismatchRule.check(ctx);
	return issues;
}

describe("source-prop-mismatch rule", () => {
	it("flags a render node that rewrites a primitive source prop", () => {
		const issues = runRule(buildSourceSpec({ title: "원래 제목" }), {
			children: [
				{
					type: "TitleMain",
					metadata: { id: "title-1" },
					props: { title: "바뀐 제목" },
				},
			],
		});
		expect(issues).toHaveLength(1);
		expect(issues[0]?.path).toEqual(["children", 0, "props", "title"]);
	});

	it("accepts preserved source props and ignores non-primitive values", () => {
		const issues = runRule(buildSourceSpec({ title: "원래 제목", meta: { a: 1 } }), {
			children: [
				{
					type: "TitleMain",
					metadata: { id: "title-1" },
					props: { title: "원래 제목", meta: { a: 2 } },
				},
			],
		});
		expect(issues).toHaveLength(0);
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run packages/validation/src/rules`
Expected: FAIL — `Cannot find module '../source-prop-mismatch'`

- [ ] **Step 3: rule 파일 작성**

`packages/validation/src/rules/source-prop-mismatch.ts` 생성 (기존 `validateSourcePropPreservation` 로직 그대로, sourceSpec 가드는 `requires`가 대신한다):

```ts
import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";
import { collectRenderNodesByMetadataId } from "./helpers";
import { collectSourceComponentsByRenderRef, isPrimitiveSourcePropValue } from "./source-spec";

export const sourcePropMismatchRule = defineRule({
	code: "source-prop-mismatch",
	target: "render-tree",
	requires: ["sourceSpec"],
	check(ctx) {
		if (!ctx.sourceSpec) return;
		const sourceComponents = collectSourceComponentsByRenderRef(ctx.sourceSpec);
		if (sourceComponents.size === 0) return;
		const renderNodes = collectRenderNodesByMetadataId(ctx.artifact);

		for (const [sourceRef, component] of sourceComponents) {
			const renderNode = renderNodes.get(sourceRef);
			if (!renderNode || !isRecord(renderNode.props) || !isRecord(component.props)) continue;
			for (const [propName, sourceValue] of Object.entries(component.props)) {
				if (!isPrimitiveSourcePropValue(sourceValue)) continue;
				if (!(propName in renderNode.props)) continue;
				const renderValue = renderNode.props[propName];
				if (!isPrimitiveSourcePropValue(renderValue)) continue;
				if (renderValue === sourceValue) continue;
				ctx.report({
					message: `RenderTree changed SourceSpec prop ${sourceRef}.${propName}: expected ${JSON.stringify(sourceValue)}, received ${JSON.stringify(renderValue)}.`,
					path: [...(renderNode.path ?? []), "props", propName],
				});
			}
		}
	},
});
```

- [ ] **Step 4: index.ts 등록 + validators.ts 정리**

`rules/index.ts`의 `QUALITY_RULES`에 `sourcePropMismatchRule` 추가 (import 포함, 알파벳 순서 유지):

```ts
export const QUALITY_RULES: readonly QualityRule[] = [
	bottomCtaStateUngatedRule,
	singleSectionDividerRule,
	sourcePropMismatchRule,
];
```

validators.ts에서 `validateSourcePropPreservation(...)` 호출과 함수 정의를 삭제한다. 이 시점에 validators.ts의 `collectRenderNodesByMetadataId`·`collectSourceComponentsByRenderRef`·`isPrimitiveSourcePropValue` import가 미사용이 되면 제거한다.

- [ ] **Step 5: 전체 테스트 통과 확인**

Run: `pnpm vitest run packages/validation`
Expected: PASS — validators.test.ts의 "errors when RenderTree changes primitive SourceSpec props" 통과

- [ ] **Step 6: 커밋**

```bash
git add packages/validation/src/rules packages/validation/src/public/validators.ts
git commit -m "refactor(validation): source-prop-mismatch를 rule 모듈로 분리

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: source-ref-not-materialized (render-tree) rule 분리

**Files:**
- Create: `packages/validation/src/rules/source-ref-not-materialized.ts`
- Modify: `packages/validation/src/rules/index.ts`
- Modify: `packages/validation/src/public/validators.ts`
- Test: `packages/validation/src/rules/__tests__/source-ref-not-materialized.test.ts`

주의: 같은 코드가 composition-plan 쪽(`validateCompositionPlanMaterialization`)에서도 발생한다. 그쪽은 엔진 소유로 남기며 **건드리지 않는다** (registry `owners: ["engine", "rule"]`가 이 상태를 문서화한다).

- [ ] **Step 1: rule 단위 테스트 작성**

`packages/validation/src/rules/__tests__/source-ref-not-materialized.test.ts` 생성:

```ts
import type { SourceSpec } from "@cx/schema";
import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { sourceRefNotMaterializedRule } from "../source-ref-not-materialized";

function buildSourceSpec(): SourceSpec {
	return {
		sourceShape: {
			screen: {
				screenCode: "SCR-001",
				route: "/sample",
				regions: [
					{
						children: [
							{
								sourceAreaId: "999",
								children: [
									{
										sourceId: "cta-submit",
										componentType: "ActionButton",
										props: { label: "제출하기" },
									},
								],
							},
						],
					},
				],
			},
		},
	} as unknown as SourceSpec;
}

function runRule(sourceSpec: SourceSpec, artifact: unknown) {
	const issues: Array<{ message: string; path: Array<string | number> }> = [];
	const ctx: RuleContext = {
		tree: artifact as Record<string, unknown>,
		artifact,
		sourceSpec,
		report: (issue) => issues.push(issue),
	};
	sourceRefNotMaterializedRule.check(ctx);
	return issues;
}

describe("source-ref-not-materialized rule", () => {
	it("flags a source ref that is absent from the generated artifact", () => {
		const issues = runRule(buildSourceSpec(), { children: [] });
		expect(issues).toHaveLength(1);
		expect(issues[0]?.message).toContain("cta-submit");
	});

	it("accepts refs materialized by id", () => {
		const issues = runRule(buildSourceSpec(), {
			children: [{ metadata: { id: "cta-submit" } }],
		});
		expect(issues).toHaveLength(0);
	});

	it("accepts refs materialized by a visible label (folded into a parent prop)", () => {
		const issues = runRule(buildSourceSpec(), {
			children: [{ type: "TextField", props: { buttonLabel: "제출하기" } }],
		});
		expect(issues).toHaveLength(0);
	});

	it("does not flag purely numeric structural refs", () => {
		const issues = runRule(buildSourceSpec(), {
			children: [{ metadata: { id: "cta-submit" } }],
		});
		expect(issues.some((issue) => issue.message.includes("999"))).toBe(false);
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run packages/validation/src/rules`
Expected: FAIL — `Cannot find module '../source-ref-not-materialized'`

- [ ] **Step 3: rule 파일 작성**

`packages/validation/src/rules/source-ref-not-materialized.ts` 생성 (기존 `validateSourceRefCoverage` 로직 그대로):

```ts
import { defineRule } from "./define-rule";
import {
	collectMaterializationSourceRefs,
	collectSourceRefLabelIndex,
	refIsMaterialized,
} from "./source-spec";

export const sourceRefNotMaterializedRule = defineRule({
	code: "source-ref-not-materialized",
	target: "render-tree",
	requires: ["sourceSpec"],
	check(ctx) {
		if (!ctx.sourceSpec) return;
		const generatedText = JSON.stringify(ctx.artifact);
		const labelIndex = collectSourceRefLabelIndex(ctx.sourceSpec);
		const sourceRefs = collectMaterializationSourceRefs(ctx.sourceSpec);

		sourceRefs.forEach((sourceRef) => {
			if (refIsMaterialized(sourceRef, generatedText, labelIndex)) return;
			ctx.report({
				message: `SourceSpec ref is not visible in generated artifact: ${sourceRef}.`,
				path: [],
			});
		});
	},
});
```

- [ ] **Step 4: index.ts 등록 + validators.ts 정리**

`QUALITY_RULES`에 `sourceRefNotMaterializedRule` 추가. validators.ts에서 `validateSourceRefCoverage(...)` 호출과 함수 정의를 삭제하고, 미사용이 된 `collectMaterializationSourceRefs`·`isMaterializableRef` import를 제거한다 (`refIsMaterialized`·`collectSourceRefLabelIndex`는 composition-plan 검증이 계속 사용하므로 남는다).

- [ ] **Step 5: 전체 테스트 통과 확인**

Run: `pnpm vitest run packages/validation`
Expected: PASS — validators.test.ts의 "warns when SourceSpec refs are not visible…", "treats a source ref as materialized when its label…", "does not warn for purely numeric source refs…" 통과

- [ ] **Step 6: 커밋**

```bash
git add packages/validation/src/rules packages/validation/src/public/validators.ts
git commit -m "refactor(validation): source-ref-not-materialized(render-tree)를 rule 모듈로 분리

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: state-coverage-missing rule 분리

**Files:**
- Create: `packages/validation/src/rules/state-coverage-missing.ts`
- Modify: `packages/validation/src/rules/index.ts`
- Modify: `packages/validation/src/public/validators.ts`
- Test: `packages/validation/src/rules/__tests__/state-coverage-missing.test.ts`

- [ ] **Step 1: rule 단위 테스트 작성**

`packages/validation/src/rules/__tests__/state-coverage-missing.test.ts` 생성:

```ts
import type { SourceSpec } from "@cx/schema";
import { describe, expect, it } from "vitest";
import type { RuleContext } from "../define-rule";
import { stateCoverageMissingRule } from "../state-coverage-missing";

function buildSourceSpec(componentType: string): SourceSpec {
	return {
		sourceShape: {
			screen: {
				screenCode: "SCR-001",
				route: "/sample",
				regions: [
					{
						children: [
							{
								sourceAreaId: "area-1",
								children: [{ sourceId: "field-1", componentType, props: {} }],
							},
						],
					},
				],
			},
		},
	} as unknown as SourceSpec;
}

function runRule(sourceSpec: SourceSpec, artifact: unknown) {
	const issues: Array<{ message: string }> = [];
	const ctx: RuleContext = {
		tree: artifact as Record<string, unknown>,
		artifact,
		sourceSpec,
		report: (issue) => issues.push(issue),
	};
	stateCoverageMissingRule.check(ctx);
	return issues;
}

describe("state-coverage-missing rule", () => {
	it("flags a stateful surface without any state coverage in the artifact", () => {
		const issues = runRule(buildSourceSpec("SearchInput"), {
			children: [{ type: "TitleMain", props: { title: "제목" } }],
		});
		expect(issues).toHaveLength(1);
	});

	it("accepts artifacts that expose state coverage", () => {
		const issues = runRule(buildSourceSpec("SearchInput"), {
			children: [{ type: "ActionButton", display: { stateRole: "loading" } }],
		});
		expect(issues).toHaveLength(0);
	});

	it("skips surfaces that imply no statefulness", () => {
		const issues = runRule(buildSourceSpec("TitleMain"), {
			children: [{ type: "TitleMain", props: { title: "제목" } }],
		});
		expect(issues).toHaveLength(0);
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run packages/validation/src/rules`
Expected: FAIL — `Cannot find module '../state-coverage-missing'`

- [ ] **Step 3: rule 파일 작성**

`packages/validation/src/rules/state-coverage-missing.ts` 생성 (기존 `validateStateCoverage` + `needsStateCoverage` 로직 그대로):

```ts
import type { SourceSpec } from "@cx/schema";
import { defineRule } from "./define-rule";
import { STATE_COVERAGE_TERMS, STATEFUL_SURFACE_TERMS } from "./source-spec";

export const stateCoverageMissingRule = defineRule({
	code: "state-coverage-missing",
	target: "render-tree",
	requires: ["sourceSpec"],
	check(ctx) {
		if (!ctx.sourceSpec || !needsStateCoverage(ctx.sourceSpec)) return;
		const generatedText = JSON.stringify(ctx.artifact).toLowerCase();
		const hasStateRole = STATE_COVERAGE_TERMS.some((term) =>
			generatedText.includes(term.toLowerCase()),
		);
		if (hasStateRole) return;

		ctx.report({
			message:
				"SourceSpec implies a stateful surface, but generated artifact does not expose loading, empty, error, disabled, or validation state coverage.",
			path: [],
		});
	},
});

function needsStateCoverage(sourceSpec: SourceSpec): boolean {
	const sourceText = JSON.stringify(sourceSpec).toLowerCase();
	return STATEFUL_SURFACE_TERMS.some((term) => sourceText.includes(term));
}
```

주의: 기존 코드는 `generatedText.includes(term)`에서 `stateRole` 같은 대소문자 혼합 term을 소문자화된 텍스트와 비교했다 — `"stateRole"`은 소문자화된 텍스트에 절대 매치되지 않는 잠복 버그다. 위 구현은 `term.toLowerCase()`로 비교해 이를 수정한다. 이 수정으로 기존 validators.test.ts가 실패하면 (테스트가 버그 동작에 의존하는 경우) 테스트의 기대값이 아닌 **이 수정을 유지**하고 해당 테스트 픽스처를 확인하라 — 단, "warns when stateful source surfaces have no state coverage" 테스트는 `loading` 같은 소문자 term 기준이라 영향이 없을 것으로 예상된다.

- [ ] **Step 4: index.ts 등록 + validators.ts 정리**

`QUALITY_RULES`에 `stateCoverageMissingRule` 추가 — 최종 형태:

```ts
import { bottomCtaStateUngatedRule } from "./bottom-cta-state-ungated";
import type { QualityRule } from "./define-rule";
import { singleSectionDividerRule } from "./single-section-divider";
import { sourcePropMismatchRule } from "./source-prop-mismatch";
import { sourceRefNotMaterializedRule } from "./source-ref-not-materialized";
import { stateCoverageMissingRule } from "./state-coverage-missing";

export type { QualityRule, RuleContext } from "./define-rule";
export { defineRule } from "./define-rule";

/** 등록된 품질 rule 전부. 새 rule은 여기 한 줄 추가로 등록된다. */
export const QUALITY_RULES: readonly QualityRule[] = [
	bottomCtaStateUngatedRule,
	singleSectionDividerRule,
	sourcePropMismatchRule,
	sourceRefNotMaterializedRule,
	stateCoverageMissingRule,
];
```

validators.ts에서 `validateStateCoverage(...)` 호출, `validateStateCoverage`·`needsStateCoverage` 함수 정의, 미사용이 된 `STATEFUL_SURFACE_TERMS`·`STATE_COVERAGE_TERMS` import를 삭제한다.

- [ ] **Step 5: 전체 테스트 통과 확인**

Run: `pnpm vitest run packages/validation`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add packages/validation/src/rules packages/validation/src/public/validators.ts
git commit -m "refactor(validation): state-coverage-missing을 rule 모듈로 분리, 대소문자 매칭 버그 수정

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: 드리프트 가드 테스트

**Files:**
- Modify: `packages/validation/src/__tests__/registry.test.ts`

- [ ] **Step 1: 드리프트 가드 테스트 추가**

`packages/validation/src/__tests__/registry.test.ts`에 다음 describe를 추가:

```ts
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { QUALITY_RULES } from "../rules/index";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REPO_ROOT = resolve(PACKAGE_ROOT, "../..");
const RULES_DIR = join(PACKAGE_ROOT, "src/rules");
const RULE_INFRA_FILES = new Set(["define-rule.ts", "helpers.ts", "index.ts", "source-spec.ts"]);

describe("registry ⇔ rules drift guard", () => {
	it("registers exactly the codes whose owners include 'rule'", () => {
		const ruleCodes = QUALITY_RULES.map((rule) => rule.code).sort();
		const registryRuleCodes = Object.entries(VALIDATION_CODE_REGISTRY)
			.filter(([, meta]) => meta.owners.includes("rule"))
			.map(([code]) => code)
			.sort();
		expect(ruleCodes).toEqual(registryRuleCodes);
	});

	it("keeps a 1:1 mapping between rule files and rule test files", () => {
		const ruleFiles = readdirSync(RULES_DIR)
			.filter((file) => file.endsWith(".ts") && !RULE_INFRA_FILES.has(file))
			.map((file) => file.replace(/\.ts$/, ""));
		expect(ruleFiles.length).toBe(QUALITY_RULES.length);
		for (const ruleFile of ruleFiles) {
			const testPath = join(RULES_DIR, "__tests__", `${ruleFile}.test.ts`);
			expect(existsSync(testPath), `missing test for rule: ${ruleFile}`).toBe(true);
		}
	});

	it("names rule files after their codes", () => {
		const ruleFiles = new Set(
			readdirSync(RULES_DIR)
				.filter((file) => file.endsWith(".ts") && !RULE_INFRA_FILES.has(file))
				.map((file) => file.replace(/\.ts$/, "")),
		);
		for (const rule of QUALITY_RULES) {
			expect(ruleFiles.has(rule.code), `rule file for code: ${rule.code}`).toBe(true);
		}
	});

	it("points docRefs at files that exist", () => {
		for (const [code, meta] of Object.entries(VALIDATION_CODE_REGISTRY)) {
			if (!meta.docRef) continue;
			expect(existsSync(join(REPO_ROOT, meta.docRef)), `${code}.docRef: ${meta.docRef}`).toBe(
				true,
			);
		}
	});
});
```

(기존 import 줄의 `VALIDATION_CODE_REGISTRY`는 이미 있다. `describe`/`expect`/`it`도 기존 import 사용.)

- [ ] **Step 2: 테스트 통과 확인**

Run: `pnpm vitest run packages/validation/src/__tests__/registry.test.ts`
Expected: PASS — 6개 테스트 (완전성 2 + 드리프트 가드 4)

주의: `REPO_ROOT` 계산은 워크트리 루트 기준 `packages/validation`에서 두 단계 상위다. docRef 테스트가 실패하면 경로 계산을 먼저 의심하라 (`packages/agent/docs/skills/generate-skills/divider-usage-rules/README.md`는 이 워크트리에 존재한다).

- [ ] **Step 3: 커밋**

```bash
git add packages/validation/src/__tests__/registry.test.ts
git commit -m "test(validation): registry-rules-테스트 1:1 대응 드리프트 가드 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: 공개 API export + 마무리 검증

**Files:**
- Modify: `packages/validation/src/index.ts`
- Modify: `packages/validation/src/__tests__/public-api.test.ts` (export 계약 테스트가 있다면)

- [ ] **Step 1: index.ts에 registry export 추가**

`packages/validation/src/index.ts` 첫 export 위에 추가:

```ts
export {
	getValidationCodeMeta,
	VALIDATION_CODE_REGISTRY,
} from "./public/registry";
export type { ValidationCodeMeta, ValidationLayer } from "./public/registry";
```

기존 `export type { ... } from "./public/types"` 블록은 그대로 둔다 (`ValidationIssueCode`·`ValidationSeverity`는 types.ts가 재수출하므로 변경 불필요).

- [ ] **Step 2: public-api 테스트 확인**

`packages/validation/src/__tests__/public-api.test.ts`를 열어 export 목록을 스냅샷/명시 검증하는 테스트가 있는지 확인한다. 있다면 새 export(`VALIDATION_CODE_REGISTRY`, `getValidationCodeMeta`)를 기대값에 추가한다. 없다면 이 단계는 건너뛴다.

- [ ] **Step 3: 전체 테스트 + lint**

Run: `pnpm test`
Expected: PASS — 455개 + 신규 테스트 전부 (validation 외 패키지가 `@cx/validation`을 소비하므로 전체 실행 필수)

Run: `pnpm lint`
Expected: PASS — biome + react-hooks 정책 + inference 경계 체크

lint가 import 정렬 등으로 실패하면 `pnpm format` 후 재실행.

- [ ] **Step 4: 지식 그래프 갱신**

Run: `graphify update .`
Expected: 그래프 갱신 완료 (AST-only)

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "refactor(validation): registry·rule 공개 API 노출 및 마무리 정리

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 마이그레이션하지 않는 것 (의도적 보류)

- **composition-plan rule들** (`unknown-source-ref`, composition-plan 쪽 `source-ref-not-materialized`): 엔진 소유로 유지. registry `owners`가 상태를 문서화하며, 나중에 `target: "composition-plan"` rule로 이동 가능 — `runQualityRules`가 이미 target 파라미터를 받으므로 추가 작업은 rule 파일 생성뿐이다.
- **component-proposal rule들** (`proposal-*`): 동일하게 엔진 소유 유지.
- **node 단위 품질 체크** (`internal-visible-title`, `list-text-dot-subtext-missing`): `validateNode` 단일 순회에 박혀 있어 분리 시 순회가 중복된다. registry에 `layer: "quality", owners: ["engine"]`으로 정직하게 기록.
- **docRef 미지정 코드들**: `single-section-divider`만 docRef를 가진다. 다른 rule의 근거 skill 문서가 생기면 registry 항목에 추가하면 된다 (드리프트 가드가 경로 존재를 검증).
