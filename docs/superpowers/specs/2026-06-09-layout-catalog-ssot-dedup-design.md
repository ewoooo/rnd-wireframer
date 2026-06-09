# @cx/layout 계약 SOT 정합 — registry 중복 제거 (Design)

**작성일:** 2026-06-09
**스코프:** A (registry 인라인 계약 중복 제거 + defaults catalog 이관). B(파일/네이밍 external 정렬)·C(render-coerce 통일)는 보류.

## 배경 / 문제

`@cx/external` SSOT 승격에서 검증한 catalog-driven 구조가 `@cx/layout`에는 이미 ~80% 존재한다:

- `catalog/*.json`(4파일, zod 검증, target별 ~87 entry) — 계약 데이터
- `canonical/canonicalize-layout.ts` + `layout-alias.ts` — write-back 경계 전용, external과 동일 모델
- `resolveLayoutCatalogForInference()` — component-catalog과 대칭, inference가 같은 catalog 소비
- renderer는 `layoutId → component` lookup만 하고 하드코딩 분기 0

**실제 결함은 하나다:** `components/patterns/registry.ts`(~1140줄)가 catalog가 이미 소유한 **prop 계약을 인라인으로 재선언**한다(`compositePropContractByKey`/`screenPropContractByKey`/`collectionPropContractByKey`/`generalAreaPropContractByKey`/`pageStackPropContractByKey` + `compositeProps()`/`pageStackProps()`/`collectionProps()`/`generalAreaProps()`/`screenShellProps()` 헬퍼). 이 때문에 계약 진실원이 갈라졌고 **이미 발산**했다(예: `layout.area.listStack` — JSON 8개 prop vs registry 11개: `paddingX`·`sectionGap`·`slotInsetX` 추가).

이는 [[node-types-single-source]](단일 진실원) 및 [[feedback_no_hardcoded_switch]](손유지 계약 테이블은 contract-table 신호) 원칙 위반이다.

### 소비 사실 (조사 확정)

- **validation** (`validators.ts`): `findPattern`(= JSON catalog) 사용. registry의 `pattern.props`를 읽지 않음. (`validators.ts:669`의 동명 함수는 로컬 wrapper)
- **inference** (`knowledge-base.ts`): `resolveLayoutCatalogForInference()` → `listCatalog`(JSON) 사용.
- **renderer** (`resolve-layout.ts`): `findLayoutPatternComponentByLayoutId`에서 `entry.component`만 사용. `entry.pattern.props`는 coerce에 쓰지 않음 → registry 인라인 props는 **사실상 죽은 중복**.
- registry-sourced `pattern.props`를 읽는 유일한 곳은 테스트(`layout-public-api.test.ts:107`).
- `defaults:` ~50건은 전부 composite 엔트리(`createCompositeWrapper(defaults)`). area/region/screen은 직접 component 참조, defaults 없음.

## 목표 (End State)

이 작업은 데이터 배선 정리가 아니라 **catalog entry ↔ 실제 렌더 pattern component 결속**을 정본화하는 것이다. registry는 단순 메타데이터 맵이 아니라 **각 layoutId가 실제 화면에 그려지는 React pattern component로 연결되는 component registry**다. 흐름:

```
layout catalog entry (계약 SOT)
  → 실제 layout pattern component 구현 (area/region/screen 직접 component, composite=CompositeWrapper)
  → registry가 layoutId ↔ component 결속 (component registry)
  → renderer가 layoutId로 component를 찾아 실제 렌더
```

```
catalog/*.json   = props · name · children · status 계약 SOT (실제 컴포넌트가 지원하는 prop만)
registry.ts      = layoutId → actual React pattern component  (계약 데이터 0, component 결속만)
  · area/region/screen → 기존 named component 직접 참조 (defaults는 컴포넌트/presets에 내장)
  · composite          → 신설 named composite component 직접 참조 (composite/presets.ts에 defaults 내장)
findLayoutPatternComponentByLayoutId(id) → { component, layoutId: id, pattern: getEntry(id), target: getEntry(id).target }
```

핵심: 계약(props/name/children/status)의 SOT를 catalog로 단일화하되, **모든 target이 균일하게 "layoutId → 실제 named component"**가 되도록 한다. 현재 area/region/screen은 이미 named component(`ListStackArea` = `createPageStackArea(presets.X.defaults)` 등)이고 defaults를 컴포넌트/presets에 내장한다. composite만 registry 안에서 `createCompositeWrapper(defaults)`로 익명 조립되는 **비대칭**이 있으므로, composite도 named component(`composite/presets.ts` + `ComponentAppBarComposite = createCompositeWrapper({gap:0})` …)로 만들어 대칭을 맞춘다. defaults는 area와 동일하게 component-land에 둔다(catalog에는 두지 않음). validation/inference/renderer 흐름·렌더 동작 불변.

## 설계 결정

### 결정 1 — prop 발산은 "정합 후 dedup" (삭제 금지)
registry 인라인 계약을 지우기 전에 layoutId별 diff를 산출한다:
```
registry-derived props (entry.pattern.props)  vs  JSON catalog props (getEntry(id).props)
```
- **registry-only prop**: 해당 layout component 구현이 실제 소비하면 → JSON에 추가. 소비하지 않음/과거 잔재/의미 불명 → 폐기.
- **JSON-only prop**: 유지(JSON이 SOT).
정합이 끝나 JSON이 "실제 지원 prop의 정확한 집합"이 된 뒤에만 인라인 테이블을 제거한다.

### 결정 2 — composite를 named component로 (area와 대칭), defaults는 component-land
- `packages/layout/src/components/patterns/composite/presets.ts` 신설: registry `compositeLayouts[].defaults`(49건)를 `compositeDefaults` 맵으로 이관.
- composite named component 49개를 component-land에 생성(`ComponentAppBarComposite = createCompositeWrapper(compositeDefaults.componentAppBar)` …). 이름은 catalog `componentID`와 일치.
- registry는 area처럼 named composite component를 직접 import해 `layoutId → component`로만 매핑. **catalog에는 defaults 필드를 두지 않는다**(area/region/screen과 동일하게 defaults는 component-land).
- 값 동일 → 렌더 결과 불변.

### 불변식 (회귀 가드)
- **catalog ↔ component 전단사**: 모든 catalog entry는 registry에 실제 렌더 가능한(정의된 함수형) React component를 가지며, 그 역도 성립(component 없는 catalog id 없음, catalog 없는 component 없음). 메타데이터-only 엔트리 금지.
- registry는 prop 계약 / name / children / status를 자체 선언하지 않는다(전부 `getEntry`에서). component 결속만 보유.
- 모든 target(area/region/screen/composite)이 균일하게 named component를 가진다. composite도 registry 안 익명 조립이 아니라 component-land의 named component.

## 비목표
- 파일/디렉터리 external 네이밍 정렬(`registry.generated.ts` 등) — B, 보류.
- renderer가 layout props를 catalog 계약으로 coerce — C, 보류.
- `LAYOUT_PROP_CONTRACTS`(primitive node 계약, `types.ts`) 재구조화 — 별개 축, 본 스코프 외.
- `canonical/`·alias·inference resolver 변경 — 이미 올바름.

## 리스크 / 마이그레이션 순서
1. **정합 누락 리스크**: registry-only prop을 잘못 폐기하면 컴포넌트 지원 prop이 미선언으로 남음 → 정합 단계에서 component 구현 grep으로 소비 확인 필수. parity 테스트로 가드.
2. **순서**: (1) parity 테스트로 발산 가시화 → (2) JSON 정합 → (3) composite named component + presets 신설 → (4) registry 붕괴(catalog 소싱 + named component 직접 매핑, 인라인 테이블/헬퍼/익명 조립 삭제) → (5) 전체 테스트 + graphify update.
3. registry → catalog(`getEntry`) 단방향 의존 추가. 순환 없음(catalog는 registry를 import하지 않음). 모듈 로드 시 `getEntry` 호출은 기존 `loadPatternStore()` 패턴과 동일하게 안전.
4. composite defaults 이관은 값 1:1 복사(렌더 불변). 누락 시 composite 스타일 회귀 → presets 전수 대조 + 기존 renderer composite 테스트로 가드.

## 검증
- 신규 parity 테스트: 모든 layoutId에 대해 registry-derived 계약 == JSON catalog 계약(정합 후 통과, 붕괴 후 자명).
- `vitest run packages/layout packages/renderer packages/validation` 그린.
- `grep -nE "PropContractByKey|compositeProps|pageStackProps|collectionProps|generalAreaProps|screenShellProps" packages/layout/src/components/patterns/registry.ts` → 0건.
- 렌더 스냅샷/기존 테스트 불변.
