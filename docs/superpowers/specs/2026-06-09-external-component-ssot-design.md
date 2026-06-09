# `@cx/external`을 컴포넌트 SSOT로 승격 — 설계

- 날짜: 2026-06-09
- 상태: 설계 승인 대기
- 작성: brainstorming 세션 산출물

## 1. 배경 / 동기

`/Users/plusx/Desktop/component-v2`로 새 컴포넌트 패키지(`@cx/external`)를 받아왔다.
이 패키지는 kiki(`github.com/sovorovvang-cyber/kiki`) 원본 소스를 vendoring 한 것으로,
현재 컴포넌트 패키지 `@cx/components`와 **resolver 구조가 근본적으로 다르다.**

핵심 차이:

- `@cx/external`에는 **resolver 함수가 없다.** `externalCatalog`(데이터) +
  `registry.generated.ts`(렌더러용 React export) + `index.ts`(stable barrel)만 있다.
- 카탈로그 스키마가 다르다: key가 `kiki.{Name}`로 네임스페이스되고,
  `source: "kiki-barrel" | "kiki-draft"`(출처+성숙도), `label`, `version`, prop `role`을 갖는다.
- 카탈로그 contract 타입을 외부 `@cx/types/component-catalog`에서 가져온다(현재 repo에 없는 패키지).
- 현재 repo에는 `@cx/external`·`@cx/types` 참조가 **0건** — 아직 배선 안 된 신규 드롭이다.

목표: **`@cx/external`을 컴포넌트 SSOT로 승격하고, `@cx/components`의 resolver 기능을 이식한다.**

## 2. 확정된 결정

brainstorming 과정에서 사용자가 확정한 사항:

1. **`@cx/components`는 완전 은퇴 / `@cx/external`로 흡수.** external이 컴포넌트 + 카탈로그 +
   resolver의 단일 출처가 되고, 모든 소비자는 external로 재배선한다.
2. **`aliases`·`usage` 메타는 이전하지 않는다(폐기).** resolver는 alias 해석 없이
   canonical type 직접 조회만 한다.
3. **성숙도(status)는 `source`에서 유도한다.** `kiki-barrel` → `stable`, `kiki-draft` → `candidate`.
   소비자는 기존 `status` API(`stable`/`candidate`)를 그대로 쓴다.
4. **카탈로그 contract 타입은 `@cx/schema`로 편입한다.** `@cx/types`는 신설하지 않고,
   vendored `catalog.ts`의 `@cx/types/component-catalog` import를 `@cx/schema`로 재배선한다.
5. **resolver 이식 방식: external이 `public/resolver.ts`를 소유(API 패리티, alias만 제거).**
   소비자는 import 경로만 바꾼다.
6. **카탈로그 mutation(create/update/delete/promote candidate)은 폐기.** 자동생성 + source 유도
   status 체제에서 런타임 쓰기 대상이 없다. 단 **`promote-component.ts`는 sync 레이어
   (kiki 소스 draft→barrel) 대상으로 재작성**해 promote 워크플로 자체는 유지한다.
7. **type 네임스페이스는 `kiki.X`로 일관 유지(옵션3-변형).** 카탈로그 키와 node.type 모두 `kiki.X`.
   resolver는 순수 직접 조회(정규화 없음). 유일한 bridge는 **renderer의 React 컴포넌트 조회 경계**에서
   `kiki.AppBar` → registry export `AppBar`로 **접두사 strip 단일 규칙**(alias 아님). 이 규칙은
   KIKI-SHIM이 영구 로직으로 명시한 `component-by-type.ts` 패턴에 해당하며, 현재 `resolveComponentByType`를
   이것으로 교체한다. composite 노드 렌더러(Accordion·ListCell·HeaderBase 등 kiki 컴포넌트 아님)는
   별도 맵으로 그대로 둔다.

## 3. 전제 / 의존

- 이 마이그레이션은 `@cx/external` 패키지 **및 그 생성 파이프라인**(`scripts/sync-catalog`)을
  모노레포로 들여오는 것을 포함한다. 현재 repo에는 `packages/external/`도 `scripts/sync-catalog/`도
  없다(새 패키지는 그 산출물만 보유). KIKI-SHIM.md가 임시 보완 레이어를 설명한다.
- KIKI-SHIM은 kiki가 라이브러리 빌드를 제공하면 걷어낼 임시물이다. 이 설계는 SHIM 존재를 전제로 하되,
  SHIM 제거 가능성을 깨지 않는다(catalog 생성기·registry.generated·modules.d.ts는 SHIM 산물).
- React 19.x로 양쪽 동일 → 컴포넌트 호환.

## 4. 아키텍처 / 책임 재분배

`@cx/components`의 4가지 책임을 다음으로 분산한다.

| 기존(@cx/components)           | 이전처                                         |
| ------------------------------ | ---------------------------------------------- |
| 컴포넌트 구현                  | `@cx/external` (vendored kiki)                 |
| 카탈로그 데이터                | `@cx/external/catalog` (자동생성 유지)         |
| resolver 함수                  | `@cx/external/resolver` (이식, alias 제거)     |
| 컴포넌트 표면(렌더러용)        | `@cx/external/registry` (이미 존재)            |
| 카탈로그 contract 타입         | `@cx/schema`                                   |
| inference 공급                 | `@cx/external` (owner를 `"@cx/external"`로)    |
| audit                          | `@cx/external` (이식)                          |
| puck 표면(`/puck`)             | `@cx/external` (이동)                          |
| mutation / candidate           | 폐기                                           |
| promote 스크립트               | sync 레이어 대상으로 재작성                    |

## 5. `@cx/schema`의 카탈로그 contract

새 파일 `packages/schema/src/component-catalog.ts`에 contract를 이식하고 index에서 재노출한다.

변경점:

- `usage`·`aliases` 필드 제거(`ComponentUsageContract` 타입도 삭제).
- `ComponentCatalogSource` union을 `"kiki-barrel" | "kiki-draft"`로 교체(구 `react-component` |
  `renderer-composite` | `layout-primitive` 폐기).
- `ComponentCatalogEntry`에 `label` 필드 추가(external 데이터가 이미 보유).
- prop contract의 나머지 필드(`tokenRole`/`variantTokens`/`aiWritable`/`defaultValue`/`description`)는
  **optional 그대로 유지** — 생성 카탈로그는 `{ type, role?, values?, required }` 부분집합만 채우지만
  기존 소비자 깨짐을 방지하기 위해 contract는 상위집합을 유지한다.
- `ComponentCatalogData.entries: unknown[]` → `ComponentCatalogEntry[]`로 타입드 승격.
- `ComponentCatalogStatus = "stable" | "candidate"`는 유지(소비자가 사용), **값은 source에서 유도**한다.

`TokenRole`/`TokenSlot`/`isTokenRole` 등 토큰 관련 보조 타입은 prop contract가 참조하므로 함께 이동한다.

## 6. `@cx/external/resolver` (이식, alias-free)

```ts
getComponentCatalogEntry(type)   = externalCatalog[type]                    // 직접 조회
getComponentPropContract(t, p)   = getComponentCatalogEntry(t)?.props[p]
getComponentCatalogTypes()       = Object.keys(externalCatalog).sort()
getComponentCatalogStatus(type)  = entry.source === "kiki-barrel" ? "stable" : "candidate"
listCandidateComponentEntries()  = entries.filter(e => e.source === "kiki-draft")
componentCatalog                 = externalCatalog                          // assembly 레이어 소멸
resolveComponentCatalogForInference()                                       // owner: "@cx/external"
```

소멸하는 것:

- `componentCatalogAliases`(alias map)
- `assembleComponentCatalog`(status 스트립 레이어 — external 카탈로그가 이미 public shape)
- `withStatus` internal status-tagging
- `internal/component-entries.ts`, `internal/candidate-entries.ts`(hand-authored 카탈로그 — 자동생성으로 대체)
- `mutations.ts`, `createCandidate`

`packages/external/package.json` exports에 `./resolver` 추가. `./types`는 더 이상 제공하지 않는다
(타입은 `@cx/schema`에서). `./catalog`·`./registry`는 유지.

## 7. 소비자 마이그레이션 (import 재배선)

진입점 매핑: `@cx/components` → `@cx/external`, `@cx/components/catalog` → `@cx/external/catalog`,
`@cx/components/types` → `@cx/schema`, `@cx/components/puck` → `@cx/external/puck`.

대상:

- **renderer**: `adapters/resolve-component.tsx`, `adapters/build-component-props.ts`
  → resolver/catalog는 `@cx/external/*`, 컴포넌트는 `@cx/external/registry`.
  `resolve-component.tsx`의 `componentCatalogAliases` 사용 제거, `resolveComponentByType`를
  `kiki.` 접두사 strip 규칙(`componentsByType[type] ?? componentsByType[type.replace(/^kiki\./, "")]`)으로
  교체. root barrel(`@cx/components`)에서 import하던 구체 컴포넌트(`AppBar`/`Callout`/`ListSelected`/`ListText`)는
  `@cx/external` root barrel에서 import(모두 존재).
- **layout**: `pattern-internal/matcher.ts`, `components/patterns/shared/divider.tsx`,
  `__tests__/layout-catalog.test.ts` → `@cx/external/*`
- **validation**: `public/validators.ts`, 테스트 → 타입은 `@cx/schema`, 카탈로그는 `@cx/external/catalog`
- **inference**: `knowledge/knowledge-base.ts`, `functions/deterministic-validation.ts`, 테스트
  → `@cx/external/catalog`
- **apps/web**: `lib/workbench-puck/puck-scope.ts`, `lib/workbench-puck/puck-fields.ts`,
  `next.config.ts`의 `transpilePackages` → `@cx/external`
- **scripts**: `promote-component.ts` → sync 레이어 대상으로 재작성
- 모든 `package.json` workspace dep(`@cx/components` → `@cx/external`), 루트 `package.json` 포함
- `packages/component/` 디렉터리 삭제, `tsconfig.json`/workspace glob 참조 정리

## 8. 영향받지 않는 영역 (건드리지 않음)

- `@cx/schema`의 노드 타입 SSOT(`RENDER_TREE_NODE_TYPE`) — 컴포넌트 카탈로그 contract와 별개.
- KIKI-SHIM "⛔ SHIM이 아닌 것"으로 명시된 영구 통합 로직(external-palette, store 머지,
  component-by-type 등록 로직, build-catalog-deck) — 이번 SSOT 승격과 직교(단, 해당 파일들은
  아직 현재 repo에 없으며 패키지 통합 시 함께 들어온다).

## 9. 검증 기준

- `tsc --noEmit` clean(타입 이동 후 `@cx/components` 참조 0건, `@cx/external`/`@cx/schema`로 해소).
- `grep -rn "@cx/components" --exclude-dir=node_modules .` 결과 0건.
- 카탈로그 기반 테스트(layout-catalog, validators, knowledge-base) green.
- resolver API 패리티: `getComponentCatalogEntry`/`getComponentPropContract`/`getComponentCatalogTypes`/
  `getComponentCatalogStatus`/`listCandidateComponentEntries`가 external에서 동작.
- `getComponentCatalogStatus`가 barrel→stable, draft→candidate를 정확히 반환.
- 앱 부팅 200 + 캔버스에 kiki 컴포넌트 렌더.

## 10. 미해결 / 후속

- sync 레이어(`scripts/sync-catalog`)의 정확한 형상은 패키지 통합 시 확정. promote 재작성은 그에 의존.
- prop contract 상위집합 유지가 장기적으로 dead field를 남기므로, kiki 카탈로그가 안정화되면
  실제 사용 필드로 trim 하는 후속 정리 가능(YAGNI 차원에서 지금은 보류).
