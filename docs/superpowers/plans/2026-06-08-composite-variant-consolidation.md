> **STATUS: WITHDRAWN — do not execute (2026-06-08).** Cancelled after deeper inspection showed the
> render-based dedup is the wrong signal for composite, for two reasons:
> 1. **Semantic conflation.** The generic `createCompositeWrapper` makes single-component slots
>    (`componentAppBar` = place one AppBar) render IDENTICALLY to multi-component composites
>    (`compositeSummaryFilteredTextList` = CardSummary + TitleSection + Chip + TextListGroup;
>    `compositeProductHeroMediaInfo` = ThumbnailLarge + ProductInfo). Collapsing them into one
>    `componentSingle` would be semantically wrong — they hold different numbers/kinds of components.
>    The empty-children render cannot see this; the catalog's value IS that compositional intent.
> 2. **SSOT drift.** registry props ≠ JSON props for some ids (e.g. `componentActionButton`: JSON has
>    `buttonHeight,gap,paddingBottom,paddingTop,paddingX` but the probe grouped it via registry props).
>    So the probe's "duplicate" groups are not even a faithful view of the AI-facing catalog.
> Conclusion: composite is NOT cleanly consolidatable the way area was; its variety is real
> compositional vocabulary, not name-only redundancy. Area consolidation (commit `99e81ea7`) stands
> and was correct. If composite is ever revisited, dedup must key on the AI-facing JSON contract AND
> respect child cardinality/intent — not rendered markup.

# Composite Layout Variant Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse render-identical `layout.composite.*` layouts — above all the 18 single-component wrappers that differ only by name — to one canonical each, preserving each collapsed entry's intent via the existing `usedFor` vocabulary field, so the AI composite catalog stops offering ~23 redundant choices.

**Architecture:** Same two-SSOT shape as the area consolidation (commit `99e81ea7`): `registry.ts` `compositeLayouts[]` (layoutId → React component, render-time) and `catalog/composite-patterns.json` (AI-facing, flows via `listCatalog` → `resolveLayoutCatalogForInference`). All composite layouts are built by ONE generic `createCompositeWrapper(defaults)` that just renders `{children}` in a stack — it does NOT inject any component; the `componentID`/`name`/`description` are metadata only. So render-identical composites are true duplicates distinguished only by intent text. `usedFor` (schema field already added for area) is reused.

**Tech Stack:** TypeScript, pnpm monorepo (no build step), Vitest (globals), React, zod, Biome.

---

## Background facts (verified, do not re-investigate)

- **`createCompositeWrapper` is generic** (`packages/layout/src/components/patterns/composite/CompositeWrapper.tsx`): renders a vertical/horizontal stack of `children`. No component binding by `componentID`. `children.accepts: "component"` is generic.
- **`usedFor` field already exists** on `layoutPatternCatalogEntrySchema` (`pattern-internal/schema.ts`) and flows to the AI catalog untyped (`LayoutCatalogData.composite` is `unknown[]`). No schema change needed.
- **Probe result (render + prop-keys dedup, 3-child render):** composite = 49 entries → **26 distinct → 23 redundant**. region = 3→1 (LIKELY a false positive — positional semantics not captured; OUT OF SCOPE). screen = 4→4 (clean). area already consolidated.
- **Confirmed composite duplicate groups (verbatim from probe):**
  - **G-single (18)**: `componentAppBar, componentThumbnailLarge, componentTextField, componentSectionMessage, componentListCell, componentAccordion, componentCheckbox, componentCardSummary, componentBadge, componentTextButton, componentListText, componentMapBlock, componentStoreCard, componentTitleSection, compositeSummaryFilteredTextList, compositeSummarySectionedInfoList, compositeProductHeroMediaInfo, componentActionButton` — all `defaults:{gap:0}` + `compositeProps(["gap"])`.
  - **G-a**: `componentFooter, compositeStoreMapList`
  - **G-b**: `compositeTitleInfoTextList, compositePriceAccordionSelectedList`
  - **G-c**: `compositeProductListFilterSort, compositePagestackProductCardList, compositeProductDetailRichImageTab`
  - **G-d**: `compositeListProductHorizontalCardSet, compositeListProductRowCardSet`
  - **G-e**: `compositeMapCardInfoList, compositeCardInfoBrandList`
  - Note `componentButton` is NOT a duplicate (it has `compositeProps(["fullWidth","gap","size"])`) — keep it.

## Decisions to confirm (resolve before Task 4)

1. **G-single canonical id.** 18 identical single-component wrappers. Two options:
   - (a) Introduce ONE neutral id `layout.composite.componentSingle` (name "단일 컴포넌트"), delete all 18, fold their 18 names/descriptions into its `usedFor`. Cleanest, but a NEW id the AI must learn and a bigger change.
   - (b) Keep one existing id as canonical (e.g. `componentSingleSlot`-style — pick the most neutral existing, or rename `componentAppBar` → neutral), fold the other 17.
   Recommendation: (a) a neutral `componentSingle` — the wrapper IS generic, so a generic id is honest. Confirm.
2. **Smaller groups (G-a..G-e) canonicals.** Same rule as area: keep the most generic-named id, fold the rest as `usedFor`. Confirm per group in Task 3 from the probe output.

## Hard gate (Task 1) — must pass or STOP

If anything resolves a composite by its `componentID` to auto-select which component to render (i.e. the 1:1 name↔component mapping is behavioral, not metadata), collapsing G-single is UNSAFE. Task 1 verifies this is not the case.

---

## Task 1: Gate — confirm `componentID` is metadata, not behavior

**Files:** none (investigation; record result in this plan).

- [ ] **Step 1: Search every consumer of composite `componentID` / layoutId**

```bash
grep -rn "ComponentAppBarComposite\|componentID" packages/layout/src/public packages/layout/src/components/patterns/composite packages/inference packages/agent apps/web/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__
grep -rn "layout.composite\." packages apps --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v catalog
```

- [ ] **Step 2: Confirm no component auto-injection**

Read `createCompositeWrapper` and the resolver (`public/resolver.ts`, `public/components.ts`). Confirm: the wrapper renders `children` only; nothing maps `componentID` → a specific render component. Also confirm no stored data references `layout.composite.*` ids:

```bash
grep -rln '"layout.composite.' database data 2>/dev/null || echo "no data refs (safe)"
```

- [ ] **Step 3: Record verdict**

Write `## Gate result` in this plan: `SAFE` (componentID is metadata; no data refs) or `BLOCKED` with the exact consumer found. If BLOCKED, stop and escalate — do not proceed.

## Task 2: Authoritative composite duplicate set + vocabulary capture

**Files:**
- Create: `packages/layout/src/__tests__/composite-variant-dedup.report.test.ts` (temporary, deleted in Task 6)

- [ ] **Step 1: Write the report harness (scoped to composite)**

```ts
import { createElement } from "react";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "vitest";
import { listRegisteredLayoutPatternComponents } from "../components/patterns/registry";

describe("composite variant dedup report", () => {
  it("prints duplicate groups", () => {
    const entries = listRegisteredLayoutPatternComponents();
    const children = ["A", "B", "C"].map((k) =>
      createElement("div", { key: k, "data-fixture": k }, k),
    );
    const byKey = new Map<string, string[]>();
    for (const e of entries) {
      if (!e.layoutId.startsWith("layout.composite.")) continue;
      const Comp = e.component as ComponentType<Record<string, unknown>>;
      let markup = "";
      try {
        markup = renderToStaticMarkup(
          createElement(Comp, { metadata: { id: "fx", title: "T" }, props: {} }, ...children),
        );
      } catch (err) { console.log("RENDER ERROR:", e.layoutId, String(err)); continue; }
      const propKeys = Object.keys(e.pattern?.props ?? {}).sort().join(",");
      const key = `${markup}::props[${propKeys}]`;
      byKey.set(key, [...(byKey.get(key) ?? []), e.layoutId]);
    }
    for (const [, ids] of byKey) if (ids.length > 1) console.log("DUP GROUP:", ids.join("  "));
  });
});
```

- [ ] **Step 2: Run and confirm against Background**

Run: `pnpm exec vitest run packages/layout/src/__tests__/composite-variant-dedup.report.test.ts --reporter=verbose`
Expected: the 6 groups in Background (G-single + G-a..G-e). If they differ, the Background list is stale — use the live output as truth.

- [ ] **Step 3: Capture each fold-in's name + description from the JSON**

```bash
node -e "const c=require('./packages/layout/src/catalog/composite-patterns.json'); const m=new Map(c.patterns.map(p=>[p.id,p])); for(const id of process.argv.slice(1)){const p=m.get('layout.composite.'+id); console.log('•',id,'\n  name:',p?.name,'\n  desc:',p?.description);}" componentAppBar componentThumbnailLarge componentTextField componentSectionMessage componentListCell componentAccordion componentCheckbox componentCardSummary componentBadge componentTextButton componentListText componentMapBlock componentStoreCard componentTitleSection compositeSummaryFilteredTextList compositeSummarySectionedInfoList compositeProductHeroMediaInfo componentActionButton componentFooter compositeStoreMapList compositeTitleInfoTextList compositePriceAccordionSelectedList compositeProductListFilterSort compositePagestackProductCardList compositeProductDetailRichImageTab compositeListProductHorizontalCardSet compositeListProductRowCardSet compositeMapCardInfoList compositeCardInfoBrandList
```

Record the output — these become the `usedFor` `{intent: name, description}` items.

- [ ] **Step 4: Commit the harness**

```bash
git add packages/layout/src/__tests__/composite-variant-dedup.report.test.ts
git commit -m "test(layout): temporary composite-variant dedup report harness"
```

## Task 3: Canonical + merge table

**Files:** none (record under `## Resolved composite removals` in this plan).

- [ ] **Step 1: Decide canonical per group + build the usedFor lists from Task 2 Step 3 output**

For G-single use the Decision-1 answer (recommended new `layout.composite.componentSingle`). For G-a..G-e keep the most generic-named id. Produce a table: `canonical | fold-in ids | usedFor items`. Also note each fold-in's registry `componentID` + the exported component symbol (from `compositeLayouts` in `registry.ts`) and whether the JSON entry's `componentID` is referenced anywhere (should be nowhere per Task 1).

## Task 4: AI catalog JSON — merge usedFor + delete fold-ins

**Files:**
- Modify: `packages/layout/src/catalog/composite-patterns.json`

- [ ] **Step 1: (If Decision-1 = new id) add the canonical `componentSingle` entry**

```jsonc
{
  "id": "layout.composite.componentSingle",
  "target": "composite",
  "name": "단일 컴포넌트",
  "description": "단일 render component를 컴포넌트 패턴으로 배치하는 제네릭 wrapper. 어떤 컴포넌트를 담는지는 children으로 결정.",
  "componentID": "ComponentSingleComposite",
  "props": { "gap": { "type": "number" } },
  "children": { "accepts": "component" },
  "status": "draft",
  "usedFor": [ /* the 18 G-single {intent,description} items from Task 3 */ ]
}
```

- [ ] **Step 2: For G-a..G-e, add `usedFor` (after `description`) to each canonical and delete the fold-in entries**

Mirror the area Task 4: each canonical gains its folded siblings' `{intent,description}`; each fold-in `{ "id": ... }` object is removed. For G-single (new-id option) delete ALL 18 originals.

- [ ] **Step 3: Verify the catalog parses + usedFor present**

```bash
pnpm exec vitest run packages/layout/src/__tests__/layout-schema.test.ts
node -e "const c=require('./packages/layout/src/catalog/composite-patterns.json'); console.log('composite count:', c.patterns.length)"
```
Expected: schema test PASS; count = 49 − (fold-ins removed) + (1 if new componentSingle added). With Decision-1(a): 49 − 18 − (G-a..G-e fold-ins) + 1.

- [ ] **Step 4: biome + commit**

```bash
pnpm exec biome check --write packages/layout/src/catalog/composite-patterns.json
git add packages/layout/src/catalog/composite-patterns.json
git commit -m "refactor(layout): fold duplicate composite variants into canonical usedFor vocabulary"
```

## Task 5: registry + CompositeWrapper exports

**Files:**
- Modify: `packages/layout/src/components/patterns/registry.ts`
- Modify: `packages/layout/src/components/patterns/composite/CompositeWrapper.tsx` (+ wherever the composite components are exported/created)

- [ ] **Step 1: (If new id) register `componentSingle`**

Add a `compositeLayouts` entry `{ component: ComponentSingleComposite, componentID: "ComponentSingleComposite", layoutId: "layout.composite.componentSingle", name: "단일 컴포넌트", props: compositeProps(["gap"]) }` and create/export its component via `createCompositeWrapper({ gap: 0 })`.

- [ ] **Step 2: Delete the fold-in `compositeLayouts` entries + their component exports**

Remove each fold-in's `compositeLayouts[]` object and its `export const <X>Composite = createCompositeWrapper({...})` (find these in the composite component module(s) — grep the symbol from Task 3). Remove now-unused imports in `registry.ts`.

- [ ] **Step 3: No dangling refs + typecheck**

```bash
grep -rn "<deleted composite component symbols, pipe-joined>" packages apps --include="*.ts" --include="*.tsx" | grep -v node_modules
pnpm exec tsc --noEmit --pretty false --incremental false
```
Expected: no matches; tsc exit 0.

- [ ] **Step 4: registry ↔ JSON composite parity**

```bash
grep -c 'layoutId: "layout.composite.' packages/layout/src/components/patterns/registry.ts
node -e "const c=require('./packages/layout/src/catalog/composite-patterns.json'); console.log(c.patterns.filter(p=>p.target==='composite').length)"
```
Expected: equal.

- [ ] **Step 5: biome + commit**

```bash
pnpm exec biome check --write packages/layout/src/components/patterns
git add packages/layout/src/components/patterns
git commit -m "refactor(layout): drop duplicate composite layouts from registry/components"
```

## Task 6: Verify, retarget tests, clean up

**Files:**
- Delete: `packages/layout/src/__tests__/composite-variant-dedup.report.test.ts`
- Modify: any test referencing a removed `layout.composite.*` id

- [ ] **Step 1: Find tests referencing removed composite ids**

```bash
grep -rn "layout.composite\.\(componentAppBar\|componentThumbnailLarge\|...all fold-ins...\)" packages apps --include="*.ts" --include="*.tsx" | grep -v node_modules
```
Retarget each to its canonical (same render → assertions hold). If a public-API test enumerates composite ids, update the list.

- [ ] **Step 2: Re-run probe — expect zero composite duplicates**

Run the harness again; expect zero `DUP GROUP:`.

- [ ] **Step 3: Delete harness**

```bash
git rm packages/layout/src/__tests__/composite-variant-dedup.report.test.ts
```

- [ ] **Step 4: Full tests + tsc**

Run: `pnpm exec vitest run packages/layout packages/renderer` → all pass.
Run: `pnpm exec tsc --noEmit --pretty false --incremental false` → exit 0.

- [ ] **Step 5: commit**

```bash
git add -A
git commit -m "test(layout): retarget removed composite ids to canonicals; drop dedup harness"
```

## Follow-ups (do NOT do here)

- `region` 3→1 probe hit is likely a false positive (positional semantics). Verify with a multi-region render before any region change — separate.
- Composition prompt (`@cx/agent`) still does not read `usedFor` — prompt tuning is separate.
- Two-SSOT (registry.ts vs catalog JSON) generation — separate.
