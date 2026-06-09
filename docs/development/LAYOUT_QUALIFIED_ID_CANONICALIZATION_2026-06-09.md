# Layout Qualified-ID Canonicalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@cx/layout`의 pattern store가 bare id(`field-stack`) 대신 qualified id(`layout.area.fieldStack`)를 단일 canonical key로 들고, 읽을 때마다 변환하던 `layoutPatternIdToPatternId` 사본을 전부 제거한다.

**Architecture:** catalog JSON의 id는 이미 qualified다. 현재 `schema.ts`가 로드 시점에 이를 bare로 깎아 store에 저장하고(`normalizeLayoutPatternCatalogEntry`), validator는 다시 qualified→bare로 변환해 조회한다. 이 down-transform을 제거해 store key를 qualified로 보존하고, 모든 소비자가 exact lookup만 하도록 만든다. alias 도입은 후순위이며, 정규화 경계(`canonicalizeLayoutId`)는 fuzzy 변환 없이 "이미 qualified이거나 명시적 alias" 둘만 처리하는 빈 stub seam으로만 둔다.

**Tech Stack:** TypeScript, Zod, Vitest, pnpm monorepo (no build step, src subpath exports).

---

## Context

이 변경이 필요한 이유:

- **이중 표현 + 중복 변환.** node가 들고 다니는 layout id(`layout.composite.componentButton`)와 store의 `pattern.id`(`component-button`)가 형태가 달라, 읽는 곳마다 `layoutPatternIdToPatternId` 정규식으로 변환한다. 이 함수는 **3곳에 중복**돼 있다: `schema.ts:308`(store 적재 시), `validators.ts:673`(검증 조회 시), 그리고 `refineUniqueCatalogPatternIds` 내부. resolve-on-read 안티패턴.
- **bare의 출생지.** `schema.ts:269 normalizeLayoutPatternCatalogEntry`가 qualified 소스를 bare로 깎으면서 동시에 `props`/`children`/`status`/`componentID`를 전부 버린다. store는 사실상 "이름 인덱스" 수준으로 degenerate.
- **죽은 골조.** layout↔component 매칭(`matcher.ts` + `resolver.ts`의 `resolveCompositePatternByComponentType`/`resolveCompositeLayoutByComponentType`)은 프로덕션 호출부가 0이다(스모크 테스트만 참조). 이들이 유일하게 component alias signal과 `PatternResolutionSignals`(resolution)를 소비하는데, catalog JSON에는 `resolution` 필드가 아예 없다 → legacy 잔재.

확인된 사실(grounding):

- catalog JSON `id`는 전부 이미 `layout.<target>.<name>` qualified. JSON에 `resolution`/`variants` 없음.
- store `findPattern`을 layout id로 호출하는 **live 소비자는 `validators.ts` 하나뿐**. `getPatternPreset`(catalog.ts:84)과 screen→region resolver(resolver.ts:63~)는 프로덕션 호출부 0.
- **렌더러 경로는 무변경.** `resolve-layout.ts` → `@cx/layout/components` → `registry.ts:987 findRegisteredLayoutPatternComponentByLayoutId`는 `entry.layoutId === layoutId` exact 매치이고 registry는 이미 qualified 키(`layout.composite.componentButton`)를 쓴다.
- `normalizePatternId`(store.ts:114)는 호출부 0인 dead export.

의도한 결과: store/validator가 qualified exact lookup만 하고, 변환 함수 3사본·죽은 matcher·resolution 체인이 사라지며, 향후 register/write-back 경계가 부를 수 있는 `canonicalizeLayoutId` seam이 생긴다.

---

## File Structure

| 파일 | 책임 | 변경 |
|---|---|---|
| `packages/layout/src/pattern-internal/matcher.ts` | component alias signal 매칭(죽은 코드만 소비) | **삭제** |
| `packages/layout/src/public/resolver.ts` | 패턴 resolve. `*-ByComponentType` 2개는 죽은 코드 | 죽은 함수 2개 + import 정리 |
| `packages/layout/src/public/pattern-types.ts` | 레이아웃 타입 SSOT | `PatternStorePattern` 캐논화, resolution 체인 제거, contract 필드 추가 |
| `packages/layout/src/pattern-internal/schema.ts` | catalog→store 적재/검증 스키마 | down-transform 제거, id 스키마 qualified화, resolution 스키마 제거, contract 보존 |
| `packages/layout/src/pattern-internal/store.ts` | store 적재/조회 | resolution 재export 제거, `normalizePatternId` 삭제 |
| `packages/validation/src/public/validators.ts` | 레이아웃 id 검증 | 변환 제거, `findPattern` 직접 호출 |
| `packages/layout/src/canonical/canonicalize-layout.ts` | 정규화 경계(write-back에서 호출) | **신규** |
| `packages/layout/src/canonical/layout-alias.ts` | alias→canonical 맵(빈 stub) | **신규** |
| `packages/layout/package.json` | subpath exports | `./canonical` 추가 |
| `packages/layout/src/__tests__/layout-public-api.test.ts` | 공개 API 계약 | bare 기대값 → qualified, 죽은 export 참조 제거 |

작업 순서: 죽은 코드 제거(Task 1) → qualified 단일키(Task 2) → 정규화 seam(Task 3) → store contract 보존(Task 4). 각 Task = 1 commit, 독립적으로 green.

---

## 실행 범위 결정 (2026-06-09): B — 옆 세션 충돌 회피

병행 세션(`spec/external-component-ssot`, plan `docs/superpowers/plans/2026-06-09-external-component-ssot.md`)이 `@cx/external` 마이그레이션 + 컴포넌트 alias 제거를 진행 중이며, write-back chokepoint(`canonicalizeRenderTree`)로 `node.type`을 캐논화한다. 충돌 분석 결과:

- **Task 1 — 보류.** `matcher.ts`가 그쪽 D2와 modify(그쪽)/delete(여기) 하드 충돌. 그쪽 D2가 matcher hunk를 드롭하도록 조율되거나 그쪽이 랜드한 뒤 진행.
- **Task 2 — 보류.** `validators.ts`가 그쪽 D3와 같은 파일(다른 함수, 머지 마찰). 또한 tolerance 제거는 `node.layout`이 write-back에서 qualified로 보장될 때 안전 → 그쪽 `canonicalizeRenderTree`가 `node.layout`까지 캐논화하도록 확장된 뒤 진행.
- **Task 3 — 진행.** 신규 파일만, 충돌 0. 단 실제 호출자는 그쪽 `canonicalizeRenderTree`이므로 호출부 없는 순수 유틸로 먼저 둔다(그쪽이 wire).
- **Task 4 — 진행.** `pattern-types.ts`/`schema.ts`만 수정 — 그쪽 layout 작업(matcher/divider/layout-catalog.test/package.json)과 무겹침. 단 Task 2 보류 중이라 store는 아직 bare 키 → Task 4 테스트는 현재 bare 키로 조회한다.

**지금 실행: Task 3 → Task 4 (서브에이전트, 메인 리뷰).**

---

## Task 1: 죽은 component-type matcher + resolution 골조 제거 — ⏸ 보류

> **보류 (2026-06-09):** `matcher.ts`가 옆 세션 D2와 하드 충돌. 조율/랜드 후 진행. 아래는 원안.

순수 삭제(동작 보존). 프로덕션 호출부가 없는 코드만 제거해 베이스를 정리한다.

**Files:**
- Delete: `packages/layout/src/pattern-internal/matcher.ts`
- Modify: `packages/layout/src/public/resolver.ts`
- Modify: `packages/layout/src/public/pattern-types.ts`
- Modify: `packages/layout/src/pattern-internal/store.ts`
- Modify: `packages/layout/src/pattern-internal/schema.ts`
- Modify: `packages/layout/src/__tests__/layout-public-api.test.ts`

- [ ] **Step 1: 죽은 코드에 호출부가 정말 없는지 재확인**

Run:
```bash
cd /Users/plusx/Documents/rnd-screen-generator/.claude/worktrees/render-registry
grep -rn "resolveCompositePatternByComponentType\|resolveCompositeLayoutByComponentType\|componentSignals\|scorePatternSignals\|normalizePatternId" packages/ | grep -v "\.test\." | grep -vE "public/resolver.ts|pattern-internal/matcher.ts|store.ts:114"
```
Expected: 빈 출력(테스트와 정의 자신 외 호출부 없음).

- [ ] **Step 2: `layout-public-api.test.ts`에서 죽은 export 참조 교체**

`packages/layout/src/__tests__/layout-public-api.test.ts:11` 의 import를 살아있는 resolver export로 교체:
```ts
// 변경 전
import { resolveCompositePatternByComponentType } from "@cx/layout/resolver";
// 변경 후
import { resolveRegionPatternFromScreenPattern } from "@cx/layout/resolver";
```
`:20` 의 assertion 교체:
```ts
// 변경 전
expect(resolveCompositePatternByComponentType).toBeTypeOf("function");
// 변경 후
expect(resolveRegionPatternFromScreenPattern).toBeTypeOf("function");
```

- [ ] **Step 3: `matcher.ts` 삭제**

Run:
```bash
git rm packages/layout/src/pattern-internal/matcher.ts
```

- [ ] **Step 4: `resolver.ts`에서 죽은 함수 2개 + import 정리**

`packages/layout/src/public/resolver.ts` 상단 import 수정:
```ts
// 변경 전
import { componentSignals, scorePatternSignals } from "../pattern-internal/matcher";
import { findPattern, listPatterns } from "../pattern-internal/store";
// 변경 후 (matcher import 줄 삭제, listPatterns 제거)
import { findPattern } from "../pattern-internal/store";
```
다음 두 함수 전체 삭제(현재 43~61행):
```ts
export function resolveCompositePatternByComponentType(type: string): DatabasePatternRef | undefined { /* ... */ }
export function resolveCompositeLayoutByComponentType(type: string): string | undefined { /* ... */ }
```
`resolveContentsRegionPatternFromScreenPattern` 이하 함수들은 **유지**한다(`DatabasePatternRef`, `findPattern` import는 계속 쓰임).

- [ ] **Step 5: `pattern-types.ts`에서 resolution 타입 체인 제거**

`packages/layout/src/public/pattern-types.ts`:
- `SetMatcher`(현재 51~55행) 삭제
- `PatternResolutionSignals`(현재 57~64행) 삭제
- `PatternStorePattern`(현재 118행)에서 `resolution?: PatternResolutionSignals;` 줄 삭제

- [ ] **Step 6: `store.ts`에서 resolution 재export + `normalizePatternId` 제거**

`packages/layout/src/pattern-internal/store.ts`:
- import 블록(9행)과 re-export 블록(29행)에서 `PatternResolutionSignals,` 줄 삭제
- `normalizePatternId` 함수(현재 114~120행) 전체 삭제

- [ ] **Step 7: `schema.ts`에서 resolution 스키마 제거**

`packages/layout/src/pattern-internal/schema.ts`:
- import(12행)·re-export(31행)에서 `PatternResolutionSignals,` 삭제
- `setMatcherSchema`(현재 163~172행) 삭제
- `resolutionSchema`(현재 174~185행) 삭제
- `baseFields`(현재 188행)에서 `resolution: resolutionSchema,` 줄 삭제

- [ ] **Step 8: 타입체크 + 테스트 green 확인**

Run:
```bash
pnpm vitest run packages/layout packages/validation
```
Expected: 전부 pass (Task 1은 동작 보존, 죽은 코드만 제거).

- [ ] **Step 9: 잔재 grep**

Run:
```bash
grep -rn "PatternResolutionSignals\|scorePatternSignals\|componentSignals\|normalizePatternId\|resolveCompositePatternByComponentType" packages/ | grep -v "\.test\."
```
Expected: 빈 출력.

- [ ] **Step 10: Commit**

```bash
git add packages/layout/src/public/resolver.ts packages/layout/src/public/pattern-types.ts packages/layout/src/pattern-internal/store.ts packages/layout/src/pattern-internal/schema.ts packages/layout/src/__tests__/layout-public-api.test.ts
git commit -m "$(cat <<'EOF'
refactor(layout): remove dead component-type matcher and resolution scaffolding

matcher.ts (componentSignals/scorePatternSignals) and resolver's
resolveComposite*ByComponentType have no production callers; they are the
only consumers of PatternResolutionSignals, which has no catalog source.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
graphify update .
```

---

## Task 2: pattern store id를 qualified 단일키로 보존 — ⏸ 보류

> **보류 (2026-06-09):** `validators.ts` 머지 마찰 + tolerance 제거가 옆 세션 write-back(`canonicalizeRenderTree`의 `node.layout` 캐논화 확장)에 의존. 그쪽 랜드 후 진행. 아래는 원안.

down-transform을 제거해 store key를 qualified로 유지하고, validator도 변환 없이 exact 조회한다.

**Files:**
- Modify: `packages/layout/src/pattern-internal/schema.ts`
- Modify: `packages/validation/src/public/validators.ts`
- Modify: `packages/layout/src/__tests__/layout-public-api.test.ts`

- [ ] **Step 1: store가 qualified로 키된다는 실패 테스트 추가**

`packages/layout/src/__tests__/layout-public-api.test.ts`의 `describe` 안에 추가:
```ts
	it("keys the pattern store by qualified layout id", () => {
		const pattern = findPattern("layout.area.listStack");
		expect(pattern?.id).toBe("layout.area.listStack");
		expect(findPattern("list-stack")).toBeUndefined();
	});
```
`findPattern`을 import에 추가(파일 상단 `@cx/layout/catalog` import 블록):
```ts
import {
	createCandidate,
	findPattern,
	getEntry,
	listCatalog,
	listCatalogIds,
	listPatterns,
	resolveLayoutCatalogForInference,
} from "@cx/layout/catalog";
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
pnpm vitest run packages/layout/src/__tests__/layout-public-api.test.ts
```
Expected: FAIL — `findPattern("layout.area.listStack")`가 현재 bare 키라 `undefined` 반환.

- [ ] **Step 3: `patternIdSchema`를 qualified regex로 변경**

`packages/layout/src/pattern-internal/schema.ts`(현재 56~59행):
```ts
// 변경 후
const patternIdSchema = z
	.string()
	.min(1)
	.regex(
		/^layout\.(screen|region|area|composite)\.[A-Za-z0-9][A-Za-z0-9.-]*$/,
		"pattern id must be a qualified layout id (layout.<target>.<name>)",
	);
```

- [ ] **Step 4: `normalizeLayoutPatternCatalogEntry`에서 down-transform 제거**

`packages/layout/src/pattern-internal/schema.ts`(현재 269~284행):
```ts
function normalizeLayoutPatternCatalogEntry(
	pattern: z.infer<typeof layoutPatternCatalogEntrySchema>,
): Pattern {
	return {
		id: pattern.id,
		target: pattern.target,
		name: pattern.name,
		description: pattern.description,
		defaultVariant: "default",
		variants: {
			default: {},
		},
	} as Pattern;
}
```

- [ ] **Step 5: `refineUniqueCatalogPatternIds`를 qualified 직접 dedup으로 변경 + `layoutPatternIdToPatternId` 삭제**

`packages/layout/src/pattern-internal/schema.ts`(현재 286~306행) 내부 id 산출부:
```ts
// 변경 전
		const id = pattern.id?.startsWith("layout.")
			? layoutPatternIdToPatternId(pattern.id)
			: pattern.id;
// 변경 후
		const id = pattern.id;
```
그리고 `layoutPatternIdToPatternId` 함수(현재 308~313행) 전체 삭제.

- [ ] **Step 6: `validators.ts`의 변환 제거**

`packages/validation/src/public/validators.ts`(현재 669~678행):
```ts
// 변경 후
function findLayoutPatternComponentByLayoutId(layoutId: string) {
	return findPattern(layoutId);
}
```
그리고 `layoutPatternIdToPatternId`(현재 673~678행) 함수 삭제.

- [ ] **Step 7: 공개 API 테스트의 bare 기대값을 qualified로 갱신**

`packages/layout/src/__tests__/layout-public-api.test.ts`:
- `createLayoutPattern` 입력 id(현재 24행): `id: "api-test-area"` → `id: "layout.area.apiTestArea"`
- `createCandidate` 결과 기대(현재 59행): `expect(created.pattern?.id).toBe("generated-facade-list");` → `expect(created.pattern?.id).toBe("layout.area.generatedFacadeList");`

- [ ] **Step 8: 전체 레이아웃/검증 테스트 + bare-id 잔여 검사**

Run:
```bash
pnpm vitest run packages/layout packages/validation
```
Expected: 전부 pass. 만약 mutations 등 다른 테스트가 bare id 리터럴로 패턴을 구성해 실패하면, 그 입력 id를 `layout.<target>.<name>` 형태로 갱신(qualified만 허용하는 게 의도된 새 정책).

- [ ] **Step 9: 변환 사본 전멸 확인**

Run:
```bash
grep -rn "layoutPatternIdToPatternId" packages/
```
Expected: 빈 출력.

- [ ] **Step 10: Commit**

```bash
git add packages/layout/src/pattern-internal/schema.ts packages/validation/src/public/validators.ts packages/layout/src/__tests__/layout-public-api.test.ts
git commit -m "$(cat <<'EOF'
refactor(layout): key pattern store by qualified layout id

Catalog ids are already qualified (layout.<target>.<name>); stop baking
them down to bare at load and stop converting on read. findPattern and the
validator now do exact qualified lookup, removing all three copies of
layoutPatternIdToPatternId.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
graphify update .
```

---

## Task 3: 정규화 경계(`canonicalizeLayoutId`) seam 추가

write-back/register 경계가 호출할 단일 정규화 함수. fuzzy 변환 없음. alias는 빈 stub이며 하류 import 금지.

**Files:**
- Create: `packages/layout/src/canonical/layout-alias.ts`
- Create: `packages/layout/src/canonical/canonicalize-layout.ts`
- Create: `packages/layout/src/canonical/__tests__/canonicalize-layout.test.ts`
- Modify: `packages/layout/package.json`

- [ ] **Step 1: 실패 테스트 작성**

Create `packages/layout/src/canonical/__tests__/canonicalize-layout.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { canonicalizeLayoutId } from "../canonicalize-layout";

describe("canonicalizeLayoutId", () => {
	it("passes an already-qualified id through unchanged", () => {
		expect(canonicalizeLayoutId("layout.area.fieldStack")).toBe("layout.area.fieldStack");
	});

	it("returns undefined for a bare id with no alias entry", () => {
		expect(canonicalizeLayoutId("field-stack")).toBeUndefined();
	});

	it("does not fuzzy-convert (no prefix strip, no kebab folding)", () => {
		expect(canonicalizeLayoutId("fieldStack")).toBeUndefined();
		expect(canonicalizeLayoutId("layout.area.field-stack")).toBe("layout.area.field-stack");
	});
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
pnpm vitest run packages/layout/src/canonical/__tests__/canonicalize-layout.test.ts
```
Expected: FAIL — `canonicalize-layout` 모듈 없음.

- [ ] **Step 3: alias stub 작성**

Create `packages/layout/src/canonical/layout-alias.ts`:
```ts
// alias → canonical qualified layout id.
// 의도적으로 비어 있다. bare/nickname 입력이 실제로 필요하다는 증거가 생기면 여기에만 추가한다.
// 하류(resolver / store / validator / renderer)에서 import 금지. 사용처는 parse/register/write-back 경계뿐이다.
export const layoutAliasIndex: Record<string, string> = {};
```

- [ ] **Step 4: `canonicalizeLayoutId` 작성**

Create `packages/layout/src/canonical/canonicalize-layout.ts`:
```ts
import { layoutAliasIndex } from "./layout-alias";

const QUALIFIED_LAYOUT_ID = /^layout\.(screen|region|area|composite)\.[A-Za-z0-9][A-Za-z0-9.-]*$/;

/**
 * 입력 layout id를 canonical qualified id로 확정한다. write-back/register 경계에서 한 번만 호출.
 * 이미 qualified면 그대로, 명시적 alias면 매핑값, 그 외에는 undefined(경계에서 invalid 처리).
 * camel→kebab, prefix strip 같은 fuzzy 변환은 하지 않는다 — resolve-on-read 안티패턴 방지.
 */
export function canonicalizeLayoutId(raw: string): string | undefined {
	if (QUALIFIED_LAYOUT_ID.test(raw)) return raw;
	return layoutAliasIndex[raw];
}
```

- [ ] **Step 5: `package.json`에 subpath export 추가**

`packages/layout/package.json`의 `exports`에 추가(`./components` 줄 옆):
```json
		"./canonical": "./src/canonical/canonicalize-layout.ts",
```

- [ ] **Step 6: 테스트 green 확인**

Run:
```bash
pnpm vitest run packages/layout/src/canonical/__tests__/canonicalize-layout.test.ts
```
Expected: 3 passed.

- [ ] **Step 7: 하류가 alias를 import하지 않는지 확인**

Run:
```bash
grep -rn "layout-alias\|layoutAliasIndex" packages/ | grep -v "canonical/"
```
Expected: 빈 출력.

- [ ] **Step 8: Commit**

```bash
git add packages/layout/src/canonical packages/layout/package.json
git commit -m "$(cat <<'EOF'
feat(layout): add canonicalizeLayoutId boundary seam

Single normalization chokepoint for the write-back/register boundary.
No fuzzy conversion: already-qualified passes through, explicit alias maps,
everything else is undefined. layout-alias.ts is an empty stub and must not
be imported downstream.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
graphify update .
```

---

## Task 4: store에 prop contract / status / componentID 보존

Canonical Registry 본체 — 로드 시 버리던 계약/상태/componentID를 store에 유지한다. 모두 optional로 추가해 기존 mutation 입력을 깨지 않는다.

**Files:**
- Modify: `packages/layout/src/public/pattern-types.ts`
- Modify: `packages/layout/src/pattern-internal/schema.ts`
- Modify: `packages/layout/src/__tests__/layout-public-api.test.ts`

- [ ] **Step 1: store가 props/status를 보존한다는 실패 테스트 추가**

`packages/layout/src/__tests__/layout-public-api.test.ts`의 `describe` 안에 추가. `findPattern`을 `@cx/layout/catalog` import에 추가해야 한다.
```ts
	it("preserves prop contract and status on the canonical store entry", () => {
		// Task 2 보류 중이라 store는 아직 bare 키. Task 2 랜드 후 "layout.area.accordionList"로 교체.
		const pattern = findPattern("accordion-list");
		expect(pattern?.status).toBeDefined();
		expect(pattern?.componentID).toBeDefined();
		expect(pattern?.props?.divider?.type).toBe("enum");
	});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
pnpm vitest run packages/layout/src/__tests__/layout-public-api.test.ts
```
Expected: FAIL — 현재 normalize가 `props`/`status`/`componentID`를 버려 `undefined`.

- [ ] **Step 3: `PatternStorePattern` 타입에 optional 계약 필드 추가**

`packages/layout/src/public/pattern-types.ts`의 `PatternStorePattern`(현재 118행):
```ts
export type PatternStorePattern = {
	id: string;
	target: PatternStoreTarget;
	name: string;
	description?: string;
	componentID?: string;
	status?: LayoutPatternStatus;
	props?: Record<string, LayoutPatternPropContract>;
	children?: LayoutPatternChildrenContract;
	defaultVariant: string;
	variants: Record<string, ChildrenLayoutPreset>;
};
```
(`LayoutPatternStatus`, `LayoutPatternPropContract`, `LayoutPatternChildrenContract`는 같은 파일에 이미 정의돼 있음.)

- [ ] **Step 4: `baseFields` 스키마에 optional 계약 필드 추가**

`packages/layout/src/pattern-internal/schema.ts`의 `baseFields`(현재 188행):
```ts
const baseFields = {
	id: patternIdSchema,
	name: z.string().min(1),
	description: z.string().optional(),
	componentID: z.string().min(1).optional(),
	status: z.enum(["deprecated", "draft", "ready"]).optional(),
	props: z.record(z.string(), layoutPatternPropContractSchema).optional(),
	children: layoutPatternChildrenContractSchema.optional(),
	defaultVariant: variantIdSchema,
};
```
(`layoutPatternPropContractSchema`, `layoutPatternChildrenContractSchema`는 같은 파일에 이미 정의돼 있음.)

- [ ] **Step 5: `normalizeLayoutPatternCatalogEntry`에서 계약 필드 carry**

`packages/layout/src/pattern-internal/schema.ts`의 normalize 함수:
```ts
function normalizeLayoutPatternCatalogEntry(
	pattern: z.infer<typeof layoutPatternCatalogEntrySchema>,
): Pattern {
	return {
		id: pattern.id,
		target: pattern.target,
		name: pattern.name,
		description: pattern.description,
		componentID: pattern.componentID,
		status: pattern.status,
		props: pattern.props,
		children: pattern.children,
		defaultVariant: "default",
		variants: {
			default: {},
		},
	} as Pattern;
}
```

- [ ] **Step 6: 테스트 green 확인**

Run:
```bash
pnpm vitest run packages/layout packages/validation
```
Expected: 전부 pass.

- [ ] **Step 7: Commit**

```bash
git add packages/layout/src/public/pattern-types.ts packages/layout/src/pattern-internal/schema.ts packages/layout/src/__tests__/layout-public-api.test.ts
git commit -m "$(cat <<'EOF'
feat(layout): preserve prop contract, status, componentID on store entries

normalizeLayoutPatternCatalogEntry no longer discards the prop contract,
status, and componentID at load. The canonical store now carries the
normalization surface (type + contract + status), matching the component-side
Canonical Registry scope. Fields are optional to keep mutation inputs valid.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
graphify update .
```

---

## Verification (end-to-end)

- [ ] **전체 워크스페이스 테스트**

Run:
```bash
pnpm vitest run packages/layout packages/validation packages/renderer
```
Expected: 전부 pass. 렌더러는 무변경이므로 회귀 없어야 함(qualified registry 경로 그대로).

- [ ] **변환/죽은 코드 전멸 확인**

Run:
```bash
grep -rn "layoutPatternIdToPatternId\|PatternResolutionSignals\|componentSignals\|normalizePatternId" packages/ | grep -v "\.test\."
```
Expected: 빈 출력.

- [ ] **qualified round-trip 수동 확인**

`findPattern("layout.area.listStack")?.id === "layout.area.listStack"` 이고 `findPattern("list-stack")`는 `undefined`. validator가 node의 qualified layout id를 변환 없이 통과시키는지(`pnpm vitest run packages/validation` green).

- [ ] **lint**

Run:
```bash
pnpm biome check packages/layout/src packages/validation/src/public/validators.ts
```
Expected: 통과(또는 자동 수정 후 통과).

## 범위 밖 (이번 변경 안 함)

- **alias 맵 채우기.** `layout-alias.ts`는 빈 stub으로만 둔다. 실제 bare/nickname 입력 소스가 확인되면 별도 작업.
- **변종/preset 데이터 store 반영.** normalize가 `variants:{default:{}}` 스텁을 유지하는 degenerate 상태는 그대로 둔다(별개 문제, screen→region resolver의 fallback 동작 보존).
- **컴포넌트 측 Register/Canonical Registry 경계.** 병행 진행 중인 별도 작업. `canonicalizeLayoutId`는 그 경계가 호출할 seam만 제공한다.
