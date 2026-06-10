# @cx/layout external-thin 재구성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** `@cx/layout`을 `@cx/external`과 동일한 스캐폴딩(generated catalog/registry + 손작성 alias + canonicalize + 얇은 resolver + 1컴포넌트1파일 components/)으로 재구성한다.

**Architecture:** 컴포넌트 콜로케이션(`*.meta.ts`) → sync 스크립트가 `catalog.generated.ts`(entry) + `registry.generated.ts`(canonical component) 생성. 손작성 `catalog.alias.ts`가 layoutId→canonical componentKey. renderer는 registry+canonicalize로 직접 해석. `pattern-internal/*`·`public/*`·`catalog/*.json` 폐기.

**설계:** `docs/superpowers/specs/2026-06-09-layout-catalog-ssot-dedup-design.md`

**시작점:** 현재 브랜치 HEAD(`d3567d86`). 기존 정합된 `catalog/*.json`(L2)과 `composite/presets.ts`(L3)를 seed로 재사용한다.

**확정 결정:**
- alias = 손작성(B). composite = **behavior dedup**(registry ~15 canonical: CompositeGap0/Gap8/Gap12 + 고유 12; 49 entry는 alias→canonical, 의미는 entry.name 보존).
- public subpath = external 미러: `.`, `./catalog`, `./registry`, `./resolver`, `./canonicalize` + layout 고유 `./primitives`, `./chrome`, `./style`.
- catalog entry는 모든 layoutId 유지(83개), defaults는 entry에 없음(presets).

---

## Task 0: TDD 가드 하니스 (테스트 먼저, RED 스파인)

리팩터 의도를 6개 축으로 테스트에 고정한다. **구현 전에 작성** → 초기 RED, 각 후속 task가 자기 슬라이스를 GREEN으로 전환.

**Files (Create):**
- `packages/layout/src/__tests__/external-thin/public-surface.test.ts` (축1: 데이터 export 표면)
- `packages/layout/src/__tests__/external-thin/catalog-generated.test.ts` (축2: catalog.generated 무결성)
- `packages/layout/src/__tests__/external-thin/registry-generated.test.ts` (축4: registry = 실제 React component surface)
- `packages/layout/src/__tests__/external-thin/resolver-readonly.test.ts` (축5: resolver read-only)
- `packages/layout/src/__tests__/external-thin/alias-registry-integrity.test.ts` (축3: alias/registry 무결성)
- `packages/layout/src/__tests__/external-thin/consumer-boundary.test.ts` (consumer boundary 고정)
- `packages/renderer/src/__tests__/layout-external-thin-connection.test.tsx` (축6: renderer 실제 렌더 연결)

**green-after 매핑:** public-surface→T10, catalog-generated→T8, registry-generated→T8, resolver-readonly→T9, alias-registry-integrity→T7~9, consumer-boundary→T11, renderer-connection→T11.

- [ ] **Step 1: 6개 축 테스트 작성** (내용은 design의 불변식 + 아래 사용자 지정)
  - 축1 public surface: `package.json.exports`가 `.`/`./catalog`/`./registry`/`./resolver`/`./canonicalize` 보유, `./components`·`./contract`·`./mutations` 미보유. external과 동일 코어 surface(parity).
  - 축2 catalog.generated: 모든 entry `key===id`, target ∈ {screen,region,area,composite}, props 계약 shape, status 유효. id 중복 없음.
  - 축4 registry.generated: 모든 export가 함수형(React component).
  - 축5 resolver: `getLayoutCatalogEntry`/`getLayoutCatalogIds`/`getLayoutCatalogStatus`/`listLayoutCatalog`/`resolveLayoutCatalogForInference` 노출, mutation·`resolveLayoutComponent` 미노출(read-only).
  - 축3 alias/registry: 모든 catalog id ∈ alias 키, 모든 alias 값 ∈ registry export(함수형), 모든 catalog id → `canonicalizeLayout` → registry component.
  - consumer boundary: 리포 내 `@cx/layout/{catalog,components,mutations,contract}` import 0(layout 패키지 제외).
  - 축6 renderer: layoutId 노드 렌더 시 실제 component DOM 출력(registry+canonicalize 경로).
- [ ] **Step 2: 실행 → RED 확인** `node_modules/.bin/vitest run packages/layout/src/__tests__/external-thin packages/renderer/src/__tests__/layout-external-thin-connection.test.tsx` — 대부분 RED(모듈 미존재). 이게 구현 목표 스파인.
- [ ] **Step 3: 커밋** `test(layout): add external-thin TDD guard harness (6 axes, red spine)`

---

## Task 1: catalog 타입 + meta 헬퍼

**Files:** Create `packages/layout/src/catalog-types.ts`

- [ ] **Step 1: 타입 정의** — external `ComponentCatalogEntry`와 평행.
```ts
export type LayoutPatternTarget = "screen" | "region" | "area" | "composite";
export type LayoutPatternPropType = "array" | "boolean" | "enum" | "node" | "number" | "object" | "string";
export type LayoutPatternPropContract = { type: LayoutPatternPropType; aiWritable?: boolean; description?: string; required?: boolean; values?: string[]; };
export type LayoutPatternChildrenContract = { accepts: "any" | "area" | "area-or-component" | "component" | "none" | "region"; max?: number; min?: number; };
export type LayoutCatalogStatus = "stable" | "draft" | "deprecated";
export type LayoutCatalogEntry = {
  id: `layout.${LayoutPatternTarget}.${string}`;
  target: LayoutPatternTarget;
  name: string;
  props?: Record<string, LayoutPatternPropContract>;
  children?: LayoutPatternChildrenContract;
  description?: string;
  status?: LayoutCatalogStatus;
};
export type LayoutCatalogMeta = LayoutCatalogEntry; // meta = entry 계약 (defaults 미포함)
```
- [ ] **Step 2: 커밋** `feat(layout): add external-parallel catalog entry types`

---

## Task 2: sync 스크립트 골격 + zod 검증 이관

**Files:** Create `scripts/sync-layout-catalog/index.ts`, `scripts/sync-layout-catalog/schema.ts`; package.json `"sync:layout"` script.

- [ ] **Step 1: zod 스키마 이관** — 기존 `packages/layout/src/pattern-internal/schema.ts`의 `layoutPatternCatalogEntrySchema`/prop/children 스키마를 `scripts/sync-layout-catalog/schema.ts`로 옮긴다(런타임 패키지에서 제거). `defaults` 없이 entry 계약만 검증.
- [ ] **Step 2: 생성기 작성** — `components/**/*.meta.ts` glob 수집 → 각 `export const meta` 읽어 zod 검증 → 정렬·중복 id 검사:
  - `catalog.generated.ts` emit: `export const layoutCatalog: Record<string, LayoutCatalogEntry> = { [id]: entry, … }`
  - `registry.generated.ts` emit: `catalog.alias.ts`의 canonical componentKey 집합을 모아, 각 컴포넌트 파일에서 `export { <Key> } from "./components/.../<Key>"` 생성. (componentKey→파일경로 매핑은 컴포넌트 파일이 그 이름으로 export하는 것을 스캔하거나, alias 값 집합 기준.)
- [ ] **Step 3: 멱등성 테스트** — `node_modules/.bin/tsx scripts/sync-layout-catalog` 두 번 실행 시 산출물 byte 동일.
- [ ] **Step 4: 커밋** `feat(layout): add sync-layout-catalog generator (zod validation moved from runtime)`

---

## Task 3: primitives 정리

**Files:** `packages/layout/src/components/primitives/*` (이미 Flex/Grid/Stack/PageStack/BottomFixedArea 개별 파일 존재 — 확인·index 정리만)

- [ ] **Step 1** primitives/index.ts가 5개 primitive를 export하는지 확인, 누락 보강. (구조 변경 거의 없음)
- [ ] **Step 2: 커밋** (변경 있으면) `refactor(layout): tidy primitives barrel`

---

## Task 4: regions + chromes 1파일화 + meta

**Files:** `packages/layout/src/components/regions/*`, `packages/layout/src/components/chromes/*` (기존 `chrome/`, `components/patterns/region/` 이동)

- [ ] **Step 1: regions** — `RegionStack.tsx`(엔진, 기존 region/RegionStack.tsx 이동). region 3개(header/contents/bottom)는 모두 `PlainStackRegion` behavior → canonical 1개. 각 entry meta 작성: `regions/header.meta.ts`, `contents.meta.ts`, `bottom.meta.ts` (target:"region", props:{}, children:{accepts:"area-or-component"}, status). componentKey = `PlainStackRegion`.
- [ ] **Step 2: chromes** — 기존 `chrome/`(AppScreen/AppScreenRoot/ScreenRegion/SystemHeader/icons)를 `components/chromes/`로 이동. screen entry meta: `chromes/mobileScreen.meta.ts` (target:"screen", componentKey=`MobileScreen`). `@cx/layout/chrome` subpath는 `components/chromes/index.ts`로 재지정.
- [ ] **Step 3: 커밋** `refactor(layout): move regions/chromes to components/, add meta`

---

## Task 5: areas 1파일화 + 등가류 계산 + meta

**Files:** `packages/layout/src/components/areas/{general,page-stack,collection}/*`

- [ ] **Step 1: 엔진 유지** — `general/GeneralArea.tsx`, `page-stack/PageStackFrame.tsx`(기존 frame.tsx), `collection/CollectionArea.tsx`, 각 `presets.ts` 유지/이동.
- [ ] **Step 2: 등가류 계산** — page-stack(12)·collection(13)·general(5) 각 preset defaults를 정규화해 동일 defaults끼리 묶는다(L3에서 composite에 쓴 방식). canonical = behavior별 1개. 이미 확인된 동일쌍: `noticeAccordionStackArea ≡ plainInfoTextListArea`, `fieldStack ≡ tabChipSearchAccordionArea`.
- [ ] **Step 3: canonical 컴포넌트 파일** — behavior별 canonical 컴포넌트를 named .tsx로(예: `page-stack/ListStackArea.tsx` 등 대표 1개씩). general 5개는 각 distinct(AreaVertical/BottomActionArea/ProductHeroSummaryArea/ProductFooterLegalArea/AreaAppBarArea).
- [ ] **Step 4: entry meta** — area entry 30개 각각 `<id>.meta.ts`(props는 기존 정합된 area-patterns.json에서 seed, target/name/children/status). 동일 폴더 colocation.
- [ ] **Step 5: 커밋** `refactor(layout): split areas into per-file canonical components + entry meta`

---

## Task 6: composites behavior dedup + meta

**Files:** `packages/layout/src/components/composites/*`

- [ ] **Step 1: canonical 컴포넌트** — `CompositeWrapper.tsx`(엔진) 유지. 등가류 15개를 named .tsx로: `CompositeGap0.tsx`(`createCompositeWrapper({gap:0})`), `CompositeGap8.tsx`, `CompositeGap12.tsx`, + 고유 12개(`ComponentBannerIndicatorComposite.tsx` 등, presets 값 1:1). presets.ts(L3)에서 값 재사용.
- [ ] **Step 2: entry meta** — composite entry 49개 각각 `<id>.meta.ts`(props는 기존 정합 composite-patterns.json seed, name 보존). `composites/` 폴더 colocation.
- [ ] **Step 3: 커밋** `refactor(layout): dedup composites to 15 canonical + 49 entry meta`

---

## Task 7: catalog.alias.ts 손작성

**Files:** Create `packages/layout/src/catalog.alias.ts`

- [ ] **Step 1** — 모든 layoutId(83) → canonical componentKey 매핑. composite 49→15(behavior), area 30→canonical, region 3→PlainStackRegion, screen 1→MobileScreen. 등가류 계산 결과 사용.
- [ ] **Step 2: 커밋** `feat(layout): hand-authored catalog.alias (layoutId -> canonical componentKey)`

---

## Task 8: catalog.generated / registry.generated 생성

- [ ] **Step 1** `pnpm sync:layout` 실행 → `catalog.generated.ts`(83 entry) + `registry.generated.ts`(canonical export) 생성.
- [ ] **Step 2: diff 가드** — 생성된 catalog의 (id·target·props 키·status) 집합이 기존 `catalog/*.json` 집합과 일치하는지 비교 테스트. 불일치 시 meta 누락/오타 수정.
- [ ] **Step 3: 커밋** `feat(layout): generate catalog.generated + registry.generated`

---

## Task 9: resolver.ts + canonicalize-catalog.ts

**Files:** Create `packages/layout/src/resolver.ts`, `packages/layout/src/canonicalize-catalog.ts`

- [ ] **Step 1: resolver** (external 미러)
```ts
import { layoutCatalog } from "./catalog.generated";
export { layoutCatalog };
export function getLayoutCatalogEntry(id: string) { return layoutCatalog[id]; }
export function getLayoutCatalogIds() { return Object.keys(layoutCatalog).sort(); }
export function getLayoutCatalogStatus(id: string) { return layoutCatalog[id]?.status; }
export function listLayoutCatalog(opts: { target?: LayoutPatternTarget; status?: LayoutCatalogStatus } = {}) {
  return Object.values(layoutCatalog).filter((e) => (!opts.target || e.target === opts.target) && (!opts.status || e.status === opts.status));
}
export function resolveLayoutCatalogForInference(): LayoutCatalogObject { /* 기존 catalog.ts 형태 유지: kind/owner/sourceRef/version/schemaVersion + data{screen,region,area,composite} */ }
```
- [ ] **Step 2: canonicalize** — `assertAliasIntegrity()`(모든 catalog id∈alias, 모든 alias값∈registry export; 모듈 로드 throw) + `canonicalizeLayout(id)=layoutAlias[id]`.
- [ ] **Step 3: 가드 테스트** — alias 무결성 + 모든 catalog id가 canonicalize→registry component(함수형)로 해석.
- [ ] **Step 4: 커밋** `feat(layout): resolver (catalog read) + canonicalize-catalog (alias integrity)`

---

## Task 10: 폐기 + package.json exports 정렬

- [ ] **Step 1: 삭제** — `pattern-internal/*`, `public/*`, `catalog/*.json`, `canonical/*`, 기존 `components/patterns/registry.ts`, `components/patterns/` 잔재, `types.ts`(LAYOUT_PROP_CONTRACTS는 `components/primitives/` 또는 신규 `layout-node-contracts.ts`로 보존). 기존 `__tests__` 중 폐기 API 의존분 정리.
- [ ] **Step 2: index.ts + exports** — `package.json` exports를 external 미러로 교체: `.`, `./catalog`, `./registry`, `./resolver`, `./canonicalize`, `./primitives`, `./chrome`, `./style`. `./components`/`./contract`/`./mutations`/`./catalog`(구)·`./resolver`(구) 제거.
- [ ] **Step 3: 커밋** `refactor(layout): drop pattern-internal/public/json, align exports with external`

---

## Task 11: 소비자 재배선 + 전체 검증

**Files:** renderer `resolve-layout.tsx`, inference `knowledge-base.ts`, validation `validators.ts`

- [ ] **Step 1: renderer** — `@cx/layout/components` `findLayoutPatternComponentByLayoutId` 제거. `@cx/layout/registry`(전체 import) + `@cx/layout/canonicalize` `canonicalizeLayout`로 `registry[canonicalizeLayout(node.layout)]` 해석(external resolve-component.tsx와 동형). pattern 메타가 필요하면 `@cx/layout/resolver` `getLayoutCatalogEntry`.
- [ ] **Step 2: inference** — `@cx/layout/catalog` → `@cx/layout/resolver` `resolveLayoutCatalogForInference`.
- [ ] **Step 3: validation** — `@cx/layout/catalog` `findPattern` → `@cx/layout/resolver` `getLayoutCatalogEntry`. `LAYOUT_PROP_CONTRACTS` import 경로를 Task 10의 새 위치로.
- [ ] **Step 4: 전체 검증**
  - `node_modules/.bin/vitest run packages/layout packages/renderer packages/validation packages/inference` — pre-existing 2건(App.test, bottomActionArea CTA) 외 새 실패 0.
  - `node_modules/.bin/vitest run` 전체.
  - `grep -rn "@cx/layout/\(catalog\|components\|mutations\|contract\)" packages apps --include=*.ts --include=*.tsx | grep -v packages/layout` → 0.
  - `ls packages/layout/src/{pattern-internal,public,catalog,canonical} 2>/dev/null` → 없음.
- [ ] **Step 5: graphify + 커밋** `graphify update .`; `refactor(layout): rewire consumers to resolver/registry/canonicalize; external-thin complete`

---

## 최종 검토
- layout 디렉터리 = external 미러(generated catalog/registry, 손 alias, canonicalize, 얇은 resolver, 1컴포넌트1파일 components/).
- entry 데이터 모델·resolver API external 동형. renderer가 registry+canonicalize로 직접 해석.
- 생성 catalog == 기존 entry 집합(diff 가드), alias 무결성, 렌더 동작 불변, 새 테스트 실패 0.
- composite 49→15 canonical(behavior), 의미는 entry.name 보존.
