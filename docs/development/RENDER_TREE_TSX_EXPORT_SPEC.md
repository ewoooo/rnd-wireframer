# RenderTree → TSX Export — Spec

> 상태: DRAFT (스펙 합의 단계). 구현 플랜이 아니다. 이 문서가 잠긴 뒤에 별도 플랜을 쓴다.
> 작성 근거: 이전 시도(`git stash@{0}`, "abandon-rendertree-tsx-export-WIP")가 부채가 된 원인 분석 + 현재 패키지 계약(`@cx/renderer/adapters`, `@cx/layout/components`, `@cx/schema` RENDER_TREE_NODE_TYPE) 확인.

## 1. 한 줄 정의

생성된 RenderTree 화면을, 기존 `@cx/renderer` 프리뷰와 **시각·구조가 동일한** 정적 React(TSX) 한 파일로 뽑아 개발자에게 인계한다.

## 2. 소비자와 목적 (확정)

- **소비자**: 이 화면을 직접 손볼 개발자.
- **목적**: 일회성 scaffold. 코드를 넘긴 뒤엔 개발자가 손으로 편집한다.
- **함의**: 라운드트립(TSX→RenderTree 역변환), 인앱 재편집, 라이브 프리뷰는 **목표 아님**. 출력은 디스크/클립보드로 나가면 끝.

## 3. 충실도 목표 (확정)

첫 릴리스는 **시각·구조만** 재현하는 정적 TSX다.

재현 대상(동일해야 함):
- 컴포넌트 선택 (어떤 `@cx/components` 컴포넌트인가)
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
- `@cx/components` · `@cx/layout`을 **import해서** 쓴다 (인라인 마크업 아님).
- 따라서 산출물은 이 모노레포 안에서 동작하는 코드다. 외부 휴대성은 목표 아님.
- 루트 엘리먼트는 `div` (참고: [[render-tree-tsx-clean-export]] — AppScreen 배관 제거, layout은 primitive로 낮춤).

## 5. 경계 (확정) — 부채 재발 방지의 핵심

이전 시도가 70파일(+576/−2949)로 번진 이유: 컴파일러 하나를 만들려고 `@cx/layout` 패턴 컴포넌트(CollectionArea/GeneralArea/PageStack/ScreenShell)를 224줄 단위로 재작성하고 `primitive-target`·`codegen-targets`를 신설했다. 레이아웃 패키지의 **런타임 계약을 흔든 것**이 부채의 본체다.

규칙:

1. **컴파일러는 `@cx/renderer` 안에 산다** (`packages/renderer/src/compiler`, 신규 subpath `@cx/renderer/compiler`). `@cx/renderer`가 RenderTree 소비를 소유하므로 컴파일러도 여기 둔다.
2. **컴파일러는 순수 문자열 생성 surface다.** 입력 RenderTree, 출력 TSX 문자열. React 렌더링 없음, 파일시스템 없음.
3. **`@cx/layout` · `@cx/components`의 런타임 동작·구현은 불변.** 패턴 컴포넌트 재작성 금지, primitive 구조 변경 금지.
4. **허용된 계약 추가 = composite 해석을 catalog 데이터로 끌어올림** (§6). 현재 `resolve-component.tsx`의 `COMPONENT_RENDERERS`는 임시 스캐폴딩이고 문자열 키→JSX 함수 맵이라 리터럴 금지 원칙 위반이다([[feedback_no_hardcoded_switch]]). 이를 catalog의 `renderTarget` 계약으로 재배선하는 것이 이 작업의 정식 산출물이다. layout/component **구현**은 여전히 불변 — 바뀌는 건 catalog 데이터와 `@cx/renderer` 어댑터뿐.
5. **리터럴 금지**(원칙). 문자열 키 분기·매핑·고정 prop 값은 contract 테이블로 표현한다. 컴파일러도 런타임도 이 원칙을 따른다.
6. 브라우저 노출이 필요하면 `apps/web`는 `/api/*`만 호출한다. 컴파일러를 클라이언트에서 직접 import하지 않는다 (서버 라우트 경유).

## 6. 중심 설계 제약 — 해석 SSOT 하나

런타임 해석(`@cx/renderer/src/adapters`)의 현재 모양:

- `resolve-layout.ts`: `layoutId` → `findLayoutPatternComponentByLayoutId` (`@cx/layout/components`, catalog 기반). **깨끗함** — 컴파일러가 그대로 미러 가능.
- `resolve-component.tsx`:
  - `resolveComponentByType` — `@cx/components` export 이름 + `componentCatalogAliases` 폴백. **깨끗함**.
  - `COMPONENT_RENDERERS` — **하드코딩 맵**. composite를 1:1 아닌 형태로 펼침:
    - `Accordion`, `SectionMessage` → `<Callout>`
    - `ListCell` → `<ListText>`
    - `Checkbox`, `RadioText` → `<ListSelected>`
    - `HeaderBase` → `<AppBar>`
    - `SectionHeader` → 인라인 `<section><h2><p>` (tailwind 클래스 포함)

문제: 컴파일러가 충실한 태그를 뽑으려면 이 해석을 알아야 한다. 두 가지 안티패턴을 둘 다 피해야 한다.
- ❌ 컴파일러 안에 두 번째 switch를 복제한다 → [[feedback_no_hardcoded_switch]] 위반, 런타임과 영구 drift.
- ❌ `@cx/layout`/`@cx/components`를 갈아엎어 컴파일러에 맞춘다 → 이전 부채 재발.

**해결 방향 (스펙 수준 결정, 세부는 플랜에서):**

node.type/layoutId → `{ tag, importFrom, propMapping }`를 **하나의 선언적 테이블**로 추출하고, **런타임 adapter와 컴파일러가 같은 테이블을 읽는다.** 이 테이블이 §5-4에서 허용한 "최소 계약 추가"다. 즉 `COMPONENT_RENDERERS`의 암묵 지식을 데이터로 끌어올려 SSOT화한다. 현재 `resolveComponentByType`/`resolve-layout`이 이미 catalog를 읽으므로, 테이블은 그 catalog를 확장하는 형태가 자연스럽다 (node 타입 단일 진실원 = `@cx/schema` 원칙 유지, [[node-types-single-source]]).

### 6.1 SectionHeader 제거 (완료) — 난점 1개 사전 제거

인라인 마크업으로 펼쳐지던 유일한 composite `SectionHeader`(`<section><h2><p>`)는 **생성 파이프라인이 한 번도 뽑지 않는 죽은 노드**였다. 실제 생성 산출물(`.data/inference-jobs`, 5잡) 0회, 섹션 제목은 전부 직접 컴포넌트 `TitleSection`으로 표현. 커밋 `c9fc22ac`로 catalog/렌더러/테스트에서 제거했다. 따라서 "원시 마크업 펼침 템플릿"이라는 가장 어려운 표현 문제가 스펙에서 사라졌고, 남은 composite는 모두 **단일 컴포넌트 1:1 매핑**이라 `{ tag, props }` 형태로 표현된다:

- `Accordion`, `SectionMessage` → `Callout`
- `ListCell` → `ListText`
- `Checkbox`, `RadioText` → `ListSelected`
- `HeaderBase` → `AppBar`

### 6.2 남은 composite는 살아있다 (확인 완료) — 그래서 §6 SSOT가 필수

처음엔 `COMPONENT_RENDERERS` 전체가 죽었을 가능성을 의심했다(5잡 산출물에 0회). 그러나 모델 노출 경로를 확인한 결과 **반대였다.** `resolveComponentCatalogForInference()` → `listCatalog()` → `filterRegistry({})`는 `internalComponentCatalog`를 **source 필터 없이 전부** 반환한다(`packages/component/src/public/catalog.ts`). 따라서 남은 5개 renderer-composite(`accordion`, `checkbox`, `header`(HeaderBase), `list-cell`, `section-message`)는 **모델에게 그대로 노출되며 정당하게 선택 가능하다.** 5잡에서 안 골랐을 뿐 죽은 게 아니다. 특히 `section-message`는 `variant`(info/negative/positive/cautionary) 고유 prop 계약을 가진다.

함의: 컴파일러는 composite를 무시할 수 없다. 그 매핑(`accordion`/`section-message`→`Callout`, `list-cell`→`ListText`, `checkbox`→`ListSelected`, `header`→`AppBar`)은 현재 `COMPONENT_RENDERERS` 하드코딩 맵에만 존재하므로, **컴파일러가 충실한 태그를 뽑으려면 이 매핑을 공유 테이블로 끌어올려야 한다(§6 option 1 확정).**

다행히 §6.1로 인라인 마크업 펼침(SectionHeader)이 사라져서, 남은 composite는 **전부 단일 컴포넌트 1:1** 매핑이다. 따라서 공유 테이블은 `{ tag, importFrom, propMapping }` 한 형태로 충분하고, 별도 "펼침 템플릿" 표현은 필요 없다.

### 6.3 `renderTarget` 계약 형태 (재배선 대상)

현재 `COMPONENT_RENDERERS` 함수가 품은 지식을 composite catalog 엔트리의 `renderTarget` 데이터로 옮긴다:

- **타깃 컴포넌트**: `accordion`/`section-message`→`Callout`, `list-cell`→`ListText`, `checkbox`/`RadioText`→`ListSelected`, `header`→`AppBar`.
- **prop 배선**: composite prop/metadata → 타깃 prop 매핑. 고정 리터럴 값도 데이터로 (`checkbox`: `type:"checkbox"`, `showButton:false`, `showPrice:false` / `RadioText`: `type:"radio"`).
- **충실도 복구 기회**: 현재 렌더러는 `section-message`의 `variant`(info/negative/positive/cautionary)를 버린다. `renderTarget` prop 배선에 `variant`를 넣어 Callout으로 전달하면 충실도가 올라간다 (플랜에서 확정).

부차 리터럴: `build-component-props.ts`의 `CATALOG_TEXT_PROP_SOURCE_KEYS`(prop→source 키 별칭 맵)도 같은 성격의 리터럴이다. prop 계약에 `sourceKeys`로 흡수할 후보 — 이번 범위에 넣을지는 §9.

> `PROP_VALUE_COERCERS`는 prop **타입**(string/boolean/number/...) 키라 컴포넌트 문자열 분기가 아니다. 리터럴 금지 대상 아님 — 유지.

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
- import 문 자동 수집 (사용한 `@cx/components`/`@cx/layout` 심볼만).
- 해석 불가 node는 **조용히 누락하지 않고** 진단 주석으로 표시.

제외 (명시적 비목표):
- 이벤트/액션/바인딩 동작.
- 라운드트립, 인앱 편집, 라이브 프리뷰.
- 외부 휴대용(인라인 마크업) 출력.
- 다중 화면/라우팅 생성.

## 8. 성공 기준

1. **시각 패리티**: 컴파일된 TSX를 렌더한 DOM이 `@cx/renderer` 프리뷰 DOM과 구조적으로 일치 (스냅샷/DOM 패리티 테스트로 강제).
2. **계약 무흔들**: `@cx/layout`·`@cx/components`의 기존 public API·런타임 동작 테스트가 변경 없이 그대로 통과.
3. **단일 SSOT + 리터럴 제거**: node→element 해석이 런타임과 컴파일러에서 같은 catalog `renderTarget` 테이블을 읽는다. `resolve-component.tsx`에 `COMPONENT_RENDERERS` 같은 문자열 키→렌더러 리터럴 맵이 남지 않는다. 컴파일러 안에도 독립 switch 없음 (no-hardcoded-switch 정책 + 테스트/리뷰로 강제).
4. **누락 가시성**: 해석 불가 surface는 출력에서 진단 주석으로 드러난다 (조용한 drop 금지).
5. **범위 한계**: 변경 파일 수가 컴파일러 + 공유 테이블 + 테스트로 한정 (레이아웃 패키지 대규모 재작성 없음).

## 9. 미해결 (플랜에서 확정)

- 공유 해석 테이블의 정확한 위치: `@cx/components/catalog` 확장 vs `@cx/schema` 신규 vs `@cx/renderer` 내부 공유 모듈. (§6 방향은 catalog 확장 선호. composite→컴포넌트 매핑은 이미 catalog에 `kind`/`type`이 있으니 catalog 확장이 자연스럽다.)
- `renderTarget` prop 배선의 표현 형식 (선언 매핑 데이터 vs 작은 변환 함수) + `section-message` variant 충실도 복구를 이번 범위에 넣을지.
- `CATALOG_TEXT_PROP_SOURCE_KEYS`(build-component-props.ts)를 prop 계약 `sourceKeys`로 흡수할지 — Phase 1에 포함 vs 후속.
- props 직렬화 규칙 (`{ bind, default }`에서 `default`만, 문자열 이스케이프, 비-원시 props 처리).
- 진단 주석의 형식/위치.
- `apps/web` 노출 시점 (릴리스 1에 포함 여부, `/api/*` 라우트 형태).

## 10. 이전 시도 참고

`git stash@{0}` (= "abandon-rendertree-tsx-export-WIP")에 전체 구현과 당시 플랜(`docs/superpowers/plans/2026-06-09-render-tree-tsx-export.md`)이 보존돼 있다. 코드 재사용이 아니라 **무엇이 부채가 됐는지의 반례**로 참고한다. 특히 layout 패키지 재작성 부분은 §5 규칙으로 의도적으로 배제한다.
