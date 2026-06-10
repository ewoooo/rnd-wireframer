# `@cx/external` 컴포넌트 SSOT 승격 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@cx/external`(vendored kiki)을 컴포넌트 SSOT로 승격하고 `@cx/components`의 resolver를 이식한 뒤 `@cx/components`를 삭제한다.

**Architecture:** 카탈로그 contract 타입은 `@cx/schema`로 편입한다. `@cx/external`은 5-파일 lookup 표면을 제공한다: `catalog.generated.ts`(자동생성 데이터) + `registry.generated.ts`(renderer-private 컴포넌트 표면) + `catalog.alias.ts`(손저작 alias→canonical) + `canonicalize-catalog.ts`(alias 무결성 검증 + `canonicalizeNodeType`/`canonicalizeRenderTree` write-back helper) + `resolver.ts`(외부 소비자 데이터 lookup, source→status 유도). type 네임스페이스는 `kiki.X`로 일관 유지하고, `kiki.X`→React export(`X`) 변환은 renderer의 컴포넌트 조회 경계 한 곳에서 접두사 strip 단일 규칙으로 처리한다. **alias 캐논화는 persist 경계(write-back)에서 1회 적용** — 생성 파이프라인에 깔끔한 Register 단계가 없으므로(LLM이 node.type을 직접 생성), render-tree가 DB로 굳는 지점에서 트리를 canonical로 치환한다. 그 결과 DB-load 트리만 보는 하류(renderer/matcher/validator)는 canonical만 보며 alias 처리 코드를 전부 삭제한다. 모든 소비자는 import를 재배선한다.

**Tech Stack:** pnpm workspace(글롭 `packages/*`), TypeScript(moduleResolution: Bundler, noEmit), Vitest, React 19, Next.js.

**Spec:** `docs/superpowers/specs/2026-06-09-external-component-ssot-design.md`

**Scope 제외(후속 계획):** `promote-component.ts`의 sync-레이어(draft→barrel) 재작성은 `scripts/sync-catalog` 생성기가 repo에 들어온 뒤에야 구체화 가능하므로 이 계획에서 제외한다. 이 계획에서는 promote-component.ts를 read-only로 중립화만 한다.

---

## File Structure

생성:
- `packages/schema/src/component-catalog.ts` — 카탈로그 contract 타입 SSOT
- `packages/schema/src/__tests__/component-catalog.test.ts` — contract 타입 shape 테스트
- `packages/external/**` — Desktop의 `@cx/external` 패키지 land(복사)
- `packages/external/src/resolver.ts` — 외부 소비자 데이터 lookup API(alias 제거, getComponentPropContract 드롭)
- `packages/external/src/puck.ts` — 이식된 puck 표면
- `packages/external/src/catalog.alias.ts` — 손저작 alias→canonical 맵
- `packages/external/src/canonicalize-catalog.ts` — alias 무결성 검증 + `canonicalizeNodeType`/`canonicalizeRenderTree`
- `packages/external/src/__tests__/canonicalize-catalog.test.ts` — alias 무결성 + write-back 테스트
- `packages/external/src/__tests__/resolver.test.ts` — resolver 테스트
- `scripts/migrate-canonicalize-node-types.ts` — 기존 DB rows 1회성 canonical write-back(dry-run 지원)

수정:
- `packages/schema/src/index.ts` — 새 contract 타입 재노출, `ComponentCatalogData.entries` 타입드화
- `packages/schema/src/inference-reference.ts` — `ComponentCatalogData.entries: ComponentCatalogEntry[]`
- `packages/external/package.json` — dep `@cx/types`→`@cx/schema`, exports에 `./resolver`·`./puck`·`./canonicalize` 추가, `./catalog`→`catalog.generated.ts`
- `packages/external/src/catalog.ts` → `catalog.generated.ts`로 리네임 + import `@cx/types/component-catalog`→`@cx/schema`
- `apps/web/src/app/api/inference/[jobId]/apply/route.ts` — render-tree.json 읽은 직후 `canonicalizeRenderTree` 적용(write-back chokepoint)
- `apps/web/src/lib/screen-db-save.ts` — `saveScreenTreeOrder` projecting 전 `canonicalizeRenderTree` 적용(방어적 write-back)
- `packages/renderer/src/adapters/resolve-component.tsx` — 재배선 + 접두사 strip 규칙 + alias fallback 삭제
- `packages/renderer/src/adapters/build-component-props.ts` — 재배선
- `packages/layout/src/pattern-internal/matcher.ts` — 재배선 + **alias/kind 신호 루프 삭제**
- `packages/layout/src/components/patterns/shared/divider.tsx` — 재배선
- `packages/layout/src/__tests__/layout-catalog.test.ts` — 재배선 + alias/kind 단언 삭제
- `packages/validation/src/public/validators.ts` — 재배선(타입→schema) + **alias 역해석 삭제**
- `packages/validation/src/__tests__/validators.test.ts` — 재배선
- `packages/inference/src/knowledge/knowledge-base.ts` — 재배선
- `packages/inference/src/functions/deterministic-validation.ts` — 재배선
- `packages/inference/src/__tests__/knowledge-base.test.ts` — owner 문자열 변경
- `apps/web/src/lib/workbench-puck/puck-scope.ts` — 재배선
- `apps/web/src/lib/workbench-puck/puck-fields.ts` — 재배선
- `apps/web/next.config.ts` — transpilePackages 교체
- `scripts/promote-component.ts` — read-only 중립화 재배선
- 각 패키지 `package.json` + 루트 `package.json` — workspace dep `@cx/components`→`@cx/external`
- `tsconfig.json` — `exclude`에 vendored 컴포넌트 추가

삭제:
- `packages/component/**`

---

## Phase A — `@cx/schema` 카탈로그 contract

### Task A1: `@cx/schema`에 카탈로그 contract 타입 추가

**Files:**
- Create: `packages/schema/src/component-catalog.ts`
- Test: `packages/schema/src/__tests__/component-catalog.test.ts`
- Modify: `packages/schema/src/index.ts`, `packages/schema/src/inference-reference.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`packages/schema/src/__tests__/component-catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type {
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentCatalogSource,
	ComponentCatalogStatus,
	ComponentPropContract,
} from "../index";
import { isTokenRole } from "../index";

describe("component-catalog contract", () => {
	it("kiki source union을 받아들이고 엔트리 shape이 성립한다", () => {
		const source: ComponentCatalogSource = "kiki-barrel";
		const prop: ComponentPropContract = { type: "enum", role: "styleVariant", values: ["a"], required: false };
		const entry: ComponentCatalogEntry = {
			type: "kiki.AppBar",
			source,
			label: "[kiki] AppBar",
			version: "0.0.0",
			props: { variant: prop },
		};
		const catalog: ComponentCatalog = { [entry.type]: entry };
		expect(catalog["kiki.AppBar"]?.source).toBe("kiki-barrel");
	});

	it("status는 stable|candidate 두 값", () => {
		const stable: ComponentCatalogStatus = "stable";
		const candidate: ComponentCatalogStatus = "candidate";
		expect([stable, candidate]).toEqual(["stable", "candidate"]);
	});

	it("isTokenRole가 재노출된다", () => {
		expect(isTokenRole("spacing")).toBe(true);
		expect(isTokenRole("nope")).toBe(false);
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run packages/schema/src/__tests__/component-catalog.test.ts`
Expected: FAIL — `../index`에서 `ComponentCatalog`/`ComponentCatalogEntry` 등 export 없음(타입 해석 실패 또는 import 에러).

- [ ] **Step 3: contract 파일 작성**

`packages/schema/src/component-catalog.ts` (구 `@cx/components/public/types.ts`에서 이식, `usage`·`aliases` 제거, `source` union 교체, `label` 추가):

```ts
export const TOKEN_ROLES = [
	"spacing", "radius", "elevation",
	"size.icon", "size.avatar",
	"color.surface", "color.surface.brand", "color.surface.inverse",
	"color.surface.elevated", "color.surface.muted",
	"color.text", "color.text.brand", "color.text.inverse",
	"color.text.muted", "color.text.error",
	"color.border", "color.border.subtle", "color.border.strong",
	"color.icon", "color.icon.brand", "color.icon.muted",
	"typography.title", "typography.subtitle", "typography.body",
	"typography.caption", "typography.label",
	"motion.duration", "motion.easing",
] as const;

export type TokenRole = (typeof TOKEN_ROLES)[number];
export type TokenSlot = "surface" | "text" | "border" | "icon" | "shadow";

const TOKEN_ROLE_SET: ReadonlySet<string> = new Set(TOKEN_ROLES);

export function isTokenRole(value: string): value is TokenRole {
	return TOKEN_ROLE_SET.has(value);
}

export type ComponentPropType = "array" | "boolean" | "enum" | "node" | "number" | "string";

export type ComponentPropRole =
	| "content" | "data" | "description" | "event" | "label" | "layout"
	| "slot" | "state" | "styleVariant" | "title" | "value" | "visibility";

export interface ComponentPropContract {
	type: ComponentPropType;
	role?: ComponentPropRole;
	required?: boolean;
	values?: readonly string[];
	defaultValue?: unknown;
	description?: string;
	aiWritable?: boolean;
	tokenRole?: TokenRole;
	variantTokens?: Record<string, Partial<Record<TokenSlot, TokenRole>>>;
}

export type RenderTreeNodeKind = string;

/** kiki barrel(공식 export, stable) | kiki draft(WIP, candidate) */
export type ComponentCatalogSource = "kiki-barrel" | "kiki-draft";

export interface ComponentCatalogEntry {
	type: string;
	source: ComponentCatalogSource;
	label: string;
	version: string;
	description?: string;
	kind?: RenderTreeNodeKind;
	props: Record<string, ComponentPropContract>;
	tokens?: Partial<Record<TokenSlot, TokenRole>>;
}

export type ComponentCatalog = Record<string, ComponentCatalogEntry>;

export type ComponentCatalogStatus = "stable" | "candidate";
```

- [ ] **Step 4: index.ts에서 재노출 + entries 타입드화**

`packages/schema/src/index.ts`에 추가(알파벳 위치 무관, 기존 export 그룹 아래 한 블록):

```ts
export type {
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentCatalogSource,
	ComponentCatalogStatus,
	ComponentPropContract,
	ComponentPropRole,
	ComponentPropType,
	RenderTreeNodeKind,
	TokenRole,
	TokenSlot,
} from "./component-catalog";
export { isTokenRole, TOKEN_ROLES } from "./component-catalog";
```

`packages/schema/src/inference-reference.ts`의 `ComponentCatalogData`를 타입드화 — 파일 상단에 import 추가하고 entries 타입 변경:

```ts
// 파일 상단 import 블록에 추가
import type { ComponentCatalogEntry } from "./component-catalog";
```

```ts
// 기존
export type ComponentCatalogData = {
	entries: unknown[];
};
// 변경
export type ComponentCatalogData = {
	entries: ComponentCatalogEntry[];
};
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm vitest run packages/schema/src/__tests__/component-catalog.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: schema 타입체크**

Run: `pnpm -F @cx/schema exec tsc --noEmit` (스크립트 없으면 `pnpm exec tsc --noEmit -p packages/schema`가 아니라 루트 `pnpm exec tsc --noEmit`로 대체)
Expected: 0 errors (단, 이 시점엔 다른 패키지가 아직 @cx/components를 참조하므로 루트 tsc는 실패할 수 있음 → schema 단위 또는 해당 테스트 통과로 갈음)

- [ ] **Step 7: 커밋**

```bash
git add packages/schema/src/component-catalog.ts packages/schema/src/__tests__/component-catalog.test.ts packages/schema/src/index.ts packages/schema/src/inference-reference.ts
git commit -m "feat(schema): 컴포넌트 카탈로그 contract 타입 편입 (kiki source union)"
```

---

## Phase B — `@cx/external` Land

### Task B1: 패키지 복사 + 의존/exports 배선

**Files:**
- Create: `packages/external/**` (복사)
- Modify: `packages/external/package.json`, `packages/external/src/catalog.generated.ts`(리네임), `tsconfig.json`, `apps/web/next.config.ts`

- [ ] **Step 1: Desktop 패키지를 packages/external로 복사**

Run:
```bash
mkdir -p packages/external
cp -R /Users/plusx/Desktop/component-v2/src packages/external/src
cp /Users/plusx/Desktop/component-v2/package.json packages/external/package.json
cp /Users/plusx/Desktop/component-v2/external.lock.json packages/external/external.lock.json
cp /Users/plusx/Desktop/component-v2/KIKI-SHIM.md packages/external/KIKI-SHIM.md
git -C packages/external mv src/catalog.ts src/catalog.generated.ts 2>/dev/null || mv packages/external/src/catalog.ts packages/external/src/catalog.generated.ts
ls packages/external/src/catalog.generated.ts packages/external/src/registry.generated.ts packages/external/src/index.ts
```
Expected: 세 파일 경로 출력(존재). `catalog.ts`는 `catalog.generated.ts`로 리네임됨(auto-generated 신호, registry.generated와 일관).

- [ ] **Step 2: package.json 의존/exports 수정**

`packages/external/package.json`을 아래로 교체:

```json
{
	"name": "@cx/external",
	"version": "0.1.0",
	"private": true,
	"type": "module",
	"exports": {
		".": "./src/index.ts",
		"./catalog": "./src/catalog.generated.ts",
		"./registry": "./src/registry.generated.ts",
		"./resolver": "./src/resolver.ts",
		"./puck": "./src/puck.ts",
		"./canonicalize": "./src/canonicalize-catalog.ts"
	},
	"dependencies": {
		"@cx/schema": "workspace:*"
	},
	"peerDependencies": {
		"react": "^19.2.0"
	}
}
```

- [ ] **Step 3: catalog.generated.ts type import 재배선 + 내부 참조 갱신**

`packages/external/src/catalog.generated.ts` 1줄 변경:

```ts
// 기존
import type { ComponentCatalog } from "@cx/types/component-catalog";
// 변경
import type { ComponentCatalog } from "@cx/schema";
```

리네임으로 끊긴 내부 import를 갱신한다(registry.generated/index 등이 `./catalog`를 참조할 수 있음):

```bash
grep -rn "\"\./catalog\"\|'\./catalog'\|/catalog\"" packages/external/src --include="*.ts" | grep -v catalog.generated
```
Expected: `./catalog`를 참조하는 줄 목록. 각 줄을 `./catalog.generated`로 수정(없으면 스킵).

- [ ] **Step 4: tsconfig에 vendored 컴포넌트 exclude 추가 (KIKI-SHIM 지침)**

`tsconfig.json`의 `exclude`를 변경(vendored kiki 컴포넌트는 StaticImageData 류 타입 에러를 내므로 SHIM이 제외를 권고):

```json
"exclude": ["node_modules", "packages/external/src/components"]
```

- [ ] **Step 5: next.config transpilePackages에 external 추가(임시 공존)**

`apps/web/next.config.ts`의 `transpilePackages` 배열에 `"@cx/external"` 추가(이 시점엔 `"@cx/components"`도 유지 — Phase D-web에서 제거).

```ts
transpilePackages: [
	"@cx/external",
	"@cx/components",
	// ...기존 항목 유지
],
```

- [ ] **Step 6: 워크스페이스 설치**

Run: `pnpm install`
Expected: `@cx/external`이 `@cx/schema`를 workspace로 링크, 에러 없음.

- [ ] **Step 7: external 카탈로그 타입 해석 확인**

Run: `pnpm vitest run packages/schema/src/__tests__/component-catalog.test.ts`
(catalog.generated.ts가 @cx/schema의 `ComponentCatalog`로 타입드되는지는 다음 Task의 resolver 테스트에서 실증)
Expected: PASS

- [ ] **Step 8: 커밋**

```bash
git add packages/external packages/external/package.json packages/external/src/catalog.generated.ts tsconfig.json apps/web/next.config.ts pnpm-lock.yaml
git commit -m "chore(external): @cx/external land + catalog.generated 리네임 + @cx/schema 배선"
```

---

## Phase C — `@cx/external` resolver + puck

### Task C1: resolver 이식 (alias 제거, source→status 유도)

**Files:**
- Create: `packages/external/src/resolver.ts`
- Test: `packages/external/src/__tests__/resolver.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`packages/external/src/__tests__/resolver.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
	componentCatalog,
	getComponentCatalogEntry,
	getComponentCatalogStatus,
	getComponentCatalogTypes,
	listCandidateComponentEntries,
	resolveComponentCatalogForInference,
} from "../resolver";

describe("@cx/external resolver", () => {
	it("kiki.X 키로 엔트리를 직접 조회한다", () => {
		expect(getComponentCatalogEntry("kiki.AppBar")?.type).toBe("kiki.AppBar");
		expect(getComponentCatalogEntry("does.not.exist")).toBeUndefined();
	});

	it("barrel은 stable, draft는 candidate로 status를 유도한다", () => {
		expect(getComponentCatalogStatus("kiki.AppBar")).toBe("stable"); // kiki-barrel
		expect(getComponentCatalogStatus("kiki.BadgeHome")).toBe("candidate"); // kiki-draft
		expect(getComponentCatalogStatus("does.not.exist")).toBeUndefined();
	});

	it("listCandidateComponentEntries는 draft만 반환한다", () => {
		const candidates = listCandidateComponentEntries();
		expect(candidates.length).toBeGreaterThan(0);
		expect(candidates.every((e) => e.source === "kiki-draft")).toBe(true);
	});

	it("getComponentCatalogTypes는 정렬된 키 목록", () => {
		const types = getComponentCatalogTypes();
		expect(types).toContain("kiki.AppBar");
		expect([...types]).toEqual([...types].sort());
	});

	it("componentCatalog는 externalCatalog와 동일 형상", () => {
		expect(componentCatalog["kiki.AppBar"]?.type).toBe("kiki.AppBar");
	});

	it("inference 공급 owner는 @cx/external", () => {
		const obj = resolveComponentCatalogForInference();
		expect(obj.owner).toBe("@cx/external");
		expect(obj.kind).toBe("component-catalog");
		expect(obj.data.entries.length).toBeGreaterThan(0);
	});
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run packages/external/src/__tests__/resolver.test.ts`
Expected: FAIL — `../resolver` 모듈 없음.

- [ ] **Step 3: resolver 작성**

`packages/external/src/resolver.ts`:

```ts
import {
	type ComponentCatalogEntry,
	type ComponentCatalogObject,
	type ComponentCatalogStatus,
	SSOT_OBJECT_SCHEMA_VERSION,
} from "@cx/schema";
import { externalCatalog } from "./catalog.generated";

export const componentCatalog = externalCatalog;

export type ComponentCatalogType = keyof typeof externalCatalog;

const entries = Object.entries(externalCatalog) as Array<[string, ComponentCatalogEntry]>;

export function getComponentCatalogEntry(type: string): ComponentCatalogEntry | undefined {
	return externalCatalog[type];
}

export function getComponentCatalogTypes(): string[] {
	return Object.keys(externalCatalog).sort();
}

/** source(barrel/draft)에서 status(stable/candidate)를 유도한다. */
export function getComponentCatalogStatus(type: string): ComponentCatalogStatus | undefined {
	const entry = getComponentCatalogEntry(type);
	if (!entry) return undefined;
	return entry.source === "kiki-barrel" ? "stable" : "candidate";
}

/** candidate = kiki-draft 엔트리. */
export function listCandidateComponentEntries(): ComponentCatalogEntry[] {
	return entries.filter(([, entry]) => entry.source === "kiki-draft").map(([, entry]) => entry);
}

export function resolveComponentCatalogForInference(): ComponentCatalogObject {
	return {
		kind: "component-catalog",
		id: "default",
		owner: "@cx/external",
		sourceRef: "catalog",
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			entries: Object.values(externalCatalog),
		},
	};
}
```

참고: `ComponentCatalogObject`/`SSOT_OBJECT_SCHEMA_VERSION`은 `@cx/schema`에서 이미 export됨(`inference-reference.ts`). `@cx/schema` import가 type+value 혼합이므로 위처럼 `type`/값 분리 표기.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run packages/external/src/__tests__/resolver.test.ts`
Expected: PASS (6 tests)

만약 `kiki.AppBar`가 catalog에 없으면(테스트 1 실패) `packages/external/src/catalog.generated.ts`에서 실제 barrel 컴포넌트 키 하나를 골라 테스트 픽스처를 교체(예: `kiki.Button`). barrel 컴포넌트는 `external.lock.json`의 `barrelExports`로 확인 가능.

- [ ] **Step 5: 커밋**

```bash
git add packages/external/src/resolver.ts packages/external/src/__tests__/resolver.test.ts
git commit -m "feat(external): resolver 이식 (alias 제거, source→status 유도)"
```

### Task C2: puck 표면 이식

**Files:**
- Create: `packages/external/src/puck.ts`

- [ ] **Step 1: 구 puck.ts를 external로 이식**

`packages/component/src/public/puck.ts` 전체를 `packages/external/src/puck.ts`로 복사하되 import 2줄을 변경:

```ts
// 기존
import { getComponentCatalogEntry, getComponentCatalogTypes } from "./resolver";
import type { ComponentCatalogEntry } from "./types";
// 변경
import { getComponentCatalogEntry, getComponentCatalogTypes } from "./resolver";
import type { ComponentCatalogEntry } from "@cx/schema";
```

(`./resolver`는 같은 디렉터리의 새 resolver를 가리키므로 경로 유지. 타입만 `@cx/schema`로.)
나머지 본문(`getPrimitivePuckCatalogItems`, `componentCatalogEntryToPuckItem`, `createPuckCatalogType`, `readDefaultProps` 등)은 그대로.

- [ ] **Step 2: puck 표면 타입체크(스모크)**

Run: `pnpm vitest run packages/external/src/__tests__/resolver.test.ts`
(puck 전용 테스트는 apps/web 통합에서 검증되므로 여기선 모듈이 깨지지 않는지만 확인. 별도 실패 테스트 불요 — 순수 이식.)
Expected: PASS (기존 resolver 테스트 유지)

- [ ] **Step 3: 커밋**

```bash
git add packages/external/src/puck.ts
git commit -m "feat(external): puck 표면 이식"
```

### Task C3: alias 맵(`catalog.alias.ts`) + 캐논화 helper(`canonicalize-catalog.ts`)

**Files:**
- Create: `packages/external/src/catalog.alias.ts`, `packages/external/src/canonicalize-catalog.ts`, `packages/external/src/__tests__/canonicalize-catalog.test.ts`

- [ ] **Step 1: 구 @cx/components의 alias를 canonical kiki.X로 번역해 추출**

구 alias는 `packages/component/src/internal/component-entries.ts`·`candidate-entries.ts`의 각 엔트리 `aliases`에 있다. 각 alias 문자열 → 그 엔트리의 새 canonical(`kiki.<엔트리이름>`)로 매핑한다. 예: AppBar 엔트리의 `["app-bar","appbar","AppBarHeaderTopNav"]` → 모두 `"kiki.AppBar"`.

Run(추출 보조):
```bash
grep -rn "aliases:" packages/component/src/internal/component-entries.ts packages/component/src/internal/candidate-entries.ts
```
Expected: 각 엔트리의 alias 배열 목록. 이를 보고 아래 맵을 채운다.

- [ ] **Step 2: 실패하는 무결성 + write-back 테스트 작성**

`packages/external/src/__tests__/canonicalize-catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { externalCatalog } from "../catalog.generated";
import { catalogAlias } from "../catalog.alias";
import { canonicalizeNodeType, canonicalizeRenderTree } from "../canonicalize-catalog";

describe("@cx/external canonicalize-catalog", () => {
	it("모든 alias 값은 실제 catalog 키(canonical)다", () => {
		for (const canonical of Object.values(catalogAlias)) {
			expect(externalCatalog[canonical], `alias→${canonical} 미존재`).toBeDefined();
		}
	});

	it("canonicalizeNodeType은 alias를 canonical로, 미등록은 그대로 반환", () => {
		const [alias, canonical] = Object.entries(catalogAlias)[0] ?? ["app-bar", "kiki.AppBar"];
		expect(canonicalizeNodeType(alias)).toBe(canonical);
		expect(canonicalizeNodeType("kiki.AppBar")).toBe("kiki.AppBar");
		expect(canonicalizeNodeType("unknown.Thing")).toBe("unknown.Thing");
	});

	it("canonicalizeRenderTree는 트리 전체 node.type을 canonical로 치환한다", () => {
		const [alias, canonical] = Object.entries(catalogAlias)[0] ?? ["app-bar", "kiki.AppBar"];
		const tree = { type: "Screen", children: [{ type: alias, children: [] }] };
		const result = canonicalizeRenderTree(tree);
		expect(result.children[0].type).toBe(canonical);
		expect(result.type).toBe("Screen"); // 구조 노드는 불변
	});
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `pnpm vitest run packages/external/src/__tests__/canonicalize-catalog.test.ts`
Expected: FAIL — `../catalog.alias`/`../canonicalize-catalog` 모듈 없음.

- [ ] **Step 4: catalog.alias.ts 작성**

`packages/external/src/catalog.alias.ts` (Step 1에서 번역한 매핑으로 채움 — 아래는 형태 예시):

```ts
// 손으로 유지하는 alias → canonical(kiki.X) 매핑.
// canonicalize-catalog.ts에서만 소비된다. 값은 반드시 catalog의 실제 키여야 한다(무결성 검증이 강제).
export const catalogAlias: Record<string, string> = {
	"app-bar": "kiki.AppBar",
	appbar: "kiki.AppBar",
	AppBarHeaderTopNav: "kiki.AppBar",
	badge: "kiki.Badge",
	BadgeProductStatus: "kiki.Badge",
	button: "kiki.Button",
	accordion: "kiki.AccordionPriceInfo",
	// ... Step 1에서 추출한 나머지 전부
};
```

주의: 구 alias가 가리키던 컴포넌트가 새 kiki 카탈로그에 없으면(이름 변경/미존재) 그 alias는 제외하거나 가장 가까운 canonical로 보정한다. 무결성 검증이 미존재 canonical을 잡아낸다.

- [ ] **Step 5: canonicalize-catalog.ts 작성**

`packages/external/src/canonicalize-catalog.ts`:

```ts
import { externalCatalog } from "./catalog.generated";
import { catalogAlias } from "./catalog.alias";

// alias 맵의 모든 값이 실제 catalog 키인지 모듈 로드 시 검증한다.
// (write-back은 persist 경계에서만 호출되므로, 잘못된 alias는 가능한 한 빨리 깨야 한다.)
export function assertAliasIntegrity(): void {
	const missing = Object.entries(catalogAlias).filter(([, canonical]) => !externalCatalog[canonical]);
	if (missing.length > 0) {
		throw new Error(
			`catalog.alias.ts: 다음 alias가 미존재 canonical을 가리킴 → ${missing
				.map(([alias, canonical]) => `${alias}→${canonical}`)
				.join(", ")}`,
		);
	}
}

assertAliasIntegrity();

/** alias면 canonical로, 아니면 입력 그대로. */
export function canonicalizeNodeType(type: string): string {
	return catalogAlias[type] ?? type;
}

type CanonicalizableNode = { type: string; children?: CanonicalizableNode[] };

/** 트리 깊이우선 워크: 각 node.type을 canonicalizeNodeType으로 치환한 새 트리를 반환(write-back). */
export function canonicalizeRenderTree<T extends CanonicalizableNode>(node: T): T {
	return {
		...node,
		type: canonicalizeNodeType(node.type),
		...(node.children ? { children: node.children.map((child) => canonicalizeRenderTree(child)) } : {}),
	};
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm vitest run packages/external/src/__tests__/canonicalize-catalog.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 7: 커밋**

```bash
git add packages/external/src/catalog.alias.ts packages/external/src/canonicalize-catalog.ts packages/external/src/__tests__/canonicalize-catalog.test.ts
git commit -m "feat(external): catalog.alias 맵 + canonicalize-catalog write-back helper"
```

---

## Phase D — 소비자 재배선

각 Task는 import 경로만 바꾸고 해당 패키지 테스트로 검증한다. 타입은 `@cx/schema`, resolver/catalog 값은 `@cx/external/*`.

### Task D0: persist 경계 write-back 캐논화 + 마이그레이션 스크립트

**Files:**
- Modify: `apps/web/src/app/api/inference/[jobId]/apply/route.ts`, `apps/web/src/lib/screen-db-save.ts`, `apps/web/package.json`
- Create: `scripts/migrate-canonicalize-node-types.ts`

**배경:** 생성 파이프라인엔 깔끔한 단일 Register 단계가 없다 — LLM이 `04-render-tree` 스텝에서 node.type을 raw로 직접 만들고 `run-step.ts`는 그대로 context에 기록한다. 대신 **render-tree가 DB로 materialize되는 persist 경계**가 코드에 실재하는 단일 chokepoint다(`apply/route.ts` → `applyScreenInferenceFinalResult`, `screen-db-save.ts` → `saveScreenTreeOrder`). 이 지점에서 `canonicalizeRenderTree`로 트리를 canonical로 굳히면 DB엔 canonical만 저장되고, DB-load 트리만 보는 renderer/matcher/validator는 canonical만 본다. in-pipeline validation(05/07)은 raw 트리에 작동하나 catalog knowledge가 canonical만 노출하므로 그 트리도 이미 canonical이라 alias 처리가 불필요하다.

- [ ] **Step 1: apps/web에 @cx/external dep 추가**

`apps/web/package.json`에 `"@cx/external": "workspace:*"`가 없으면 추가(D5에서 다른 import도 재배선되며, 여기서 먼저 dep을 건다). 후 `pnpm install`.

- [ ] **Step 2: 실패하는 write-back 통합 테스트 작성**

`apps/web/src/lib/__tests__/canonicalize-apply.test.ts` 신설:

```ts
import { describe, expect, it } from "vitest";
import { canonicalizeRenderTree } from "@cx/external/canonicalize";

describe("apply write-back: render-tree 캐논화", () => {
	it("alias node.type을 가진 트리가 canonical로 치환된다", () => {
		const tree = {
			type: "Screen",
			children: [{ type: "app-bar", children: [] }],
		};
		const canonical = canonicalizeRenderTree(tree);
		expect(canonical.children[0].type).toBe("kiki.AppBar");
	});
});
```
(실제 alias 키는 C3에서 확정된 값으로 맞춘다. 핵심은 apply 경로가 `canonicalizeRenderTree`를 경유함을 고정하는 것.)

- [ ] **Step 3: 테스트 실패 확인**

Run: `pnpm vitest run apps/web/src/lib/__tests__/canonicalize-apply.test.ts`
Expected: FAIL — import 또는 alias 매핑 불일치(모듈 배선 전).

- [ ] **Step 4: apply route에 write-back 적용**

`apps/web/src/app/api/inference/[jobId]/apply/route.ts` — `applyScreenInferenceFinalResult`에 넘기기 전 캐논화:

```ts
// 상단 import 추가
import { canonicalizeRenderTree } from "@cx/external/canonicalize";
// ...
// 기존
const result = await applyScreenInferenceFinalResult({
	node: readScreenNode(finalResult),
});
// 변경
const result = await applyScreenInferenceFinalResult({
	node: canonicalizeRenderTree(readScreenNode(finalResult)),
});
```

- [ ] **Step 5: save route에 방어적 write-back 적용**

`apps/web/src/lib/screen-db-save.ts`의 `saveScreenTreeOrder` 진입부 — projecting 전 `input.node`를 캐논화:

```ts
// 상단 import 추가
import { canonicalizeRenderTree } from "@cx/external/canonicalize";
// 함수 본문 첫 줄에서 node를 캐논화한 값으로 교체(이후 로직은 canonical node를 사용)
const node = canonicalizeRenderTree(input.node);
```
(editor는 보통 canonical을 로드/저장하므로 방어적이지만, 임포트·외부 주입 대비 안전망.)

- [ ] **Step 6: 마이그레이션 스크립트 작성 (기존 DB rows write-back)**

먼저 DB row의 type 컬럼/접근 경로를 핀포인트:
```bash
grep -rn "catalog_component_type\|from(\|render_screens\|supabase" apps/web/src/lib/screen-db-loader.ts apps/web/src/lib/screen-inference-persistence.ts | head -20
```
Expected: 컴포넌트 row의 type 컬럼명(`catalog_component_type` 등)과 supabase 테이블/클라이언트 접근 코드.

`scripts/migrate-canonicalize-node-types.ts` 작성 — 위 핀포인트로 확인한 테이블의 type 컬럼을 읽어 `canonicalizeNodeType`을 적용, 변경분만 write-back. `--dry-run`(기본)은 변경 후보만 출력하고, `--apply`일 때만 기록:

```ts
import { canonicalizeNodeType } from "@cx/external/canonicalize";
// supabase 클라이언트는 screen-db-loader가 쓰는 것과 동일 경로에서 import(Step6 grep으로 확인).

const APPLY = process.argv.includes("--apply");

async function main() {
	// 1) 컴포넌트 type을 보유한 모든 row 조회(catalog_component_type 등).
	// 2) 각 row: const next = canonicalizeNodeType(row.<typeCol>);
	// 3) next !== 현재값인 row만 후보. 출력: `${id}: ${현재} → ${next}`.
	// 4) APPLY면 해당 컬럼을 next로 update. 아니면 건수만 보고.
	// (정확한 테이블/컬럼/클라이언트는 Step6 grep 결과로 채운다.)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 7: 테스트 통과 + dry-run 스모크**

Run:
```bash
pnpm vitest run apps/web/src/lib/__tests__/canonicalize-apply.test.ts
pnpm exec tsx scripts/migrate-canonicalize-node-types.ts   # dry-run, 후보 건수 출력(DB 미연결이면 연결 에러는 허용 — 코드 컴파일/배선만 확인)
```
Expected: 테스트 PASS. 스크립트가 컴파일되고 dry-run 모드로 동작(또는 DB 연결 가이드 출력).

- [ ] **Step 8: 커밋**

```bash
git add apps/web/src/app/api/inference apps/web/src/lib/screen-db-save.ts apps/web/src/lib/__tests__/canonicalize-apply.test.ts apps/web/package.json scripts/migrate-canonicalize-node-types.ts pnpm-lock.yaml
git commit -m "feat(web): persist 경계 node.type write-back 캐논화 + 마이그레이션 스크립트"
```

### Task D1: renderer 재배선 + 접두사 strip 규칙

**Files:**
- Modify: `packages/renderer/src/adapters/resolve-component.tsx`, `packages/renderer/src/adapters/build-component-props.ts`, `packages/renderer/package.json`

- [ ] **Step 1: package.json dep 교체**

`packages/renderer/package.json`의 `"@cx/components": "workspace:*"`를 `"@cx/external": "workspace:*"`로 변경(이미 `@cx/schema`가 없으면 함께 추가).

- [ ] **Step 2: resolve-component.tsx 재배선 + strip 규칙**

상단 import 3줄 변경:

```ts
// 기존
import * as ComponentsModule from "@cx/components";
import { AppBar, Callout, ListSelected, ListText } from "@cx/components";
import { componentCatalogAliases, getComponentCatalogEntry } from "@cx/components/catalog";
// 변경
import * as ComponentsModule from "@cx/external/registry";
import { AppBar, Callout, ListSelected, ListText } from "@cx/external/registry";
import { getComponentCatalogEntry } from "@cx/external/resolver";
```

`resolveComponentByType`를 접두사 strip 규칙으로 교체(파일 하단):

```ts
// 기존
function resolveComponentByType(type: string): ComponentType<unknown> | undefined {
	const direct = componentsByType[type];
	if (direct) return direct;
	const aliased = componentCatalogAliases[type];
	if (aliased) return componentsByType[aliased];
	return undefined;
}
// 변경: kiki.X → registry export X (접두사 strip 단일 규칙, alias 아님)
function resolveComponentByType(type: string): ComponentType<unknown> | undefined {
	return componentsByType[type] ?? componentsByType[type.replace(/^kiki\./, "")];
}
```

- [ ] **Step 3: build-component-props.ts 재배선**

상단 import 변경:

```ts
// 기존
import type { ComponentPropContract, ComponentPropType } from "@cx/components/catalog";
import { getComponentCatalogEntry } from "@cx/components/catalog";
// 변경
import type { ComponentPropContract, ComponentPropType } from "@cx/schema";
import { getComponentCatalogEntry } from "@cx/external/resolver";
```

- [ ] **Step 4: renderer 테스트**

Run: `pnpm vitest run packages/renderer`
Expected: PASS. composite 렌더러(Accordion/ListCell/HeaderBase 등)는 변경 없음 — 통과 유지.

- [ ] **Step 5: 커밋**

```bash
git add packages/renderer
git commit -m "refactor(renderer): @cx/external 재배선 + kiki. 접두사 strip 규칙"
```

### Task D2: layout 재배선

**Files:**
- Modify: `packages/layout/src/pattern-internal/matcher.ts`, `packages/layout/src/components/patterns/shared/divider.tsx`, `packages/layout/src/__tests__/layout-catalog.test.ts`, `packages/layout/package.json`

- [ ] **Step 1: package.json dep 교체**

`packages/layout/package.json`의 `@cx/components`→`@cx/external`(+ 필요시 `@cx/schema`).

- [ ] **Step 2: matcher.ts — alias/kind 신호 루프 삭제 (catalog 의존 제거)**

node.type이 Register에서 canonical로 확정되므로 matcher는 canonical 문자열만으로 신호를 만든다. `entry.type`은 canonical type과 동일(중복), `entry.kind`·`entry.aliases`는 없음 → `getComponentCatalogEntry` 조회 전체가 dead. import와 entry 블록을 통째 제거하고 `componentSignals`를 type 파생 신호만 남긴다:

```ts
// 기존
import { getComponentCatalogEntry } from "@cx/components/catalog";
import type { PatternResolutionSignals } from "../public/types";

export function componentSignals(type: string): Set<string> {
	const entry = getComponentCatalogEntry(type);
	const signals = new Set<string>([type, type.toLowerCase(), toKebabCase(type)]);

	if (entry) {
		signals.add(entry.type);
		signals.add(entry.type.toLowerCase());
		signals.add(toKebabCase(entry.type));
		if (entry.kind) signals.add(entry.kind);
		for (const alias of entry.aliases ?? []) {
			signals.add(alias);
			signals.add(alias.toLowerCase());
			signals.add(toKebabCase(alias));
		}
	}

	return signals;
}
// 변경 (catalog import 삭제, canonical 문자열만)
import type { PatternResolutionSignals } from "../public/types";

export function componentSignals(type: string): Set<string> {
	return new Set<string>([type, type.toLowerCase(), toKebabCase(type)]);
}
```

→ matcher.ts는 더 이상 `@cx/external`/catalog를 import하지 않는다(경계 모델대로 Matcher는 canonical type만 소비).

`divider.tsx`:
```ts
// 기존
import { Divider } from "@cx/components";
// 변경
import { Divider } from "@cx/external";
```

`__tests__/layout-catalog.test.ts`:
```ts
// 기존
import type { ComponentCatalogEntry } from "@cx/components/catalog";
import { componentCatalog } from "@cx/components/catalog";
// 변경
import type { ComponentCatalogEntry } from "@cx/schema";
import { componentCatalog } from "@cx/external/resolver";
```
또한 이 테스트가 직접 신호를 만들며 `entry.kind`/`entry.aliases`를 읽는 줄(현재 ~103-104행
`if (entry.kind) catalogSignals.add(entry.kind);` / `for (const alias of entry.aliases ?? [])`)을
**삭제**한다(필드가 사라짐 — matcher와 동일하게 canonical type 신호만 남김).

- [ ] **Step 3: layout 테스트**

Run: `pnpm vitest run packages/layout`
Expected: PASS. `layout-catalog.test.ts`가 카탈로그 형상에 의존하면 kiki 카탈로그(키 `kiki.X`)에 맞게 단언이 깨질 수 있음 → 깨지면 해당 테스트의 기대값을 새 카탈로그 기준으로 갱신(예: 특정 bare type 존재 단언 → `kiki.` 접두사 반영).

- [ ] **Step 4: 커밋**

```bash
git add packages/layout
git commit -m "refactor(layout): @cx/external 재배선"
```

### Task D3: validation 재배선

**Files:**
- Modify: `packages/validation/src/public/validators.ts`, `packages/validation/src/__tests__/validators.test.ts`, `packages/validation/package.json`

- [ ] **Step 1: package.json dep 교체**

`@cx/components`→`@cx/external`(+ `@cx/schema` 확인).

- [ ] **Step 2: import 재배선**

`validators.ts`:
```ts
// 기존
import { getComponentCatalogStatus } from "@cx/components/catalog";
import type {
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentPropContract,
	ComponentPropType,
} from "@cx/components/types";
// 변경
import { getComponentCatalogStatus } from "@cx/external/resolver";
import type {
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentPropContract,
	ComponentPropType,
} from "@cx/schema";
```

`__tests__/validators.test.ts`:
```ts
// 기존
import { componentCatalog } from "@cx/components/catalog";
import type { ComponentCatalog } from "@cx/components/types";
// 변경
import { componentCatalog } from "@cx/external/resolver";
import type { ComponentCatalog } from "@cx/schema";
```

- [ ] **Step 2b: alias 역해석 삭제 (`findCatalogEntry`)**

node.type이 canonical로 들어오므로 alias fallback이 불필요(그리고 `entry.aliases` 필드도 사라짐). `findCatalogEntry`를 직접 조회로 축소:

```ts
// 기존
function findCatalogEntry(
	type: string,
	catalog?: ComponentCatalog,
): ComponentCatalogEntry | undefined {
	if (!catalog) return undefined;
	if (catalog[type]) return catalog[type];
	return Object.values(catalog).find((entry) => entry.aliases?.includes(type));
}
// 변경
function findCatalogEntry(
	type: string,
	catalog?: ComponentCatalog,
): ComponentCatalogEntry | undefined {
	return catalog?.[type];
}
```

- [ ] **Step 3: validation 테스트**

Run: `pnpm vitest run packages/validation`
Expected: PASS. 카탈로그 키/형상 의존 단언이 있으면 새 카탈로그 기준으로 갱신.

- [ ] **Step 4: 커밋**

```bash
git add packages/validation
git commit -m "refactor(validation): @cx/external 재배선 (타입은 @cx/schema)"
```

### Task D4: inference 재배선

**Files:**
- Modify: `packages/inference/src/knowledge/knowledge-base.ts`, `packages/inference/src/functions/deterministic-validation.ts`, `packages/inference/src/__tests__/knowledge-base.test.ts`, `packages/inference/package.json`

- [ ] **Step 1: package.json dep 교체**

`@cx/components`→`@cx/external`.

- [ ] **Step 2: import 재배선**

`knowledge-base.ts`:
```ts
// 기존
import { resolveComponentCatalogForInference } from "@cx/components/catalog";
// 변경
import { resolveComponentCatalogForInference } from "@cx/external/resolver";
```

`deterministic-validation.ts`:
```ts
// 기존
import { componentCatalog } from "@cx/components/catalog";
// 변경
import { componentCatalog } from "@cx/external/resolver";
```

`__tests__/knowledge-base.test.ts` 35행 owner 문자열:
```ts
// 기존
			owner: "@cx/components",
// 변경
			owner: "@cx/external",
```

- [ ] **Step 3: inference 테스트**

Run: `pnpm vitest run packages/inference`
Expected: PASS. owner 단언이 `@cx/external`로 일치.

- [ ] **Step 4: 커밋**

```bash
git add packages/inference
git commit -m "refactor(inference): @cx/external 재배선"
```

### Task D5: apps/web 재배선

**Files:**
- Modify: `apps/web/src/lib/workbench-puck/puck-scope.ts`, `apps/web/src/lib/workbench-puck/puck-fields.ts`, `apps/web/next.config.ts`, `apps/web/package.json`

- [ ] **Step 1: package.json dep 교체**

`@cx/components`→`@cx/external`.

- [ ] **Step 2: import 재배선**

`puck-scope.ts`:
```ts
// 기존
import { getPrimitivePuckCatalogItems } from "@cx/components/puck";
// 변경
import { getPrimitivePuckCatalogItems } from "@cx/external/puck";
```

`puck-fields.ts`:
```ts
// 기존
import { getComponentCatalogEntry } from "@cx/components/catalog";
// 변경
import { getComponentCatalogEntry } from "@cx/external/resolver";
```

`next.config.ts` transpilePackages에서 `"@cx/components"` 제거(이제 `"@cx/external"`만 유지):
```ts
transpilePackages: [
	"@cx/external",
	// "@cx/components" 제거
	// ...기존 다른 항목 유지
],
```

- [ ] **Step 3: apps/web 타입체크/테스트**

Run: `pnpm vitest run apps/web` (있으면), 그리고 `pnpm -F web exec next build --no-lint`가 무거우면 생략하고 Phase E의 루트 tsc로 갈음.
Expected: PASS / 타입 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add apps/web
git commit -m "refactor(web): @cx/external 재배선 + transpilePackages 정리"
```

### Task D6: scripts/promote-component.ts 중립화

**Files:**
- Modify: `scripts/promote-component.ts`

- [ ] **Step 1: read-only 재배선 + deferred 주석**

상단 import + 파일 머리에 주석 추가:

```ts
// NOTE: 카탈로그 mutation/promote는 자동생성 + source 유도 status 체제로 전환되며 폐기되었다.
// candidate→stable promote의 진짜 재작성(kiki 소스 draft→barrel, sync 레이어)은
// scripts/sync-catalog 생성기 도입 후 별도 계획에서 수행한다. (spec 2·3·10절)
// 현재 이 스크립트는 read-only candidate 리스터로만 유지한다.
import { getComponentCatalogStatus, listCandidateComponentEntries } from "@cx/external/resolver";
```

기존 본문이 폐기된 mutation API(`promoteComponentCatalogEntry` 등)를 호출하면 그 호출부를 제거하고, `listCandidateComponentEntries()` 결과를 출력하는 read-only 동작만 남긴다. (구체 본문은 현 파일 내용에 따라 조정 — mutation 호출 라인만 삭제, 출력/조회 라인 유지.)

- [ ] **Step 2: 스크립트 타입체크**

Run: `pnpm exec tsc --noEmit scripts/promote-component.ts` (단독 불가하면 Phase E 루트 tsc로 갈음)
Expected: `@cx/components` 참조 사라짐, 컴파일.

- [ ] **Step 3: 커밋**

```bash
git add scripts/promote-component.ts
git commit -m "chore(scripts): promote-component read-only 중립화 (sync 재작성은 후속)"
```

---

## Phase E — `@cx/components` 삭제 + 최종 검증

### Task E1: 패키지 삭제 + 루트 dep 정리

**Files:**
- Delete: `packages/component/**`
- Modify: 루트 `package.json`

- [ ] **Step 1: 루트 package.json dep 교체**

루트 `package.json`의 `"@cx/components": "workspace:*"`(33행 부근)를 `"@cx/external": "workspace:*"`로 변경. (`@cx/agent`/`@cx/inference`/`@cx/schema` 등 나머지는 유지.)

- [ ] **Step 2: 패키지 디렉터리 삭제**

Run:
```bash
git rm -r packages/component
```

- [ ] **Step 3: 재설치**

Run: `pnpm install`
Expected: 에러 없음. `@cx/components` 링크 사라짐.

- [ ] **Step 4: 잔여 참조 0건 확인 (@cx/components + alias 누수)**

Run:
```bash
grep -rn "@cx/components" --exclude-dir=node_modules --exclude-dir=.git .
grep -rnE "entry\.aliases|\.aliases\?\.|entry\.kind" packages/layout/src packages/validation/src --include="*.ts" --include="*.tsx"
```
Expected: 첫 grep **0건**(docs 설명 텍스트 제외, 코드/설정 0건). 둘째 grep도 **0건** — 경계 모델대로 Matcher/Validator에 alias·kind 참조가 남지 않아야 함(figma-export의 자체 REGISTRY는 대상 아님).

- [ ] **Step 5: 전체 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors (vendored `packages/external/src/components`는 tsconfig exclude로 제외됨).

- [ ] **Step 6: 전체 테스트**

Run: `pnpm vitest run`
Expected: 전부 PASS.

- [ ] **Step 7: graphify 갱신 + 커밋**

```bash
graphify update .
git add -A
git commit -m "refactor: @cx/components 삭제 — @cx/external이 컴포넌트 SSOT"
```

### Task E2: 앱 부팅 스모크

- [ ] **Step 1: 앱 실행 후 캔버스에 kiki 렌더 확인**

Run: `pnpm -F web dev` (또는 프로젝트 표준 dev 명령)
Expected: 200 부팅, 캔버스에 kiki 컴포넌트 렌더, 콘솔 에러 없음. (`/browse` 또는 `/run` 스킬로 확인 가능.)

- [ ] **Step 2: 최종 커밋(필요 시)**

부팅 중 발견된 잔여 수정만 커밋.

---

## Self-Review 메모

- **Spec 커버리지:** 결정 1(은퇴/삭제)=Phase E, 2(usage 폐기·alias는 `catalog.alias`+write-back)=A1·C3·D0, 3(source→status)=C1, 4(contract→schema)=A1, 5(resolver 얇은 helper·getComponentPropContract 드롭)=C1, 6(mutation 폐기/promote 후속)=D6, 7(kiki.X 일관+strip)=D1, 8(persist write-back·matcher/validators/renderer alias 삭제)=D0·D1·D2·D3. 모두 태스크 존재.
- **경계 모델 반영:** alias 캐논화→persist 경계 write-back(D0, apply/save/마이그레이션 3 site) 단일 소비, Registry→Renderer-only(D1), Catalog→공유 read-only(D1/D3/D4/D5). Matcher는 canonical만 소비해 catalog 의존 제거(D2). E1 Step4가 alias/kind 누수 0건을 검증.
- **Placeholder:** 코드 변경 스텝은 실제 before→after 명시. 핀포인트가 남는 2곳: (a) D0 마이그레이션 스크립트의 DB 테이블/컬럼/supabase 클라이언트 — Step6 grep으로 특정. (b) D6 promote-component 본문 — mutation 호출 라인 삭제는 현 파일 구조 의존. 둘 다 명시적 locate-step 포함.
- **타입 일관성:** `ComponentCatalogEntry`/`ComponentCatalogStatus`/`ComponentPropContract`는 A1(@cx/schema)에서 정의 → C1/C2/validators에서 동일 시그니처 소비. resolver 표면 6개(`componentCatalog`/`getComponentCatalogEntry`/`getComponentCatalogStatus`/`listCandidateComponentEntries`/`getComponentCatalogTypes`/`resolveComponentCatalogForInference`)는 구 표면과 동일 이름 — 소비자 호출부 무변경. `getComponentPropContract`만 드롭(외부 소비자 0건, 확인 완료). `@cx/external/canonicalize`는 `canonicalizeNodeType`/`canonicalizeRenderTree`/`assertAliasIntegrity` 신규 표면(C3 정의 → D0 소비), `catalog.alias.ts`는 `catalogAlias` 맵(C3).
- **파일 구조:** external 5-파일(`catalog.generated`/`catalog.alias`/`registry.generated`/`canonicalize-catalog`/`resolver`) flat in `src/`. consumer import specifier(`@cx/external/resolver`·`/catalog`·`/puck`·`/canonicalize`)는 exports map이 흡수 → D1~D6 import 경로 무변경.
