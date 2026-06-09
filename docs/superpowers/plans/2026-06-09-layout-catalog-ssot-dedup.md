# @cx/layout 계약 SOT 정합 — registry 중복 제거 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `components/patterns/registry.ts`가 catalog와 중복 선언하던 layout pattern 계약(props·name·children·status·defaults)을 제거하고, catalog/*.json을 단일 SOT로, registry는 `layoutId → 실제 React pattern component` 결속으로 정본화한다.

**Architecture:** registry는 계약 데이터를 자체 선언하지 않고 `getEntry(layoutId)`(JSON catalog)에서 `pattern`을 소싱한다. composite defaults는 catalog로 이관해 `createCompositeWrapper(getEntry(id).defaults)`로 빌드한다. validation/inference/renderer 흐름·렌더 동작 불변.

**Tech Stack:** TypeScript (moduleResolution Bundler, noEmit), zod v4, Vitest, React 19, pnpm monorepo.

설계 근거: `docs/superpowers/specs/2026-06-09-layout-catalog-ssot-dedup-design.md`

---

## Task 1: parity 테스트 = 정합 worklist (RED)

registry-derived 계약과 catalog 계약의 layoutId별 diff를 가시화한다. 이 테스트가 정합 worklist이자 최종 회귀 가드다.

**Files:**
- Create: `packages/layout/src/__tests__/layout-catalog-registry-parity.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
import { getEntry } from "@cx/layout/catalog";
import { listLayoutPatternComponents } from "@cx/layout/components";
import { describe, expect, it } from "vitest";

const entries = listLayoutPatternComponents();

describe("layout registry ↔ catalog parity", () => {
	it("모든 등록 layoutId는 catalog entry를 가진다", () => {
		const orphans = entries.filter((e) => getEntry(e.layoutId) === undefined).map((e) => e.layoutId);
		expect(orphans).toEqual([]);
	});

	it("모든 등록 layoutId는 실제 렌더 가능한 함수형 component를 가진다", () => {
		const nonRenderable = entries.filter((e) => typeof e.component !== "function").map((e) => e.layoutId);
		expect(nonRenderable).toEqual([]);
	});

	it("모든 catalog entry는 registry에 component를 가진다", () => {
		const registered = new Set(entries.map((e) => e.layoutId));
		const targets = ["screen", "region", "area", "composite"] as const;
		const dangling: string[] = [];
		for (const target of targets) {
			// getEntry는 단건 조회이므로 listCatalog로 전수 확인
		}
		// listCatalog import 후 전수 비교 (Step 2에서 보강)
		expect(dangling).toEqual([]);
	});

	it("registry-derived props가 catalog props와 일치한다", () => {
		const mismatches = entries
			.map((e) => {
				const catalogProps = Object.keys(getEntry(e.layoutId)?.props ?? {}).sort();
				const registryProps = Object.keys(e.pattern.props ?? {}).sort();
				return {
					layoutId: e.layoutId,
					registryOnly: registryProps.filter((p) => !catalogProps.includes(p)),
					catalogOnly: catalogProps.filter((p) => !registryProps.includes(p)),
				};
			})
			.filter((m) => m.registryOnly.length > 0 || m.catalogOnly.length > 0);
		expect(mismatches).toEqual([]);
	});
});
```

세 번째 it의 전수 비교는 `listCatalog`를 import해 `listCatalog().filter((c) => !registered.has(c.id)).map((c) => c.id)`로 완성한다(`import { listCatalog } from "@cx/layout/catalog"`).

- [ ] **Step 2: 실행 → 발산 worklist 확보**

Run: `node_modules/.bin/vitest run packages/layout/src/__tests__/layout-catalog-registry-parity.test.ts`
Expected: "registry-derived props가 catalog props와 일치한다" FAIL. mismatches 출력에 layoutId별 `registryOnly`/`catalogOnly` 목록이 나온다(예: `layout.area.listStack` registryOnly=["paddingX","sectionGap","slotInsetX"]). 이 출력을 Task 2의 작업 목록으로 사용.

- [ ] **Step 3: 커밋 (RED 가드 + worklist)**

```bash
git add packages/layout/src/__tests__/layout-catalog-registry-parity.test.ts
git commit -m "test(layout): add registry↔catalog parity guard (red, reconciliation worklist)"
```

---

## Task 2: JSON catalog 계약 정합 (props 진실원화) → parity GREEN

Task 1이 출력한 layoutId별 diff를 해소한다. **registry-only prop은 실제 component 구현 소비 여부로 판정**한다.

**Files:**
- Modify: `packages/layout/src/catalog/area-patterns.json`, `composite-patterns.json`, `region-patterns.json`, `screen-patterns.json` (해당 layoutId만)
- Modify: `packages/layout/src/components/patterns/registry.ts` (인라인 prop 헬퍼 호출에서 가짜 prop 제거 — 임시; Task 4에서 테이블 전체 삭제)

- [ ] **Step 1: registry-only prop 소비 검증**

worklist의 각 `registryOnly` prop에 대해 해당 pattern component 구현에서 실제 소비되는지 grep으로 확인한다. 매핑:
- area/pageStack → `packages/layout/src/components/patterns/area/page-stack/*.tsx` (`presets.ts`, `frame.tsx`, `index.tsx`)
- area/collection → `area/collection/CollectionArea.tsx`
- area/general → `area/general/GeneralArea.tsx`
- composite → `composite/CompositeWrapper.tsx`(읽는 키: `gap`,`componentGap`,`paddingX`,`paddingY`,`buttonHeight`,`height`,`minHeight`,`paddingTop`,`paddingBottom`,`width`,`flow`)
- screen → `screen/ScreenShell.tsx`
- region → `region/RegionStack.tsx`

판정:
- 구현이 소비 → 해당 JSON 파일의 그 entry `props`에 계약 추가(`{ "type": "<type>" }`, enum이면 `values` 포함). type은 registry 인라인 테이블의 동일 prop 정의를 따른다.
- 구현이 소비하지 않음/잔재 → JSON 추가하지 않음. 대신 registry 인라인 호출에서 그 prop을 제거(예: `pageStackProps()` 기본 키에서 제거, 또는 `compositeProps([...])` 인자에서 제거)해 registry도 더 이상 선언하지 않게 한다.

- [ ] **Step 2: catalogOnly prop 처리**

`catalogOnly`(JSON엔 있으나 registry가 빠뜨린 prop)는 JSON이 SOT이므로 유지. parity를 위해 registry 인라인 호출에 동일 prop을 임시 추가(Task 4에서 어차피 삭제됨). 발산이 registry-과잉(11 vs 8) 위주라 대개 비어 있음.

- [ ] **Step 3: parity GREEN 확인**

Run: `node_modules/.bin/vitest run packages/layout/src/__tests__/layout-catalog-registry-parity.test.ts`
Expected: 4 it 전부 PASS.

- [ ] **Step 4: 폐기/추가 내역 기록 + 커밋**

폐기한 registry-only prop과 JSON에 추가한 prop을 커밋 메시지에 layoutId별로 명시.

```bash
git add packages/layout/src/catalog/*.json packages/layout/src/components/patterns/registry.ts
git commit -m "refactor(layout): reconcile catalog props as the supported-prop SOT

- add component-consumed registry-only props to JSON catalog
- drop non-consumed registry-only props (listed per layoutId)
- catalog now the accurate prop contract; parity guard green"
```

---

## Task 3: composite named component + presets 신설 (area와 대칭)

composite를 area처럼 component-land의 named component로 만든다. defaults는 `composite/presets.ts`에 둔다(catalog 아님). 결과: 모든 target이 균일하게 named component.

**Files:**
- Create: `packages/layout/src/components/patterns/composite/presets.ts`
- Create: `packages/layout/src/components/patterns/composite/index.ts`
- Create: `packages/layout/src/__tests__/layout-composite-presets.test.ts`

- [ ] **Step 1: presets.ts — defaults 이관**

`registry.ts`의 `compositeLayouts` 배열(line 201~551) 각 entry의 `defaults`를 layoutId suffix(camelCase) 키로 옮긴다. `CompositeWrapperDefaults`는 `./CompositeWrapper`에 이미 존재.
```ts
import type { CompositeWrapperDefaults } from "./CompositeWrapper";

// composite defaults는 component-land에 둔다(area presets와 동일 정책). catalog는 계약만 소유.
export const compositeDefaults = {
	componentAppBar: { gap: 0 },
	componentThumbnailLarge: { gap: 0 },
	componentTextField: { gap: 0 },
	componentSectionMessage: { gap: 0 },
	componentButton: { gap: 0 },
	// …compositeLayouts의 layoutId suffix → defaults 49개 전부 1:1 복사…
	componentProductInfo: { gap: 8, paddingX: 32 },
	componentOptionCard: { gap: 4, minHeight: 74 },
	componentBannerIndicator: { gap: 10, height: 112, width: 369 },
	componentChipFilter: { flow: "horizontal", gap: 8, height: 57, paddingX: 32 },
	componentTab: { flow: "horizontal", gap: 0, height: 47 },
	componentSearchBar: { gap: 0, height: 61 },
	// …나머지…
} as const satisfies Record<string, CompositeWrapperDefaults>;
```
값은 registry 인라인과 정확히 동일(렌더 불변).

- [ ] **Step 2: index.ts — named composite component 49개**

이름은 catalog `componentID`와 일치(예: `layout.composite.componentAppBar`의 componentID = `ComponentAppBarComposite`). area의 `createPageStackArea` 패턴과 동형.
```ts
import { createCompositeWrapper } from "./CompositeWrapper";
import { compositeDefaults } from "./presets";

export const ComponentAppBarComposite = createCompositeWrapper(compositeDefaults.componentAppBar);
export const ComponentThumbnailLargeComposite = createCompositeWrapper(compositeDefaults.componentThumbnailLarge);
// …49개 전부. registry compositeLayouts의 componentID를 export 이름으로, defaults 키를 인자로…
export const ComponentProductInfoComposite = createCompositeWrapper(compositeDefaults.componentProductInfo);
```

- [ ] **Step 3: 완전성 테스트 작성 + 통과**

```ts
import { listCatalog } from "@cx/layout/catalog";
import { describe, expect, it } from "vitest";
import { compositeDefaults } from "../components/patterns/composite/presets";

describe("composite presets ↔ catalog 완전성", () => {
	it("모든 composite catalog entry는 defaults preset을 가진다", () => {
		const missing = listCatalog({ target: "composite" })
			.map((e) => e.id.replace("layout.composite.", ""))
			.filter((key) => !(key in compositeDefaults));
		expect(missing).toEqual([]);
	});

	it("preset 키는 catalog에 없는 잉여가 없다", () => {
		const ids = new Set(
			listCatalog({ target: "composite" }).map((e) => e.id.replace("layout.composite.", "")),
		);
		const extra = Object.keys(compositeDefaults).filter((k) => !ids.has(k));
		expect(extra).toEqual([]);
	});
});
```

Run: `node_modules/.bin/vitest run packages/layout/src/__tests__/layout-composite-presets.test.ts`
Expected: PASS (49 키 ↔ 49 composite entry 정합).

- [ ] **Step 4: 커밋**

```bash
git add packages/layout/src/components/patterns/composite/presets.ts packages/layout/src/components/patterns/composite/index.ts packages/layout/src/__tests__/layout-composite-presets.test.ts
git commit -m "feat(layout): add named composite components + presets (symmetric with area patterns)"
```

---

## Task 4: registry 붕괴 — named component 균일 매핑 + 인라인 테이블 삭제

registry를 `layoutId → named component` 결속만 남기고, `pattern`(props/name/children/status)을 `getEntry`에서 소싱한다. 모든 target이 named component를 직접 참조(composite도 Task 3의 named component 사용 — registry 안 익명 조립 제거).

**Files:**
- Modify: `packages/layout/src/components/patterns/registry.ts` (대폭 축소)

- [ ] **Step 1: registry 재작성**

`registry.ts`를 다음 구조로 교체. `layoutId → component` 쌍은 기존 `areaPageStackLayouts`/`areaCollectionLayouts`/`areaGeneralLayouts`/`regionStackLayouts`/`screenShellLayouts`의 `(layoutId, component)`와, composite는 기존 `compositeLayouts`의 `(layoutId, componentID)`를 Task 3의 named export로 매핑해 옮긴다.

```ts
import { getEntry } from "../../public/catalog";
import {
	AccordionListArea, ActionStackArea, /* …기존 area imports 전부… */ TextListGroupArea,
} from "./area";
import {
	ComponentAppBarComposite, /* …Task 3 named composite exports 49개 전부… */ ComponentProductInfoComposite,
} from "./composite";
import { PlainStackRegion } from "./region/RegionStack";
import { MobileScreen } from "./screen/ScreenShell";
import type { LayoutPatternComponent, LayoutPatternComponentEntry } from "./types";

// layoutId → 실제 렌더 named component. 계약 데이터(props/name/children/status)는 catalog가 소유한다.
const COMPONENTS_BY_LAYOUT_ID: Record<string, LayoutPatternComponent> = {
	// area (기존 areaPageStackLayouts/areaCollectionLayouts/areaGeneralLayouts의 layoutId→component)
	"layout.area.accordionList": AccordionListArea,
	// …area 전부…
	// region
	"layout.region.header": PlainStackRegion,
	"layout.region.contents": PlainStackRegion,
	"layout.region.bottom": PlainStackRegion,
	// screen
	"layout.screen.mobileScreen": MobileScreen,
	// composite (기존 compositeLayouts의 layoutId → Task 3 named export)
	"layout.composite.componentAppBar": ComponentAppBarComposite,
	// …composite 49개 전부…
	"layout.composite.componentProductInfo": ComponentProductInfoComposite,
};

function buildEntry(layoutId: string, component: LayoutPatternComponent): LayoutPatternComponentEntry | undefined {
	const pattern = getEntry(layoutId);
	if (!pattern) return undefined; // parity 테스트가 orphan을 잡는다
	return { component, layoutId: pattern.id, pattern, target: pattern.target };
}

const layoutPatternComponents: LayoutPatternComponentEntry[] = Object.entries(COMPONENTS_BY_LAYOUT_ID)
	.map(([id, component]) => buildEntry(id, component))
	.filter((e): e is LayoutPatternComponentEntry => e !== undefined);

export function listRegisteredLayoutPatternComponents(): LayoutPatternComponentEntry[] {
	return layoutPatternComponents;
}

export function findRegisteredLayoutPatternComponentByLayoutId(layoutId: string): LayoutPatternComponentEntry | undefined {
	return layoutPatternComponents.find((entry) => entry.layoutId === layoutId);
}

export function findRegisteredLayoutPatternComponent(patternId: string): LayoutPatternComponentEntry | undefined {
	return layoutPatternComponents.find((entry) => entry.pattern.id === patternId);
}
```

삭제 대상: `compositePropContractByKey`/`screenPropContractByKey`/`collectionPropContractByKey`/`generalAreaPropContractByKey`/`pageStackPropContractByKey` 5개 테이블, `compositeProps`/`pageStackProps`/`collectionProps`/`generalAreaProps`/`screenShellProps` 5개 헬퍼, `compositeLayouts`(defaults 포함 — Task 3 presets로 이관됨)/`areaPageStackLayouts`/`areaCollectionLayouts`/`areaGeneralLayouts`/`regionStackLayouts`/`screenShellLayouts` 배열 및 `*PatternComponents` `.map()` 빌더 전부, registry 내 `createCompositeWrapper` import 및 인라인 호출 전부.

- [ ] **Step 2: parity + 전체 layout 테스트**

Run: `node_modules/.bin/vitest run packages/layout`
Expected: parity 4 it PASS(이제 `pattern`이 catalog 소싱이라 자명), defaults 테스트 PASS, 기존 layout 테스트 PASS.

- [ ] **Step 3: 중복 잔재 grep 가드**

Run: `grep -nE "PropContractByKey|compositeProps|pageStackProps|collectionProps|generalAreaProps|screenShellProps" packages/layout/src/components/patterns/registry.ts`
Expected: 0건.

- [ ] **Step 4: 커밋**

```bash
git add packages/layout/src/components/patterns/registry.ts
git commit -m "refactor(layout): collapse registry to layoutId→component; source pattern+defaults from catalog"
```

---

## Task 5: 의존 테스트 정리 + 전체 검증 + graphify

**Files:**
- Modify (필요 시): `packages/layout/src/__tests__/layout-public-api.test.ts` (line 103~107 `entry.pattern.props` 단언이 catalog 소싱과 일치하는지 확인; 중복 검증이면 parity 테스트로 대체/축소)

- [ ] **Step 1: layout 패키지 전체**

Run: `node_modules/.bin/vitest run packages/layout`
Expected: 0 fail. 깨지면 catalog 소싱 결과에 맞춰 fixture 단언 수정(값 변경이 아니라 출처 변경이므로 의미 동일해야 함).

- [ ] **Step 2: 소비자 패키지 회귀**

Run: `node_modules/.bin/vitest run packages/renderer packages/validation packages/inference`
Expected: 0 새 실패(렌더 동작 불변, validation/inference는 JSON catalog만 소비). 기존 known-fail(App.test 1건) 제외.

- [ ] **Step 3: 전체 스위트**

Run: `node_modules/.bin/vitest run`
Expected: 리팩터 여파로 새로 깨지는 테스트 없음.

- [ ] **Step 4: graphify 갱신 + 커밋**

```bash
graphify update .
git add -A
git commit -m "test(layout): align public-api fixture with catalog-sourced pattern; refresh graphify"
```

---

## 최종 검토 (전체 구현 후)

- catalog/*.json = props·name·children·status 계약 SOT, registry = layoutId→실제 named component (계약 데이터 0) — spec End State 충족.
- 모든 target(area/region/screen/composite)이 균일하게 named component. composite도 component-land named component(`composite/presets.ts` defaults).
- catalog ↔ component 전단사 불변식(parity 테스트) 그린.
- 렌더 동작·validation·inference 불변. composite defaults 값 1:1 보존 확인.
- 폐기한 registry-only prop이 실제 미사용임을 component 구현으로 확인했는지 재검토.
