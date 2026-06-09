# @cx/layout external-thin 재구성 (Design)

**작성일:** 2026-06-09 (전면 개정 — 기존 "스코프 A registry dedup" 설계를 대체)
**목표:** `@cx/layout`을 `@cx/external`과 **동일한 스캐폴딩·데이터 모델·API 모양**으로 재구성한다. 중간 레이어(`pattern-internal/*`, `public/*`)와 `catalog/*.json`을 폐기하고, 컴포넌트 콜로케이션 + 생성 스크립트 모델로 전환한다.

---

## 핵심 원칙 (external과 공유)

```
catalog entry  = 계약을 든다 (props/target/status/name)
registry       = 실제 React component를 든다
alias          = layoutId → canonical component key 해석 (손작성)
resolver       = id로 catalog entry를 읽는다 (읽기 전용)
renderer       = registry + canonicalize로 component를 직접 해석한다
```

| @cx/external | @cx/layout |
|---|---|
| `type: "kiki.ActionButton"` | `id: "layout.area.bottomActionArea"` |
| `kind/source` | `target` (screen/region/area/composite) |
| `props` | `props` |
| `status` | `status` |
| registry: `"kiki.ActionButton" → ActionButton` | registry: `"BottomActionArea" → BottomActionArea` (alias 경유) |

## 최종 디렉터리 (external 미러)

```
packages/layout/src/
├── index.ts                  (public ".")
├── catalog.generated.ts      (public "./catalog")     ★생성 — 모든 layoutId entry meta
├── registry.generated.ts     (public "./registry")    ★생성 — canonical componentKey → component
├── catalog.alias.ts          ✋손작성(B) — layoutId → canonical componentKey
├── canonicalize-catalog.ts   (public "./canonicalize") — assertAliasIntegrity + canonicalizeLayout(id)→componentKey
├── resolver.ts               (public "./resolver")    — catalog 읽기 전용 API
├── modules.d.ts
├── internal/style.ts         (public "./style")       — 유지(renderer 소비)
└── components/
    ├── index.ts
    ├── primitives/   {index.ts, Flex.tsx, Grid.tsx, Stack.tsx, PageStack.tsx, BottomFixedArea.tsx}   (public "./primitives")
    ├── composites/   {index.ts, presets.ts, CompositeWrapper.tsx, <Canonical>.tsx + <id>.meta.ts …}
    ├── areas/{general,page-stack,collection}/  {index.ts, <Engine>.tsx, presets.ts, <Area>.tsx + <id>.meta.ts …}
    ├── regions/      {index.ts, RegionStack.tsx, HeaderRegion.tsx … + <id>.meta.ts}
    └── chromes/      {index.ts, AppScreen.tsx, AppScreenRoot.tsx, ScreenRegion.tsx, MobileScreen.tsx}   (public "./chrome")

scripts/sync-layout-catalog/*   — components/ 순회 → *.meta.ts 수집 → catalog.generated.ts + registry.generated.ts 생성. zod 검증은 여기.
```

### 폐기
- `catalog/*.json` — meta.ts + 생성으로 대체.
- `pattern-internal/*` 전부: `schema.ts`(zod) → sync 스크립트로 이동; `store.ts`(loadPatternStore/findPattern/listPatterns) → resolver가 catalog.generated 직접 읽음; `mutations.ts` → 제거(generated 산출물에 runtime mutation 금지).
- `public/*` 파사드 레이어 — 역할별로 위 최상위 파일에 흡수.
- `canonical/` 하위 폴더 — `canonicalize-catalog.ts` + `catalog.alias.ts`로 평탄화.

## 데이터 모델

### meta.ts (entry당 1개, 손작성, 콜로케이션)
catalog **entry**의 계약을 선언한다. layoutId마다 하나(중복 behavior도 entry는 별개로 유지).
```ts
// components/areas/general/bottomActionArea.meta.ts
import type { LayoutCatalogMeta } from "...";
export const meta = {
  id: "layout.area.bottomActionArea",
  target: "area",
  name: "하단 액션 영역",
  props: { gap: { type: "number" }, safeArea: { type: "boolean" }, /* … */ },
  children: { accepts: "component", min: 1 },
  status: "stable",
} as const satisfies LayoutCatalogMeta;
```
- defaults는 entry에 들어가지 않는다(component-land presets 소유). entry = props·target·status·name·children 계약.
- props는 기존(정합 완료된) catalog props를 seed로 옮긴다.

### catalog.alias.ts (손작성, B)
layoutId → canonical componentKey. **모든 layoutId**가 등록된다(canonical도 자기 자신 componentKey로).
```ts
export const layoutAlias: Record<string, string> = {
  "layout.area.bottomActionArea": "BottomActionArea",
  // 중복 behavior 흡수 예:
  "layout.area.noticeAccordionStackArea": "PlainInfoTextListArea",   // ≡ plainInfoTextListArea
  "layout.composite.componentCheckbox": "Gap0Composite",             // {gap:0} 28종 → 1 canonical
  // …
};
```
- 등가류 실측: composite 49 → **15 고유 behavior**(28×gap0, 5×gap8, 4×gap12, 12 고유). page-stack: noticeAccordionStackArea≡plainInfoTextListArea, fieldStack≡tabChipSearchAccordionArea.
- canonical componentKey는 registry.generated.ts의 export 이름과 일치.

### catalog.generated.ts (생성, public ./catalog)
```ts
export const layoutCatalog: Record<string, LayoutCatalogEntry> = {
  "layout.area.bottomActionArea": { id, target, name, props, children, status },
  // …모든 meta 수집…
};
```

### registry.generated.ts (생성, public ./registry)
```ts
export { BottomActionArea } from "./components/areas/general/BottomActionArea";
export { PlainInfoTextListArea } from "./components/areas/page-stack/PlainInfoTextListArea";
export { Gap0Composite } from "./components/composites/Gap0Composite";
// …canonical componentKey만(중복 제거)…
```

## API (external 미러)

### resolver.ts — catalog 읽기 전용
| external | layout |
|---|---|
| `componentCatalog` | `layoutCatalog` (re-export) |
| `getComponentCatalogEntry(type)` | `getLayoutCatalogEntry(id)` |
| `getComponentCatalogTypes()` | `getLayoutCatalogIds()` |
| `getComponentCatalogStatus(type)` | `getLayoutCatalogStatus(id)` |
| `listCandidateComponentEntries()` | `listLayoutCatalog({ target?, status? })` |
| `resolveComponentCatalogForInference()` | `resolveLayoutCatalogForInference()` |

### canonicalize-catalog.ts
```ts
import { layoutCatalog } from "./catalog.generated";
import { layoutAlias } from "./catalog.alias";
export function assertAliasIntegrity(): void { /* 모든 catalog id에 alias 존재 & 모든 alias 타깃이 registry export에 존재 */ }
assertAliasIntegrity();
export function canonicalizeLayout(id: string): string | undefined { return layoutAlias[id]; } // → componentKey
```

### renderer (external과 동형)
external이 `@cx/external/registry`를 직접 import하듯, layout renderer는 `@cx/layout/registry` + `@cx/layout/canonicalize`로 component 직접 해석:
```ts
import * as LayoutRegistry from "@cx/layout/registry";
import { canonicalizeLayout } from "@cx/layout/canonicalize";
const Component = LayoutRegistry[canonicalizeLayout(node.layout) ?? ""];
```
(resolver에는 component 해석 함수를 두지 않는다 — external처럼 renderer 책임.)

## public 표면 (package.json exports — external 미러)
```
"." , "./catalog"(catalog.generated), "./registry"(registry.generated),
"./resolver", "./canonicalize",
+ layout 고유: "./primitives", "./chrome"(→components/chromes), "./style"
```
폐기: `./components`, `./contract`, `./mutations`. (`./types`의 LAYOUT_PROP_CONTRACTS는 아래 별도 처리.)

## 소비자 재배선 (실측 — 3 사이트 + 유지)
| 현재 | 신규 |
|---|---|
| renderer `@cx/layout/components` `findLayoutPatternComponentByLayoutId` | `@cx/layout/registry` + `@cx/layout/canonicalize` 직접 해석 |
| inference `@cx/layout/catalog` `resolveLayoutCatalogForInference` | `@cx/layout/resolver` 동명 함수 |
| validation `@cx/layout/catalog` `findPattern` | `@cx/layout/resolver` `getLayoutCatalogEntry` |
| renderer `@cx/layout/primitives`·`/chrome`·`/style` | 유지 |
| validation `@cx/layout/types` `LAYOUT_PROP_CONTRACTS` | 유지(primitive node 계약, pattern catalog와 별개 축). `./types` 또는 primitives로. |

## 불변식 / 가드
- **alias 무결성**: 모든 catalog id ∈ alias 키, 모든 alias 값 ∈ registry export. (`assertAliasIntegrity`, 모듈 로드 throw + 테스트)
- **전단사**: 모든 catalog id → canonicalize → 실제 렌더 가능한 component. catalog id ↔ entry 1:1.
- **generated 일관성**: sync 스크립트 재실행 시 catalog.generated/registry.generated 변동 없음(meta가 SOT).
- 렌더 동작 불변(defaults 값 1:1 보존).

## 비목표
- `@cx/external` 자체 리네임/변경(layout이 external을 따라가는 방향, external은 기준).
- inference/validation의 계약 *의미* 변경(entry 데이터는 그대로, 출처만 generated).
- status 어휘 통일은 최소: layout meta가 `status`를 직접 선언(stable/draft/deprecated). external의 source→status 유도는 layout엔 불필요(상위 소스 없음).

## 리스크 / 순서
1. 가장 큰 작업은 **meta.ts 작성 + canonical 컴포넌트 분리 + alias 손작성**. 현재 브랜치의 정합된 catalog props(L2)와 composite presets(L3)를 seed로 재사용.
2. **순서**: (1) 타입+sync 스크립트 골격 → (2) 컴포넌트 1파일화 + meta.ts 콜로케이션(area/region/screen/composite) → (3) catalog.alias.ts 손작성(등가류 흡수) → (4) catalog.generated/registry.generated 생성 → (5) resolver/canonicalize 작성 → (6) pattern-internal/public/json 폐기 + package.json exports 정렬 → (7) 소비자 3사이트 재배선 → (8) 가드 테스트 + 전체 검증.
3. 위험: meta props 누락/오타 → 생성 catalog가 기존과 달라짐. 기존 정합 catalog를 기준으로 **diff 가드 테스트**(생성 catalog == 기존 entry 집합) 필수.
4. canonical 컴포넌트 분리 시 렌더 회귀 위험 → presets 값 1:1 보존 + 기존 renderer 테스트 그린 유지.

## 검증
- `assertAliasIntegrity` 통과, 생성 catalog가 기존 entry(id·target·props·status) 집합과 일치(diff 가드).
- `vitest run packages/layout packages/renderer packages/validation packages/inference` — 기존 대비 새 실패 0(pre-existing 2건 제외).
- `grep` — pattern-internal/public/json 잔재 0, `@cx/layout/{catalog,components,mutations,contract}` 구 import 0.
