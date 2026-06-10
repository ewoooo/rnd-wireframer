# RenderTree → TSX Export — Spec

> 상태: DRAFT (스펙 합의 단계). 구현 플랜이 아니다. 이 문서가 잠긴 뒤에 별도 플랜을 쓴다.
> 작성 근거: 이전 시도(`git stash@{0}`, "abandon-rendertree-tsx-export-WIP")가 부채가 된 원인 분석 + 현재 패키지 계약(`@cx/renderer/adapters`, `@cx/layout/registry`+`/canonicalize`, `@cx/external/registry`, `@cx/schema` RENDER_TREE_NODE_TYPE) 확인.
> 갱신(2026-06-09 external SSOT): 컴포넌트 어휘는 `@cx/external`(`kiki.X` canonical)로 이전됐고, renderer는 `registry` + `canonicalize`로 컴포넌트를 직접 해석한다. 이 문서의 구 `@cx/components`/`@cx/layout/components` 참조를 그 기준으로 갱신했다.

## 1. 한 줄 정의

생성된 RenderTree 화면을, 기존 `@cx/renderer` 프리뷰와 **시각·구조가 동일한** 정적 React(TSX) 한 파일로 뽑아 개발자에게 인계한다.

## 2. 소비자와 목적 (확정)

- **소비자**: 이 화면을 직접 손볼 개발자.
- **목적**: 일회성 scaffold. 코드를 넘긴 뒤엔 개발자가 손으로 편집한다.
- **함의**: 라운드트립(TSX→RenderTree 역변환), 인앱 재편집, 라이브 프리뷰는 **목표 아님**. 출력은 디스크/클립보드로 나가면 끝.

## 3. 충실도 목표 (확정)

첫 릴리스는 **시각·구조만** 재현하는 정적 TSX다.

재현 대상(동일해야 함):
- 컴포넌트 선택 (어떤 `@cx/external` 컴포넌트인가, `kiki.X`)
- 레이아웃·패턴 선택 (어떤 `@cx/layout` 패턴/primitive인가)
- props (해석된 값)
- region 순서 (Header / Contents / Bottom, 그 안의 자식 순서)

재현 대상 아님(주석 또는 사이드카로만 보존):
- 이벤트·액션
- 데이터 바인딩의 동적 동작 (`{ bind, default }`는 `default`만 정적 표시, `bind`는 주석)
- `displayWhen` / 조건부 표시 훅
- source 메타데이터

## 4. 출력 형태 (확정)

- 화면당 **단일 `.tsx` 파일**.
- `@cx/external` · `@cx/layout`을 **import해서** 쓴다 (인라인 마크업 아님).
- 따라서 산출물은 이 모노레포 안에서 동작하는 코드다. 외부 휴대성은 목표 아님.
- 루트 엘리먼트는 `div` (참고: [[render-tree-tsx-clean-export]] — AppScreen 배관 제거, layout은 primitive로 낮춤).

## 5. 경계 (확정) — 부채 재발 방지의 핵심

이전 시도가 70파일(+576/−2949)로 번진 이유: 컴파일러 하나를 만들려고 `@cx/layout` 패턴 컴포넌트(CollectionArea/GeneralArea/PageStack/ScreenShell)를 224줄 단위로 재작성하고 `primitive-target`·`codegen-targets`를 신설했다. 레이아웃 패키지의 **런타임 계약을 흔든 것**이 부채의 본체다.

규칙:

1. **컴파일러는 `@cx/renderer` 안에 산다** (`packages/renderer/src/compiler`, 신규 subpath `@cx/renderer/compiler`). `@cx/renderer`가 RenderTree 소비를 소유하므로 컴파일러도 여기 둔다.
2. **컴파일러는 순수 문자열 생성 surface다.** 입력 RenderTree, 출력 TSX 문자열. React 렌더링 없음, 파일시스템 없음.
3. **`@cx/layout` · `@cx/external`의 런타임 동작·구현은 불변.** 패턴 컴포넌트 재작성 금지, primitive 구조 변경 금지.
4. **render registry는 `@cx/renderer` 내부 private contract table이다** (§6). node→구체 엘리먼트 해석(HOW)은 renderer가 소유한다. catalog(`@cx/external`/`@cx/layout`)는 *무엇이 있나*(컴포넌트·prop 계약·layout 패턴, WHAT)를 소유한다. 둘을 섞지 않는다. **이 테이블을 `@cx/layout` 리팩터로 만들지 않는다** — renderer 내부에 둔다. 현재 `resolve-component.tsx`의 `COMPONENT_RENDERERS` 등 renderer-local 임시 매핑을 이 registry로 정리하고, **런타임 렌더러와 TSX exporter가 같은 registry를 읽는다.**
5. **리터럴 금지**(원칙, [[feedback_no_hardcoded_switch]]). 문자열 키 분기·매핑·고정 prop 값은 contract 테이블로 표현한다. 컴파일러도 런타임도 이 원칙을 따른다. **exporter는 현재 하드코딩을 복제하지 않는다** — registry를 읽는다.
6. 브라우저 노출이 필요하면 `apps/web`는 `/api/*`만 호출한다. 컴파일러를 클라이언트에서 직접 import하지 않는다 (서버 라우트 경유).

## 6. 중심 설계 제약 — 해석 SSOT 하나

런타임 해석(`@cx/renderer/src/adapters`)의 현재 모양:

- `resolve-layout.ts`: `layoutId` → `@cx/layout/registry`[`canonicalizeLayout(id)`] (canonical componentKey 직접 해석). **깨끗함** — 컴파일러가 그대로 미러 가능.
- `resolve-component.tsx`:
  - `resolveComponentByType` — `@cx/external/registry` export 조회 + `kiki.` 접두사 strip 규칙(`componentsByType[type] ?? componentsByType[type.replace(/^kiki\./, "")]`). DB-load 트리는 canonical이므로 구 `componentCatalogAliases` 폴백은 제거됨. **깨끗함**.
  - `COMPONENT_RENDERERS` — **하드코딩 맵**. composite를 1:1 아닌 형태로 펼침:
    - `Accordion`, `SectionMessage` → `<Callout>`
    - `ListCell` → `<ListText>`
    - `Checkbox`, `RadioText` → `<ListSelected>`
    - `HeaderBase` → `<AppBar>`
    - `SectionHeader` → 인라인 `<section><h2><p>` (tailwind 클래스 포함)

문제: 컴파일러가 충실한 태그를 뽑으려면 이 해석을 알아야 한다. 두 가지 안티패턴을 둘 다 피해야 한다.
- ❌ 컴파일러 안에 두 번째 switch를 복제한다 → [[feedback_no_hardcoded_switch]] 위반, 런타임과 영구 drift.
- ❌ `@cx/layout`/`@cx/external`를 갈아엎어 컴파일러에 맞춘다 → 이전 부채 재발.

**해결 방향 (스펙 수준 결정, 세부는 플랜에서):**

`@cx/renderer` 내부에 **private render registry**를 둔다. node.type/composite → `{ target, importFrom, propWiring }`를 선언적으로 담고, **런타임 어댑터와 TSX exporter가 같은 registry를 읽는다.** node 타입 단일 진실원은 여전히 `@cx/schema`([[node-types-single-source]]); registry는 그 타입을 키로 *어떻게 렌더되나*만 선언한다. catalog 확장이 **아니다** — catalog는 WHAT, registry는 HOW. `@cx/layout` 리팩터도 아니다.

런타임은 registry에서 실제 컴포넌트 참조를 얻어 `createElement`하고, exporter는 같은 registry에서 컴포넌트 **이름 + import 경로 + prop 직렬화 규칙**을 얻어 문자열을 만든다. 둘은 propWiring 규칙을 공유한다.

### 6.1 SectionHeader 제거 (완료) — 난점 1개 사전 제거

인라인 마크업으로 펼쳐지던 유일한 composite `SectionHeader`(`<section><h2><p>`)는 **생성 파이프라인이 한 번도 뽑지 않는 죽은 노드**였다. 실제 생성 산출물(`.data/inference-jobs`, 5잡) 0회, 섹션 제목은 전부 직접 컴포넌트 `TitleSection`으로 표현. 커밋 `c9fc22ac`로 catalog/렌더러/테스트에서 제거했다. 따라서 "원시 마크업 펼침 템플릿"이라는 가장 어려운 표현 문제가 스펙에서 사라졌고, 남은 composite는 모두 **단일 컴포넌트 1:1 매핑**이라 `{ tag, props }` 형태로 표현된다:

- `Accordion`, `SectionMessage` → `Callout`
- `ListCell` → `ListText`
- `Checkbox`, `RadioText` → `ListSelected`
- `HeaderBase` → `AppBar`

### 6.2 남은 composite는 살아있다 (확인 완료) — 그래서 §6 SSOT가 필수

처음엔 `COMPONENT_RENDERERS` 전체가 죽었을 가능성을 의심했다(5잡 산출물에 0회). 그러나 모델 노출 경로를 확인한 결과 **반대였다.** `@cx/external/resolver`의 `resolveComponentCatalogForInference()`는 `catalog.generated`(`externalCatalog`)를 **source 필터 없이 전부** 반환한다. 따라서 남은 renderer-composite(`accordion`, `checkbox`, `header`(HeaderBase), `list-cell`, `section-message`)는 **모델에게 그대로 노출되며 정당하게 선택 가능하다.** 5잡에서 안 골랐을 뿐 죽은 게 아니다. 특히 `section-message`는 `variant`(info/negative/positive/cautionary) 고유 prop 계약을 가진다.

함의: 컴파일러는 composite를 무시할 수 없다. 그 매핑(`accordion`/`section-message`→`Callout`, `list-cell`→`ListText`, `checkbox`→`ListSelected`, `header`→`AppBar`)은 현재 `COMPONENT_RENDERERS` 하드코딩 맵에만 존재하므로, **컴파일러가 충실한 태그를 뽑으려면 이 매핑을 공유 테이블로 끌어올려야 한다(§6 option 1 확정).**

다행히 §6.1로 인라인 마크업 펼침(SectionHeader)이 사라져서, 남은 composite는 **전부 단일 컴포넌트 1:1** 매핑이다. 따라서 공유 테이블은 `{ tag, importFrom, propMapping }` 한 형태로 충분하고, 별도 "펼침 템플릿" 표현은 필요 없다.

### 6.3 registry entry 형태 (composite)

`COMPONENT_RENDERERS` 함수가 품은 지식을 renderer-private registry entry로 옮긴다:

- **target**: `accordion`/`section-message`→`Callout`, `list-cell`→`ListText`, `checkbox`/`RadioText`→`ListSelected`, `header`→`AppBar`. (런타임은 컴포넌트 참조, exporter는 이름+import 경로)
- **propWiring**: composite prop/metadata → target prop 매핑. 고정 리터럴 값도 데이터로 (`checkbox`: `type:"checkbox"`, `showButton:false`, `showPrice:false` / `RadioText`: `type:"radio"`).
- **충실도 복구 기회(보류)**: 현재 렌더러는 `section-message`의 `variant`를 버린다. registry propWiring에 넣으면 복구되나, Phase 1은 동작 보존이라 보류(§9).

> `PROP_VALUE_COERCERS`(build-component-props.ts)는 prop **타입**(string/boolean/number/...) 키라 컴포넌트 문자열 분기가 아니다. 리터럴 금지 대상 아님 — 유지.

### 6.4 renderer 하드코딩 전수 감사 (registry 정리 대상)

renderer는 구조는 맞지만 완전히 catalog-driven은 아니다. layout pattern resolve(`resolve-layout.ts`)는 catalog를 잘 따르나, component/primitive/area 쪽에 renderer-local 임시 매핑이 남아있다. exporter는 이것들을 **복제하면 안 되고** registry를 읽어야 한다.

| # | 위치 | 하드코딩 | 성격 | 우선순위 |
|---|---|---|---|---|
| 1 | `resolve-component.tsx:40` `COMPONENT_RENDERERS` | composite→컴포넌트 + prop 배선 | 가장 명확한 임시 매핑 | **Phase 1 핵심** |
| 2 | `render-primitive.tsx:20` | `Layout.Flex`/`Layout.Grid` if 분기 | 작음(2개), 태그+`layout`/`node` 관례 | Phase 1 후보 (작아서 같이) |
| 3 | `resolve-area.tsx:16` | `area.static`/`area.dynamic` 분기 | 디스패치는 테이블화 가능하나 dynamic은 **행위**(데이터 반복/displayWhen) | 디스패치만 registry화, 행위는 함수 유지 |
| 4 | `build-component-props.ts` 텍스트 prop source 키 | prop→source 키 별칭 맵 | **이전 완료**: `@cx/external/catalog.text-sources.ts`로 이동, `@cx/external/resolver` 경유 소비(커밋 `b9127ea4`) | 완료 |
| 5 | `nodes/area/layout.tsx:10` | selection-list presentation + border/padding 스타일 | renderer-local 시각 하드코딩 | 후속 |

primitive(2)와 area(2)는 지금 작아서 `if`가 견딜 만하지만 늘면 계약 테이블로 빼야 한다. registry는 이 셋(component/primitive/area dispatch)을 한 곳에서 키로 해석하도록 설계해, 늘어날 때 분기가 아니라 데이터 추가가 되게 한다.

## 7. MVP 범위 (릴리스 1)

두 단계로 나눈다. Phase 1이 Phase 2의 전제다.

**Phase 1 — 런타임 해석 데이터화 (컴파일러와 무관하게도 옳은 정리):**
- `COMPONENT_RENDERERS`(resolve-component.tsx)를 catalog `renderTarget` 계약으로 끌어올림 (§6.3).
- 런타임 어댑터를 `renderTarget` 읽는 제너릭 렌더러 1개로 교체, 함수 N개 삭제.
- **동작 보존**: 기존 `@cx/renderer` 테스트가 변경 없이 통과 (안전망).

**Phase 2 — 컴파일러:**
- `compileRenderTreeToTsx(renderTree): string` — 단일 화면 RenderTree → TSX 문자열.
- Screen/Header/Contents/Bottom region 골격.
- catalog 직접 해석 컴포넌트 + composite `renderTarget` (Phase 1의 같은 테이블 소비).
- catalog로 해석되는 layout 패턴.
- import 문 자동 수집 (사용한 `@cx/external`/`@cx/layout` 심볼만).
- 해석 불가 node는 **조용히 누락하지 않고** 진단 주석으로 표시.

제외 (명시적 비목표):
- 이벤트/액션/바인딩 동작.
- 라운드트립, 인앱 편집, 라이브 프리뷰.
- 외부 휴대용(인라인 마크업) 출력.
- 다중 화면/라우팅 생성.

## 8. 성공 기준

1. **시각 패리티**: 컴파일된 TSX를 렌더한 DOM이 `@cx/renderer` 프리뷰 DOM과 구조적으로 일치 (스냅샷/DOM 패리티 테스트로 강제).
2. **계약 무흔들**: `@cx/layout`·`@cx/external`의 기존 public API·런타임 동작 테스트가 변경 없이 그대로 통과.
3. **단일 SSOT + 리터럴 제거**: node→element 해석이 런타임과 exporter에서 같은 **renderer-private registry**를 읽는다. `resolve-component.tsx`에 `COMPONENT_RENDERERS` 같은 문자열 키→렌더러 리터럴 맵이 남지 않는다. exporter 안에도 독립 switch 없음 (no-hardcoded-switch 정책 + 테스트/리뷰로 강제).
4. **누락 가시성**: 해석 불가 surface는 출력에서 진단 주석으로 드러난다 (조용한 drop 금지).
5. **범위 한계**: 변경이 `@cx/renderer`(registry + 어댑터 + 컴파일러) + 테스트로 한정. `@cx/layout` 리팩터·대규모 재작성 없음.

## 9. 미해결 (플랜에서 확정)

- **(해결)** 테이블 위치 = `@cx/renderer` 내부 private render registry. catalog 확장/`@cx/schema` 신규/`@cx/layout` 리팩터 **아님** (§5-4, §6).
- registry entry의 propWiring 표현 형식 (선언 매핑 데이터 vs 작은 변환 함수).
- `section-message` variant 충실도 복구를 어느 시점에 (Phase 1은 동작 보존이라 보류 권장).
- registry 정리 범위 (§6.4): Phase 1에 #1 COMPONENT_RENDERERS만 vs #2 primitive까지 vs #3 area dispatch까지. #4/#5는 후속.
- ~~`CATALOG_TEXT_PROP_SOURCE_KEYS`를 prop alias 계약으로 흡수할지 (#4)~~ — **해결**: `@cx/external/catalog.text-sources.ts`로 이전 완료(커밋 `b9127ea4`).
- props 직렬화 규칙 (`{ bind, default }`에서 `default`만, 문자열 이스케이프, 비-원시 props 처리).
- 진단 주석의 형식/위치.
- `apps/web` 노출 시점 (릴리스 1에 포함 여부, `/api/*` 라우트 형태).

## 10. 이전 시도 참고

`git stash@{0}` (= "abandon-rendertree-tsx-export-WIP")에 전체 구현과 당시 플랜(`docs/superpowers/plans/2026-06-09-render-tree-tsx-export.md`)이 보존돼 있다. 코드 재사용이 아니라 **무엇이 부채가 됐는지의 반례**로 참고한다. 특히 layout 패키지 재작성 부분은 §5 규칙으로 의도적으로 배제한다.
