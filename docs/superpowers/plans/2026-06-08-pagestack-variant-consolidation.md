# PageStack Area Variant Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse render-identical `layout.area.*` PageStack variants to one canonical id each, while preserving every collapsed variant's "when to use" meaning as a new `usedFor` vocabulary field on the surviving entry — so the AI composition catalog has one choice per distinct render but keeps the semantic guidance.

**Architecture:** Layout patterns have two hand-maintained sources of truth that both list `layout.area.*` ids: `packages/layout/src/components/patterns/registry.ts` (TS, layoutId → React component, render-time) and `packages/layout/src/catalog/area-patterns.json` (JSON, AI/inference-facing catalog). The JSON entries flow verbatim to the AI via `listCatalog()` → `resolveLayoutCatalogForInference()` (`public/catalog.ts`). We add a `usedFor` field to the catalog entry schema; because `listCatalog` returns raw parsed entries, the field reaches the AI with no other wiring. Consolidation = add schema field → compute true duplicates → merge collapsed siblings' vocabulary into the canonical entry's `usedFor` → delete sibling entries from JSON + registry + component code.

**Tech Stack:** TypeScript, pnpm monorepo (no build step; packages resolve via `src/index.ts`), Vitest (globals), Biome, tsx, zod (catalog schema).

---

## Background facts (verified, do not re-investigate)

- **Dedup key = rendered output + prop contract, NOT name.** Two layoutIds are true duplicates only if BOTH their resolved defaults (`presets.ts` / `CollectionArea.tsx`) AND their registry prop contract (`pageStackProps(...)` / `collectionProps(...)`) are identical. The `name`/`description` are advisory AI hints — that is exactly the meaning we preserve in `usedFor`.
- **The AI sees raw catalog entries.** `public/catalog.ts:listCatalog()` returns `layoutPatternCatalogSchema`-parsed JSON entries unchanged; `resolveLayoutCatalogForInference()` puts them in `data.area`. `LayoutCatalogData.area` is typed `unknown[]` (`packages/schema/src/inference-reference.ts:75`), so a new entry field needs no @cx/schema type change.
- **Safe to delete ids.** No stored data references `layout.area.*` (`grep -r '"layout.area.' database data` → empty).
- **`titleMode` already removed** (commit `ffc89a76`); that is why several variants now collapse.
- **Out of scope (final follow-up only):** `layout.composite.*` (49 entries) carries a parallel duplicate set; the two-SSOT smell (registry.ts vs catalog JSON); whether the composition prompt actually reads `usedFor` (prompt tuning lives in `@cx/agent`).

## Confirmed true-duplicate groups (page-stack presets)

`pageStackBaseDefaults` = `{itemPaddingX:20, itemTemplate:"default-20", paddingY:28, sectionPaddingX:12, titleGap:8}`. Verified against `presets.ts` defaults + `registry.ts` prop contracts:

- **P1** — `{gap:12}` + `pageStackProps()`: `fieldStack`, `checkboxStack`, `messageStack`. (`authCodeEntry` and `tabChipSearchAccordionArea` share defaults but have DIFFERENT props → not duplicates, keep.)
- **P2** — `{divider:"contents", gap:0, titleGap:0}` + `pageStackProps()`: `deliveryInfoAccordionArea`, `priceAccordionStackArea`, `productDisclosureAccordion`.
- **P3** — `{divider:"contents", gap:0, titleGap:12}` + `pageStackProps(["rowCount"])`: `pagestackInfoTextSection`, `textListGroupArea`.

Collection-area groups are computed in Task 2 (their `collectionProps([...])` contracts vary and must be compared programmatically).

## Resolved decisions

- **Approach A** chosen: canonical entry + `usedFor` vocabulary. No `rendersAs` pointer, no two-layer catalog, no alias resolution mechanism.
- **`usedFor` shape:** `Array<{ intent: string; description?: string }>` where `intent` = collapsed sibling's `name`, `description` = collapsed sibling's `description`.
- **Canonical per group (page-stack):** P1 → `fieldStack`; P2 → `productDisclosureAccordion`; P3 → `textListGroupArea`. (Collection canonicals decided in Task 3 Step 1 from Task 2 output, same rule: keep the most generically-named id.)

## Resolved removals (authoritative, from Task 2 3-child dedup report)

10 fold-in ids removed; 6 canonical survivors gain `usedFor`. The dedup key is rendered markup (3 children, so `divider` differences surface) + prop-contract keys.

| canonical (keep) | fold-in (remove → usedFor on canonical) |
| ---------------- | --------------------------------------- |
| `layout.area.fieldStack` | `checkboxStack`, `messageStack` |
| `layout.area.noticeAccordionStackArea` | `accordionNoticeListArea` |
| `layout.area.productDisclosureAccordion` | `deliveryInfoAccordionArea`, `priceAccordionStackArea` |
| `layout.area.textListGroupArea` | `pagestackInfoTextSection` |
| `layout.area.rowCardListArea` | `productMoreLinkArea`, `richImageTabArea`, `productListSortOnlyArea` |
| `layout.area.cardInfoBrandListArea` | `couponBenefitArea` |

`usedFor` content per canonical (intent = fold-in `name`, description = fold-in `description`):
- **fieldStack**: `{체크박스 스택, 체크/동의 항목 묶음 세로 배치}`, `{메시지 스택, 안내/상태 메시지 묶음 세로 배치}`
- **noticeAccordionStackArea**: `{공지 아코디언 리스트 영역, AccordionNoticeInfo row를 Divider로 구분해 반복 배치}`
- **productDisclosureAccordion**: `{배송 정보 아코디언 영역, 배송/수령 안내를 accordion으로 접어 표시}`, `{가격 아코디언 스택 영역, AccordionPriceInfo row를 PageStack에서 반복 배치}`
- **textListGroupArea**: `{페이지스택 정보 텍스트 섹션, TitleSection 다음 InfoTextList 묶음을 Divider로 구분}`
- **rowCardListArea**: `{상품 더보기 링크 영역, ButtonMore 더보기 affordance만 배치}`, `{탭 포함 상세 이미지 영역, UnderlineTab 이후 상세 이미지+ButtonMore}`, `{상품 리스트 정렬 단독 영역, Chip 없이 FilterSorting만 앞에 배치}`
- **cardInfoBrandListArea**: `{쿠폰 혜택 영역, Coupon layer를 Coupon surface로 배치}`

Backing: G1–G4 fold-ins are page-stack presets (`presets.ts` + `index.tsx`); G5–G6 fold-ins are collection exports (`CollectionArea.tsx`).

---

## Task 1: Add `usedFor` to the catalog entry schema

**Files:**
- Modify: `packages/layout/src/pattern-internal/schema.ts:106-115` (`layoutPatternCatalogEntrySchema`)
- Test: `packages/layout/src/__tests__/layout-schema.test.ts`

- [ ] **Step 1: Write a failing test that the schema accepts `usedFor`**

In `layout-schema.test.ts`, add:

```ts
it("accepts a usedFor vocabulary on a catalog entry", () => {
  const entry = layoutPatternCatalogEntrySchema.parse({
    id: "layout.area.fieldStack",
    target: "area",
    name: "필드 스택",
    componentID: "FieldStackArea",
    usedFor: [
      { intent: "체크박스 스택", description: "동의/선택 체크박스 묶음" },
      { intent: "메시지 스택" },
    ],
  });
  expect(entry.usedFor?.[0]?.intent).toBe("체크박스 스택");
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run packages/layout/src/__tests__/layout-schema.test.ts -t "usedFor"`
Expected: FAIL — zod strips/rejects unknown `usedFor` (entry.usedFor is undefined or parse throws on the strict object).

- [ ] **Step 3: Add the field to the schema**

In `schema.ts`, inside the `layoutPatternCatalogEntrySchema` object (after the `props:` line, before `status:`), add:

```ts
		usedFor: z
			.array(
				z.object({
					intent: z.string().min(1),
					description: z.string().optional(),
				}),
			)
			.optional(),
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `pnpm exec vitest run packages/layout/src/__tests__/layout-schema.test.ts -t "usedFor"`
Expected: PASS.

- [ ] **Step 5: Confirm it reaches the inference catalog**

Add a test in `layout-schema.test.ts` (or a scratch tsx run) asserting the field survives to `resolveLayoutCatalogForInference`:

```ts
import { resolveLayoutCatalogForInference } from "../public/catalog";
it("exposes usedFor to the inference catalog", () => {
  const cat = resolveLayoutCatalogForInference();
  // after Task 4 this will be non-empty; for now just assert the shape passes through
  expect(Array.isArray(cat.data.area)).toBe(true);
});
```

Run: `pnpm exec vitest run packages/layout/src/__tests__/layout-schema.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/layout/src/pattern-internal/schema.ts packages/layout/src/__tests__/layout-schema.test.ts
git commit -m "feat(layout): add usedFor vocabulary field to catalog entry schema"
```

## Task 2: Compute the authoritative duplicate set

**Files:**
- Create: `packages/layout/src/__tests__/area-variant-dedup.report.test.ts` (temporary, deleted in Task 6)

- [ ] **Step 1: Write a report test that renders every area layout with identical input and groups by output + prop keys**

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "vitest";
import { layoutPatternComponents } from "../components/patterns/registry";

describe("area variant dedup report", () => {
  it("prints duplicate groups", () => {
    const child = createElement("div", { "data-fixture": "x" }, "FIXTURE");
    const byKey = new Map<string, string[]>();
    for (const entry of layoutPatternComponents) {
      if (!entry.layoutId.startsWith("layout.area.")) continue;
      const Comp = entry.component as React.ComponentType<Record<string, unknown>>;
      let markup = "";
      try {
        markup = renderToStaticMarkup(
          createElement(Comp, { metadata: { id: "fx", title: "T" }, props: {} }, child),
        );
      } catch (e) {
        console.log("RENDER ERROR:", entry.layoutId, String(e));
        continue;
      }
      const propKeys = Object.keys(entry.pattern?.props ?? {}).sort().join(",");
      const key = `${markup}::props[${propKeys}]`;
      byKey.set(key, [...(byKey.get(key) ?? []), entry.layoutId]);
    }
    for (const [, ids] of byKey) {
      if (ids.length > 1) console.log("DUP GROUP:", ids.join("  "));
    }
  });
});
```

- [ ] **Step 2: Verify the registry export name, fix the import if needed**

Run: `grep -nE "export (const|function) layoutPatternComponents|export .*LayoutPatternComponentEntry|areaLayoutPatternComponents" packages/layout/src/components/patterns/registry.ts`
Expected: a real exported array of `{ component, layoutId, pattern }`. If the name differs, update the import in Step 1.

- [ ] **Step 3: Run and capture authoritative groups**

Run: `pnpm exec vitest run packages/layout/src/__tests__/area-variant-dedup.report.test.ts --reporter=verbose`
Expected: `DUP GROUP:` lines. They MUST include P1/P2/P3 from the confirmed list; the rest are collection groups. Copy every `DUP GROUP:` line verbatim into Task 3 Step 1.

- [ ] **Step 4: Commit the harness**

```bash
git add packages/layout/src/__tests__/area-variant-dedup.report.test.ts
git commit -m "test(layout): temporary area-variant dedup report harness"
```

## Task 3: Build the canonical/merge table

**Files:** none (record the result in THIS plan file under `## Resolved removals`)

- [ ] **Step 1: For each DUP GROUP, choose canonical (most generic name) and list siblings to fold**

Write into this plan file:

```markdown
## Resolved removals
| group | canonical (keep) | fold-in siblings (delete, vocab→canonical.usedFor) |
| ----- | ---------------- | -------------------------------------------------- |
| P1 | layout.area.fieldStack | layout.area.checkboxStack, layout.area.messageStack |
| P2 | layout.area.productDisclosureAccordion | layout.area.deliveryInfoAccordionArea, layout.area.priceAccordionStackArea |
| P3 | layout.area.textListGroupArea | layout.area.pagestackInfoTextSection |
| <collection groups from Task 2> | ... | ... |
```

- [ ] **Step 2: For every sibling id, capture its JSON `name` + `description` and code symbols**

For each fold-in id run:

```bash
ID=layout.area.checkboxStack
grep -n "$ID" -A4 packages/layout/src/catalog/area-patterns.json   # name + description to fold
grep -n "$ID" packages/layout/src/components/patterns/registry.ts  # componentID + component symbol
```

Record per sibling: `{intent: <its name>, description: <its description>}` (for usedFor) and its `componentID`/exported component name + which `presets.ts` key or `CollectionArea.tsx` export feeds it.

## Task 4: Merge vocabulary into canonical + delete sibling entries in the AI catalog

**Files:**
- Modify: `packages/layout/src/catalog/area-patterns.json`

- [ ] **Step 1: Add `usedFor` to each canonical entry**

For each group, on the canonical entry add the folded siblings' vocabulary. Example (P1, canonical `fieldStack`):

```jsonc
{
  "id": "layout.area.fieldStack",
  "target": "area",
  "name": "필드 스택",
  "description": "...existing...",
  "usedFor": [
    { "intent": "체크박스 스택", "description": "<checkboxStack's description>" },
    { "intent": "메시지 스택", "description": "<messageStack's description>" }
  ],
  "componentID": "FieldStackArea",
  "props": { /* unchanged */ },
  "children": { /* unchanged */ },
  "status": "..."
}
```

- [ ] **Step 2: Delete each sibling's catalog entry**

Remove the JSON object whose `"id"` is a fold-in sibling. Keep JSON valid (no trailing commas).

- [ ] **Step 3: Confirm the catalog still parses and usedFor is present**

Run: `pnpm exec vitest run packages/layout/src/__tests__/layout-schema.test.ts`
Expected: PASS.
Run: `node -e "const c=require('./packages/layout/src/catalog/area-patterns.json'); const f=c.patterns.find(p=>p.id==='layout.area.fieldStack'); console.log(JSON.stringify(f.usedFor))"`
Expected: prints the `usedFor` array with the folded intents.

- [ ] **Step 4: Commit**

```bash
git add packages/layout/src/catalog/area-patterns.json
git commit -m "refactor(layout): fold duplicate area variants into canonical usedFor vocabulary"
```

## Task 5: Delete sibling layouts from registry + component code

**Files:**
- Modify: `packages/layout/src/components/patterns/registry.ts`
- Modify: `packages/layout/src/components/patterns/area/page-stack/index.tsx`
- Modify: `packages/layout/src/components/patterns/area/page-stack/presets.ts`
- Modify: `packages/layout/src/components/patterns/area/collection/CollectionArea.tsx` (only for collection-backed siblings)

- [ ] **Step 1: Delete each sibling's registry entry**

In `registry.ts`, remove the `{ component, componentID, layoutId, name, props }` object whose `layoutId` is a fold-in sibling. Do not touch canonical entries.

- [ ] **Step 2: Delete each sibling's component export + preset**

Page-stack sibling: remove its `export const <Name>Area = createPageStackArea(areaPageStackPresets.<key>.defaults);` line in `index.tsx` and its `<key>: { defaults: {...} },` block in `presets.ts`. Collection sibling: remove its `export const <Name>Area = createCollectionArea({...});` block in `CollectionArea.tsx`.

- [ ] **Step 3: Verify no dangling references to deleted symbols**

Run (substitute each deleted component name):

```bash
grep -rn "CheckboxStackArea\|MessageStackArea\|DeliveryInfoAccordionArea\|PriceAccordionStackArea\|PagestackInfoTextSectionArea" packages apps --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Expected: no matches. Remove any leftover barrel re-export hits.

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit --pretty false --incremental false`
Expected: exit 0, no `error TS`.

- [ ] **Step 5: Commit**

```bash
git add packages/layout/src/components/patterns
git commit -m "refactor(layout): drop duplicate area layouts from registry/components"
```

## Task 6: Verify end-to-end and clean up

**Files:**
- Delete: `packages/layout/src/__tests__/area-variant-dedup.report.test.ts`

- [ ] **Step 1: Re-run the dedup report — expect zero duplicates**

Run: `pnpm exec vitest run packages/layout/src/__tests__/area-variant-dedup.report.test.ts --reporter=verbose`
Expected: zero `DUP GROUP:` lines.

- [ ] **Step 2: Confirm registry ↔ JSON area-id counts agree**

Run:
```bash
node -e "const c=require('./packages/layout/src/catalog/area-patterns.json'); console.log('json area ids:', c.patterns.filter(p=>p.target==='area').length)"
grep -c 'layoutId: "layout.area.' packages/layout/src/components/patterns/registry.ts
```
Expected: equal counts.

- [ ] **Step 3: Delete the report harness**

```bash
git rm packages/layout/src/__tests__/area-variant-dedup.report.test.ts
```

- [ ] **Step 4: Full layout + renderer tests + typecheck**

Run: `pnpm exec vitest run packages/layout packages/renderer`
Expected: all pass.
Run: `pnpm exec tsc --noEmit --pretty false --incremental false`
Expected: exit 0.

- [ ] **Step 5: Log in AGENTS_HISTORY.md**

Add `## 2026-06-08 - PageStack Variant Consolidation` (변경: render-identical area 변형을 canonical로 합치고 의미는 usedFor 어휘로 보존 / 이유: AI 카탈로그 선택 노이즈 제거하되 의미 신호 유지 / 검증: dedup 리포트 0, tsc, layout+renderer 테스트).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(layout): remove dedup harness; log variant consolidation"
```

## Follow-ups (do NOT do in this plan)

- Composition prompt (`@cx/agent`) does not yet read `usedFor` — tune the prompt to match intent against `usedFor[]` in a separate change.
- `layout.composite.*` (49 entries) parallel duplicate set — separate consolidation plan.
- Two-SSOT smell: generate `catalog/*.json` from `registry.ts` (single source) — separate plan.
