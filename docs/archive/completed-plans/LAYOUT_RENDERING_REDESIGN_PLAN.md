# Layout Rendering Redesign Plan

## 1. 문서 책임

이 문서는 layout pattern store, renderer, table schema, table-to-RenderTree 경계 전환 계획을 정의한다.

패키지의 현재 책임 기준은 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md), 저장소 구조는 [PROJECT_STRUCTURE.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PROJECT_STRUCTURE.md)를 따른다. 이 문서는 전환 순서와 완료 기준만 다루고, 개별 컴포넌트 세부 구현은 각 패키지 코드와 catalog 계약에 둔다.

## 2. 목표

현재 구조는 catalog JSON의 `layout`/`layoutProps`를 renderer가 일부 해석하거나 table materializer가 중간 형태를 보정하는 방식이 섞여 있다. 전환 후 구조는 아래와 같다.

```text
data/tables/*
-> table-to-RenderTree materializer
-> RenderTree JSON
-> @cx/renderer React interpreter
-> @cx/layout-pattern-store registered layout component
-> @cx/layout primitives / @cx/components leaves
```

전환 목표:

- `@cx/layout-pattern-store`를 단순 JSON reference catalog에서 실제 React layout component library로 전환한다.
- `@cx/renderer`는 RenderTree를 React로 해석하는 interpreter로 유지한다.
- `data/tables/*` 스키마를 변경된 pattern store의 `layout.<target>.<name>` 계약에 맞춘다.
- table-to-RenderTree 기능은 renderer가 아니라 별도 순수 materializer/parser 성격의 경계로 분리한다.
- 기존 호환 layer를 병행 유지하지 않는다.
- padding, gap, inset, width rail 같은 layout 수치는 변환 중 손실하지 않는다.

## 2-1. 왜 개선인가

이 전환은 단순히 JSON field 이름을 바꾸는 작업이 아니다. 개선의 핵심은 layout 의미를 해석하는 위치를 하나로 줄이는 데 있다.

현재 문제:

- catalog의 `layoutProps`가 reference data인지 runtime props인지 흐려져 있다.
- renderer, web helper, table materializer가 layout 의미를 나눠 해석한다.
- pattern store가 실제 component identity를 소유하지 않으면 renderer가 pattern id를 보고 추측하게 된다.
- default spacing 값이 catalog와 component 사이에 흩어지면 변환 중 padding/gap 손실이 발생한다.

목표 상태:

- pattern store는 `layout.*` id와 실제 React layout component registry를 소유한다.
- catalog는 pattern component가 받을 수 있는 prop 이름과 타입만 설명한다.
- default 값과 fallback alias 처리는 실제 pattern component가 소유한다.
- renderer는 RenderTree를 해석해 등록된 pattern component에 children을 붙인다.
- table-to-RenderTree 변환은 renderer 바깥의 순수 materializer/parser 경계에서 수행한다.

## 2-2. Current vs Target 책임

| 책임 | 현재 | 목표 |
|---|---|---|
| layout pattern 실제 렌더 | renderer 일부, layout-pattern-store 일부, legacy layoutProps | `@cx/layout-pattern-store`의 실제 pattern component |
| pattern prop 타입 계약 | catalog와 legacy layoutProps 혼재 | catalog의 prop name/type contract |
| pattern default 값 | catalog default와 primitive default 혼재 | 실제 pattern component default |
| table -> RenderTree | web/helper/임시 materializer | 별도 순수 table-to-RenderTree materializer/parser |
| RenderTree -> React | `@cx/renderer` | `@cx/renderer` |
| pattern 선택 | orchestration/AI/reference matching | orchestration/AI/reference matching |
| validation | 일부 런타임 fallback에 의존 | schema/validation에서 target/layout mismatch를 사전 검출 |

## 2-3. 패키지별 목표 책임

| 패키지 | 목표 책임 | 하지 않는 일 |
|---|---|---|
| `@cx/table-materializer` | table read model을 screen 단위 `RenderTreeScreenNode`로 조립하는 순수 함수 | React render, layout 선택, pattern 추천, spacing 보정, validation 판정, 파일 IO |
| `@cx/renderer` | `RenderTreeScreenNode`를 React element로 해석하는 순수 interpreter | table schema import, table relation 조립, layout id 추측, catalog default 주입 |
| `@cx/layout-pattern-store` | `layout.*` id, prop type contract, 실제 layout component registry 소유 | table 조립, RenderTree 재작성, AI/pipeline 실행 |
| `@cx/layout` | `PageStack`, `VStack`, `HStack`, `Grid`, `AppScreen` 같은 primitive 제공 | pattern id/catalog 소유, table 조립 |
| `@cx/components` | leaf component와 component prop catalog 소유 | layout pattern default, table 조립 |
| `@cx/validation` | RenderTree/table/catalog 계약 위반 검출 | 자동 보정, 렌더, 파일 쓰기 |
| `apps/web` | table JSON을 읽어 materializer와 renderer API를 호출하는 preview UI | table-to-RenderTree 조립 로직 소유 |

실행 체크:

- `@cx/table-materializer`는 `@cx/renderer`, `@cx/layout-pattern-store`, `@cx/components`, React를 import하지 않는다.
- `@cx/renderer`는 `data/tables`, table record 타입, materializer helper를 import하지 않는다.
- `@cx/layout-pattern-store` catalog는 runtime default 값을 갖지 않는다.
- `@cx/layout-pattern-store` component는 필요한 primitive를 직접 고르고 자기 default를 갖는다.
- `apps/web`은 preview shell이며 table JSON read, materializer 호출, renderer 호출까지만 한다.
- `@cx/validation`은 나중에 `type`과 `layout` target mismatch를 차단하되, 값을 고쳐주지는 않는다.

## 2-4. 현재 스펙 연결성

현재 스펙상 table materializer의 출력은 renderer에 바로 들어갈 수 있어야 한다. 출력은 full artifact wrapper가 아니라 screen 단위 `RenderTreeScreenNode`다.

```text
data/tables/*
-> materializeTableScreen(...)
-> RenderTreeScreenNode
-> <RenderTreeView node={renderTree} />
-> screen preview
```

현재 구현도 이미 이 연결 형태를 갖고 있다.

- `apps/web/src/lib/screen-sources.ts`는 table JSON을 읽고 `materializeTableScreen({ screen, tables })` 결과를 screen summary의 `renderTree`로 저장한다.
- `apps/web/src/components/screen/RenderedScreen.tsx`는 그 `RenderTreeScreenNode`를 `<RenderTreeView node={node} />`에 바로 전달한다.

따라서 개선의 핵심은 output shape를 바꾸는 것이 아니다. 현재 `@cx/renderer/table`에 들어 있는 table materializer 기능을 renderer 밖의 순수 패키지로 옮기고, 출력 계약은 계속 `RenderTreeScreenNode`로 유지하는 것이다.

주의:

- materializer가 만든 RenderTree가 renderer 입력 shape에 맞는 것과 모든 layout이 실제 wrapper로 렌더되는 것은 다른 문제다.
- 등록되지 않은 `layout.region.*` 또는 `layout.composite.*`가 있으면 renderer는 바로 소비하더라도 기대한 wrapper를 못 찾을 수 있다.
- 이 문제는 materializer 책임이 아니라 layout-pattern-store 변환과 validation 책임이다.

## 2-5. 사용자 우려와 결정

우려 1. materializer가 너무 똑똑해지는가?

- 결정: materializer는 특수 작업을 하지 않는다.
- screen id를 기준으로 table record를 조회하고 관계를 따라 합친다.
- 없는 layout을 추측하거나 spacing 값을 보정하지 않는다.

우려 2. materializer 출력이 renderer에 바로 들어갈 수 있는가?

- 결정: 들어갈 수 있어야 한다.
- materializer의 출력 타입은 renderer 입력 타입인 `RenderTreeScreenNode`다.
- 별도 중간 산출물이나 preview-only shape를 만들지 않는다.

우려 3. table-to-RenderTree를 renderer에 넣어도 되는가?

- 결정: 넣지 않는다.
- 현재 위치가 `@cx/renderer/table`인 것은 임시 상태로 보고, `@cx/table-materializer`로 분리한다.
- renderer는 RenderTree-to-React interpreter로만 남긴다.

우려 4. catalog default가 spacing 손실을 부르는가?

- 결정: catalog는 default를 소유하지 않는다.
- default는 실제 layout component가 소유한다.
- catalog는 받을 수 있는 prop 이름과 타입만 설명한다.

우려 5. 이름에 `Pattern` 접미사가 필요한가?

- 결정: componentID와 React component 이름에서 `Pattern` 접미사를 빼고 `ListStackArea`, `FieldStackArea`처럼 쓴다.
- 이미 layout-pattern-store 내부의 component이므로 `Pattern` 접미사는 중복 의미다.

우려 6. table materializer가 layout/component catalog를 알아야 하는가?

- 결정: 알 필요가 없다.
- materializer는 table record에 이미 적힌 `layout`과 `props`를 RenderTree node에 옮긴다.
- catalog 존재 여부, prop 허용 여부, children 허용 여부는 validation에서 확인한다.

우려 7. RenderTree로 만들기 전에 table 단계에서 screen을 보정해야 하는가?

- 결정: 보정하지 않는다.
- table read model이 불완전하면 materializer가 invented layout이나 invented props를 만들지 않고 issue/error로 드러나게 한다.
- spacing 보존은 catalog 변환 시 component default/alias로 처리하고 materializer에서 복구하지 않는다.

우려 8. renderer가 등록되지 않은 layout을 generic wrapper로 살려도 되는가?

- 결정: 최종 상태에서는 안 된다.
- renderer는 interpreter이므로 등록 component가 없다는 사실을 숨기지 않는다.
- 개발 중 디버그 표시는 가능하지만, 제품 계약의 성공 조건으로 보지 않는다.

## 3. 현재 상태

완료된 것:

- table record의 `pattern: { id, variant }` 필드를 `layout: "layout.*"` 필드로 변환했다.
- `layout-pattern-store` catalog schema에서 새 component catalog entry는 `layoutId` 대신 `id`를 사용한다.
- table-to-RenderTree materializer 패키지를 `@cx/table-materializer`로 분리했고, web preview가 이 패키지를 호출하도록 바꿨다.
- area PageStack 계열 5개를 새 component catalog entry로 전환했다.
  - `layout.area.listStack`
  - `layout.area.fieldStack`
  - `layout.area.checkboxStack`
  - `layout.area.accordionList`
  - `layout.area.messageStack`
- PageStack 계열은 `componentGap`, `titleGap`, `itemPaddingX`, `paddingY`, `sectionPaddingX` 보존 경로를 둔다.
- region 계열 16개를 새 component catalog entry로 전환했고, region component는 `VStack`/`BottomFixedArea`만 사용한다.
- screen shell 계열 4개를 새 component catalog entry로 전환했다.
- area catalog 40개 전체를 새 component catalog entry로 전환했다.
- composite catalog 49개 전체를 새 component catalog entry로 전환했다.
- renderer 내부의 이전 table materializer subpath와 table view export를 제거했다.
- validation은 RenderTree와 table-shaped generation record에서 node target과 `layout.<target>.*` mismatch를 검출한다.
- layout pattern store schema는 legacy `layout`/`match` catalog shape를 더 이상 normalize하지 않는다.
- 전환된 catalog entry에서는 runtime `default`를 제거하고 실제 component default로 옮겼다.

아직 남은 것:

- 없음. 최종 완료 감사와 public surface scan을 수행했다.

## 4. 원칙

- 변환은 target 단위와 primitive 계열 단위로 묶는다.
- 각 묶음은 catalog entry, React pattern component, prop mapping, renderer test를 함께 완료한다.
- `layoutProps`의 숫자 값은 삭제하지 않고 새 prop 이름에 명시적으로 매핑한다.
- 새 prop 이름만으로 의미가 흐려지는 값은 legacy alias도 계약에 남긴다.
  - 예: `componentGap -> gap`
  - 예: `titleGap -> sectionGap`
- 같은 key domain을 문자열 `switch`/`if` 체인으로 반복하지 않는다.
- 매핑이 필요하면 catalog/component registry/contract table에 둔다.
- catalog는 prop default를 소유하지 않는다.
- pattern별 default 값은 실제 pattern component 파일이 소유한다.
- 같은 primitive를 쓰더라도 default가 다르면 별도 pattern component로 분리한다.
- screen과 region에서는 PageStack을 쓰지 않는다. PageStack은 area pattern 책임이다.
- `type: area.*`는 `layout.area.*`, `type: Screen.*`는 `layout.region.*`, component/composite는 `layout.composite.*`만 사용하도록 validation에서 강제한다.
- 전환 중 old/new catalog 동시 유지는 하지 않는다.

## 5. 전환 묶음

### Batch 0. 계약 잠금

목표:

- `layout.<target>.<name>` id 규칙을 schema, validation, table data에 고정한다.
- `componentID`, `props`, `children`, `status`를 새 pattern catalog entry의 기본 shape로 확정한다.
- prop contract는 `@cx/components/catalog`처럼 받을 수 있는 prop 이름과 타입을 명시한다.

산출물:

- `LayoutPatternCatalogEntry`
- catalog schema tests
- target/layout mismatch validation
- duplicate layout id validation
- catalog default 금지 validation

완료 기준:

- catalog에서 `layoutId` 필드를 쓰지 않는다.
- table record에서 `pattern` 필드를 쓰지 않는다.
- 새 catalog entry는 `id`, `target`, `componentID`를 가진다.
- 새 catalog entry의 `props`는 `type`, `values`, `description` 같은 contract metadata만 갖고 runtime default를 갖지 않는다.

### Batch 1. Area PageStack 계열

대상:

- `layout.area.listStack`
- `layout.area.fieldStack`
- `layout.area.checkboxStack`
- `layout.area.accordionList`
- `layout.area.messageStack`

primitive:

- `PageStack`

componentID 방향:

- `ListStackArea`
- `FieldStackArea`
- `CheckboxStackArea`
- `AccordionListArea`
- `MessageStackArea`

하나의 `PageStackArea`에 catalog default로 차이를 주지 않는다. 각 layout component가 자기 default를 갖고 내부에서 `PageStack` primitive를 사용한다.

보존해야 하는 값:

- `componentGap`
- `titleGap`
- `itemPaddingX`
- `itemPaddingY`
- `paddingX`
- `paddingY`
- `sectionPaddingX`
- `slotInsetX`
- divider 관련 값은 다음 리스트/섹션 batch에서 별도 처리한다.

완료 기준:

- PageStack area pattern이 Figma의 area-level PageStack 구조를 따른다.
- region은 PageStack을 직접 소유하지 않는다.
- `componentGap`만 들어와도 contents child gap이 보존된다.
- `titleGap`만 들어와도 title-to-contents gap이 보존된다.
- list/field/checkbox/accordion/message의 서로 다른 gap default는 catalog가 아니라 각 pattern component가 소유한다.

### Batch 2. Region chrome / stack 계열

대상 예시:

- plain contents region
- bottom action region
- modal/bottom sheet contents region
- header/content/bottom region flow

primitive:

- `VStack`
- `HStack`
- `BottomFixedArea`
- 필요한 경우 region 전용 thin component

보존해야 하는 값:

- region padding
- bottom safe area
- sticky/fixed placement
- content width rail
- region child gap

완료 기준:

- `Screen.Header`, `Screen.Contents`, `Screen.Bottom`은 `layout.region.*`만 사용한다.
- region pattern component는 children을 그대로 배치하고 area pattern 책임을 침범하지 않는다.
- renderer가 region layout을 special-case로 임의 보정하지 않는다.

### Batch 3. Screen shell 계열

대상 예시:

- default app screen
- full screen
- popup screen
- bottom sheet screen
- completion screen

primitive:

- `AppScreen`
- screen chrome helper

보존해야 하는 값:

- viewport width
- chrome size
- header/content/bottom slot
- background
- scroll boundary

완료 기준:

- screen record는 screen chrome만 선택한다.
- screen pattern은 area/component layout 값을 직접 갖지 않는다.
- renderer의 Screen root 처리와 screen pattern component 책임이 충돌하지 않는다.

### Batch 4. Area collection / option 계열

대상 예시:

- option grid
- chip/filter row
- horizontal card collection
- product/card collection
- row card list

primitive:

- `Grid`
- `HStack`
- `PageStack`
- 필요 시 collection 전용 wrapper

보존해야 하는 값:

- `columns`
- `gap`
- `rowGap`
- `columnGap`
- `controlGap`
- horizontal scroll inset
- item width/min width
- item padding

완료 기준:

- collection layout은 item children의 순서와 gap을 보존한다.
- grid/row/scroll 여부는 componentID가 결정하고 renderer가 문자열로 추측하지 않는다.

### Batch 5. Area form / agreement / accordion / message 계열

대상 예시:

- auth method list
- auth code entry
- agreement checkbox list
- accordion list
- notice/message stack
- form field stack

primitive:

- `PageStack`
- `VStack`
- 필요 시 agreement/accordion area wrapper

보존해야 하는 값:

- `titleGap`
- `componentGap`
- divider placement
- nested content indent
- error/help text gap
- checkbox/list row inset

완료 기준:

- form/list/accordion에서 기존 spacing 값이 렌더 스타일로 검증된다.
- divider처럼 단순 gap으로 표현할 수 없는 값은 prop contract에 남긴다.

### Batch 6. Composite wrapper 계열

대상 예시:

- component app bar wrapper
- search bar wrapper
- text/list group wrapper
- price/product info wrapper
- media/thumbnail wrapper

primitive:

- `VStack`
- `HStack`
- `Grid`
- leaf component pass-through wrapper

보존해야 하는 값:

- `height`
- `minHeight`
- `width`
- `paddingX`
- `paddingY`
- align/justify
- icon/media gap
- thumbnail size

완료 기준:

- `layout.composite.*`는 leaf component를 감싸는 layout wrapper만 담당한다.
- leaf component prop 계약은 `@cx/components/catalog`가 소유한다.
- composite pattern이 component prop을 임의 생성하지 않는다.

### Batch 7. Legacy catalog 제거

대상:

- catalog JSON의 legacy `layout`, `layoutProps`, `match`, `variants` shape
- resolver의 legacy normalization
- old renderer/table compatibility tests

완료 기준:

- 모든 catalog entry가 component catalog entry다.
- resolver는 componentID 기반으로만 layout component를 찾는다.
- 누락 componentID는 즉시 실패한다.
- old pattern matching은 orchestration/validation 입력 조립 단계에서 별도 contract table로 다룬다.

## 6. Table-to-RenderTree Materializer 계획

table-to-RenderTree 변환은 renderer로 이관하지 않는다. 이 경계는 페이지 단위 table read model을 RenderTree JSON으로 바꾸는 순수 기능이며, parser/materializer에 가깝다.

책임:

- `data/tables/*` read model을 RenderTree JSON으로 조립한다.
- screen, region, area, composite/component record의 관계를 해석한다.
- table field 이름을 RenderTree node field로 변환한다.
- 페이지 단위로 하나의 `RenderTreeScreenNode`를 만든다.

두지 않는 책임:

- pattern 선택
- AI 생성
- validation rule 판정
- catalog 값 수정
- table 파일 쓰기
- React render

패키지 위치:

- `@cx/table-materializer`

결정:

- table read model을 RenderTree로 바꾸는 책임이 이름에 직접 드러난다.
- Markdown parser인 `@cx/parser`와 혼동되지 않는다.
- renderer 내부 subpath로 넣지 않는다.
- 이 materializer는 parser처럼 순수 함수만 제공한다.

public API 후보:

```ts
materializeTableScreen(input): RenderTreeScreenNode
materializeTableScreens(input): RenderTreeScreenNode[]
```

완료 기준:

- `apps/web`은 table JSON을 읽고 materializer와 `@cx/renderer` API를 호출만 한다.
- table-to-RenderTree 로직이 web 내부에 남지 않는다.
- `@cx/renderer`는 table schema를 import하지 않는다.

## 7. Renderer 전환 계획

renderer는 RenderTree-to-React interpreter다.

책임:

- RenderTree node를 React element로 해석한다.
- node의 `layout` id를 `@cx/layout-pattern-store` resolver에 전달한다.
- resolver가 반환한 pattern component에 children을 붙인다.
- leaf node는 `@cx/components` resolver를 통해 렌더한다.

두지 않는 책임:

- layout id를 추측하거나 보정하지 않는다.
- target mismatch를 조용히 fallback하지 않는다.
- pattern component가 없을 때 generic layout으로 복구하지 않는다.

완료 기준:

- renderer는 registered pattern component만 사용한다.
- fallback은 unknown leaf 표시처럼 디버그 목적에 한정한다.
- layout missing/mismatch는 validation 또는 explicit render issue로 드러난다.

## 8. Table Schema 전환 계획

현재 목표 shape:

```json
{
	"id": "area-id",
	"type": "area.static",
	"layout": "layout.area.fieldStack",
	"props": {
		"componentGap": 12,
		"titleGap": 8
	},
	"children": []
}
```

전환 항목:

- `pattern` 제거
- `layout` 필수화 범위 정의
- `props`는 pattern component prop contract와 component prop contract를 분리
- region/screen에서는 PageStack 관련 prop 금지
- area에서는 `layout.area.*`만 허용
- composite/component에서는 `layout.composite.*`만 허용

완료 기준:

- `data/tables`의 record shape가 RenderTree materializer 입력으로 안정화된다.
- table schema validation이 target/layout mismatch를 잡는다.
- table data에는 renderer가 추측해야 하는 legacy pattern ref가 남지 않는다.

## 9. Catalog Contract 전략

catalog는 runtime default의 소유자가 아니다.

catalog가 소유하는 것:

- `id`
- `target`
- `name`
- `componentID`
- 받을 수 있는 prop 이름
- prop type
- enum values
- children contract
- status
- 설명

catalog가 소유하지 않는 것:

- spacing default
- visual default
- fallback alias 우선순위
- primitive 선택 로직
- React render 구현

예시:

```json
{
	"id": "layout.area.fieldStack",
	"target": "area",
	"componentID": "FieldStackArea",
	"props": {
		"componentGap": { "type": "number" },
		"titleGap": { "type": "number" },
		"itemPaddingX": { "type": "number" },
		"titleMode": {
			"type": "enum",
			"values": ["hidden", "none", "visible"]
		}
	}
}
```

실제 default는 component가 소유한다.

```tsx
export function FieldStackArea({ children, props = {} }) {
	return (
		<PageStack
			gap={readNumber(props.gap) ?? readNumber(props.componentGap) ?? 12}
			sectionGap={readNumber(props.sectionGap) ?? readNumber(props.titleGap) ?? 8}
			itemPaddingX={readNumber(props.itemPaddingX) ?? 20}
			paddingY={readNumber(props.paddingY) ?? 28}
			sectionPaddingX={readNumber(props.sectionPaddingX) ?? 12}
			titleMode={readTitleMode(props.titleMode) ?? "visible"}
		>
			{children}
		</PageStack>
	);
}
```

## 10. Spacing 보존 전략

각 batch는 변환 전에 legacy 값 목록을 먼저 뽑는다.

보존 대상:

- `gap`
- `componentGap`
- `componentGaps`
- `titleGap`
- `sectionGap`
- `paddingX`
- `paddingY`
- `itemPaddingX`
- `itemPaddingY`
- `sectionPaddingX`
- `sectionPaddingY`
- `slotInsetX`
- `contentWidth`
- `widthRail`
- `divider`

변환 규칙:

- 같은 의미의 값은 새 canonical prop으로 옮긴다.
- 기존 이름이 source trace로 중요하면 alias prop으로 남긴다.
- alias가 들어오고 canonical이 없으면 pattern component가 alias를 사용한다.
- canonical이 들어오면 canonical이 우선한다.
- default 값은 pattern component에 명시한다.
- catalog에는 default 값을 쓰지 않는다.

검증:

- 각 batch마다 spacing preservation test를 추가한다.
- 최소한 root padding, child gap, item inset은 DOM style로 확인한다.
- 값 손실이 발견되면 해당 batch 변환을 멈추고 mapping table을 먼저 수정한다.

## 11. Catalog Inventory 작성 기준

각 batch를 시작하기 전에 대상 catalog의 수량과 legacy spacing key를 먼저 기록한다.

필수 inventory 항목:

- target
- legacy pattern id
- new layout id
- componentID
- legacy `layoutProps` key 목록
- 보존해야 하는 spacing key
- children contract
- 변환 상태

예시:

| target | legacy id | new id | componentID | spacing keys | status |
|---|---|---|---|---|---|
| area | `field-stack` | `layout.area.fieldStack` | `FieldStackArea` | `titleGap`, `componentGap`, `itemPaddingX` | in progress |

## 12. 성공 기준과 실패 기준

성공 기준:

- catalog에서 runtime default가 제거된다.
- default 값은 실제 pattern component에서만 정의된다.
- 모든 pattern id는 `layout.<target>.<name>` 형태다.
- renderer는 table schema를 모른다.
- renderer는 pattern id별 hardcoded branch 없이 component registry만 사용한다.
- table-to-RenderTree materializer는 순수 함수로 분리된다.
- web 내부 table materializer가 제거된다.
- spacing 보존 테스트가 batch마다 존재한다.

실패 기준:

- catalog default에 의존해 서로 다른 pattern default를 표현한다.
- renderer가 table read model을 직접 import한다.
- renderer가 pattern id 문자열을 보고 layout을 추측한다.
- spacing 값이 변환 중 사라진다.
- screen/region에서 PageStack을 직접 사용한다.
- table schema와 RenderTree schema가 다시 섞인다.

## 13. 실행 순서

1. Batch 0/1을 현재 변경으로 안정화한다.
2. 현재 PageStack 5개에서 catalog default를 제거하고 pattern component default로 옮긴다.
3. `@cx/table-materializer` public API를 확정한다.
4. table schema와 materializer 입력 타입을 확정한다.
5. region catalog를 Batch 2로 전환한다.
6. screen catalog를 Batch 3으로 전환한다.
7. area catalog를 Batch 4, Batch 5로 나눠 전환한다.
8. composite catalog를 Batch 6으로 전환한다.
9. legacy catalog normalization과 old renderer compatibility tests를 제거한다.
10. `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`, validation 문서를 새 책임 경계에 맞춘다.

## 14. 검증 체크리스트

각 batch 완료 조건:

- `npx tsc --noEmit --pretty false`
- 관련 package unit test
- catalog schema test
- renderer layout render test
- spacing preservation test
- `rg '"pattern"\\s*:' data/tables` 결과 0
- `rg '"layoutId"' packages/layout-pattern-store/src/catalog` 결과 0
- 대상 catalog batch에 prop `default`가 남지 않음
- legacy `layout` shape가 대상 catalog batch 안에 남지 않음

최종 완료 조건:

- 모든 pattern catalog entry가 `id`, `target`, `componentID`, `props`, `children`, `status` 기반이다.
- 모든 pattern catalog entry의 `props`에는 runtime default가 없다.
- table-to-RenderTree materializer가 renderer 밖의 순수 API로 존재한다.
- renderer가 RenderTree-to-React interpreter API를 제공한다.
- web은 materializer와 renderer API를 소비만 한다.
- validation이 target/layout mismatch와 forbidden PageStack placement를 잡는다.
- spacing 보존 테스트가 PageStack, region, screen, collection, composite batch마다 존재한다.

## 15. 커밋 단위 실행 단계

각 단계는 독립 커밋으로 끝낸다. 단계 중간에는 다음 단계의 구조를 미리 만들지 않는다. 단, 타입 수정이나 테스트 fixture 조정처럼 현재 단계 검증에 필요한 변경은 같은 커밋에 포함한다.

자동 실행 원칙:

- 각 Step은 이전 Step 검증이 통과한 뒤에만 시작한다.
- 각 Step은 파일 변경, 검증, 커밋을 한 번에 끝낸다.
- 검증 실패 시 다음 Step으로 넘어가지 않는다.
- 예상 실패로 남겨둔 legacy renderer test는 해당 Step의 검증 목록에 명시된 경우에만 무시한다.
- 커밋 전 `git status --short`로 변경 범위를 확인한다.
- 커밋은 해당 Step의 파일만 staging한다.
- 사용자 변경으로 보이는 unrelated dirty file은 staging하지 않는다.
- migration script나 대량 변환은 실행 전후 count를 기록한다.
- catalog 변환 Step은 spacing key inventory 없이 시작하지 않는다.
- default 값이 catalog에 새로 들어가면 해당 Step은 실패로 본다.

### Step 1. 현재 계약 변경 안정화

목표:

- 현재 dirty state의 `layoutId -> id`, table `pattern -> layout`, PageStack spacing alias 보존 변경을 안정화한다.

작업:

- `LayoutPatternCatalogEntry`의 `id` 계약을 유지한다.
- `data/tables`의 `pattern` 필드 제거 상태를 유지한다.
- PageStack 5개 area pattern의 spacing alias 보존 테스트를 정리한다.
- renderer 전체 legacy 테스트 실패와 새 target test 통과 범위를 분리한다.

검증:

- `npx tsc --noEmit --pretty false`
- `npx vitest run packages/layout-pattern-store/src/__tests__/schema.test.ts packages/layout-pattern-store/src/__tests__/pattern-store.test.ts`
- PageStack spacing preservation target test
- `rg '"pattern"\\s*:' data/tables` 결과 0
- `rg '"layoutId"' packages/layout-pattern-store/src/catalog` 결과 0

커밋 메시지 후보:

```text
Stabilize layout id table contract
```

자동 실행 stop condition:

- `data/tables`에 `pattern` 필드가 남아 있음
- catalog에 `layoutId` 필드가 남아 있음
- PageStack spacing preservation target test가 실패함
- unrelated dirty file이 staging 대상에 섞임

### Step 2. Catalog default 제거와 PageStack pattern component 분리

목표:

- catalog에서 runtime default를 제거한다.
- PageStack 계열 5개를 실제 개별 pattern component로 분리한다.

작업:

- `ListStackArea`
- `FieldStackArea`
- `CheckboxStackArea`
- `AccordionListArea`
- `MessageStackArea`
- 각 컴포넌트가 자기 default를 소유하게 한다.
- catalog `props.*.default`를 제거한다.
- catalog schema에서 새 component catalog entry의 prop default를 금지한다.
- resolver의 default prop 주입 로직을 제거한다.

검증:

- catalog schema test
- layout-pattern-store component registry test
- renderer PageStack render test
- spacing preservation test
- `rg '"default"' packages/layout-pattern-store/src/catalog/area-patterns.json`에서 변환 대상 5개 prop default 없음

커밋 메시지 후보:

```text
Move PageStack defaults into pattern components
```

자동 실행 stop condition:

- 변환 대상 5개 catalog entry의 props에 `default`가 남아 있음
- 5개 componentID 중 하나라도 registry에 없음
- `componentGap`, `titleGap` fallback 렌더 테스트가 실패함
- 하나의 component가 catalog default로 5개 변형을 계속 표현함

### Step 3. Catalog inventory 작성

목표:

- 전체 catalog 변환 범위와 수량을 먼저 고정한다.

작업:

- screen/region/area/composite catalog inventory 문서를 추가한다.
- 각 pattern의 legacy id, new id, componentID, spacing key, children contract, status를 기록한다.
- PageStack 5개는 `in progress` 또는 `converted` 상태로 표시한다.
- 남은 legacy pattern 수량을 target별로 요약한다.

산출물 후보:

- `docs/archive/completed-plans/LAYOUT_PATTERN_CATALOG_INVENTORY.md`

검증:

- inventory의 pattern 수와 catalog JSON의 pattern 수가 맞는지 스크립트 또는 수동 확인
- `rg '"layout"\\s*:' packages/layout-pattern-store/src/catalog` 결과와 legacy count 비교

커밋 메시지 후보:

```text
Document layout pattern catalog inventory
```

자동 실행 stop condition:

- inventory pattern count와 catalog JSON pattern count가 다름
- legacy spacing key가 있는 pattern인데 spacing keys column이 비어 있음
- converted/in-progress/pending 상태 기준이 문서에 없음

### Step 4. Table-to-RenderTree materializer 경계 결정

목표:

- table-to-RenderTree 순수 기능의 패키지 위치와 public API를 결정한다.

작업:

- `@cx/table-materializer`를 table-to-RenderTree materializer 패키지로 확정한다.
- 결정 이유와 두지 않는 책임을 문서에 기록한다.
- `PACKAGE_MAP.md`와 `PROJECT_STRUCTURE.md`에 새 경계를 반영한다.

검증:

- 문서 링크와 책임표가 서로 충돌하지 않는지 확인
- `@cx/renderer` 책임에 table projection이 남지 않는지 확인

커밋 메시지 후보:

```text
Define table materializer package boundary
```

자동 실행 stop condition:

- `@cx/renderer` 책임표에 table projection/materializer 책임이 남아 있음
- 새 materializer 경계의 두지 않는 책임이 문서에 없음
- `PACKAGE_MAP.md`와 redesign plan의 책임이 충돌함

### Step 5. Table materializer 스캐폴드

목표:

- table read model을 RenderTree로 바꾸는 순수 API 뼈대를 만든다.

작업:

- 새 패키지 또는 subpath를 생성한다.
- `materializeTableScreen`
- `materializeTableScreens`
- table 입력 타입과 RenderTree 출력 타입을 정의한다.
- 파일 IO 없이 plain object input만 받는다.
- web 내부 materializer 코드는 아직 이동하지 않고 public API와 테스트 fixture만 만든다.

검증:

- package public API test
- simple table fixture -> RenderTree fixture test
- `npx tsc --noEmit --pretty false`

커밋 메시지 후보:

```text
Scaffold pure table materializer
```

자동 실행 stop condition:

- materializer가 파일 IO를 수행함
- materializer가 React 또는 renderer component를 import함
- materializer가 pattern 선택이나 validation 판정을 수행함
- public API test가 없음

### Step 6. Web table materializer 이관

목표:

- web 내부 table-to-RenderTree 조립 로직을 materializer API 소비로 전환한다.

작업:

- `apps/web`의 table 조립 helper를 제거하거나 얇은 adapter로 축소한다.
- web은 table JSON을 읽고 materializer API를 호출한다.
- renderer는 RenderTree만 받는다.

검증:

- `npx tsc --noEmit --pretty false`
- web 관련 unit test 또는 smoke 확인
- 브라우저에서 기본 table screen preview 확인
- `rg 'materialize|table' apps/web/src`로 web 내부 조립 로직 잔존 여부 확인

커밋 메시지 후보:

```text
Move web table projection to materializer
```

자동 실행 stop condition:

- web 내부에 table relationship 조립 로직이 남아 있음
- renderer가 table JSON을 직접 import함
- 기본 preview가 RenderTree를 받지 않고 table record를 직접 렌더함

### Step 7. Region catalog component 전환

목표:

- `region-patterns.json`을 component catalog entry로 전환한다.
- region pattern component는 PageStack을 직접 쓰지 않는다.

작업:

- region inventory 기준으로 componentID를 확정한다.
- region 전용 wrapper components를 만든다.
- region padding, bottom safe area, sticky placement, width rail 값을 component default 또는 props fallback으로 보존한다.
- catalog에서 legacy `layout` shape를 제거한다.

검증:

- region catalog schema test
- renderer region layout render test
- spacing preservation test
- `rg '"layout"\\s*:' packages/layout-pattern-store/src/catalog/region-patterns.json` 결과 0

커밋 메시지 후보:

```text
Convert region patterns to components
```

자동 실행 stop condition:

- region component에서 PageStack을 import함
- `region-patterns.json`에 legacy `layout` shape가 남아 있음
- bottom/safe-area/sticky 관련 기존 값이 inventory나 test에 반영되지 않음

### Step 8. Screen catalog component 전환

목표:

- `screen-patterns.json`을 screen shell component 계약으로 전환한다.

작업:

- screen componentID를 확정한다.
- viewport, chrome slot, background, scroll boundary 값을 보존한다.
- screen pattern이 area/component layout 값을 직접 갖지 않도록 정리한다.

검증:

- screen catalog schema test
- renderer screen shell test
- `rg '"layout"\\s*:' packages/layout-pattern-store/src/catalog/screen-patterns.json` 결과 0

커밋 메시지 후보:

```text
Convert screen patterns to shell components
```

자동 실행 stop condition:

- screen pattern이 area/component layout prop을 직접 소유함
- `screen-patterns.json`에 legacy `layout` shape가 남아 있음
- AppScreen chrome 책임과 screen pattern 책임이 중복됨

### Step 9. Area collection catalog 전환

목표:

- collection/option/horizontal/grid/row 계열 area pattern을 component catalog entry로 전환한다.

작업:

- inventory 기준으로 collection pattern component를 만든다.
- `Grid`, `HStack`, `PageStack` 중 primitive를 선택한다.
- columns, rowGap, columnGap, controlGap, item width, scroll inset 값을 보존한다.

검증:

- area collection render tests
- spacing preservation tests
- 변환 대상 area pattern에 legacy `layout` shape 없음

커밋 메시지 후보:

```text
Convert collection area patterns
```

자동 실행 stop condition:

- columns/gap/scroll inset 중 기존 값이 누락됨
- renderer가 collection id를 문자열로 분기함
- 변환 대상에 legacy `layout` shape가 남아 있음

### Step 10. Area form/list/message catalog 전환

목표:

- form/agreement/accordion/message/list 계열 area pattern을 component catalog entry로 전환한다.

작업:

- divider placement, nested indent, row inset, error/help gap을 prop contract와 component default로 보존한다.
- 단순 gap으로 표현할 수 없는 값은 prop contract에 남긴다.

검증:

- form/list/message render tests
- spacing preservation tests
- 변환 대상 area pattern에 legacy `layout` shape 없음

커밋 메시지 후보:

```text
Convert form list area patterns
```

자동 실행 stop condition:

- divider/nested indent/row inset 값이 누락됨
- PageStack default가 catalog default로 표현됨
- 변환 대상에 legacy `layout` shape가 남아 있음

### Step 11. Composite catalog 전환

목표:

- `composite-patterns.json`을 leaf component wrapper component 계약으로 전환한다.

작업:

- composite pattern component를 만든다.
- height, minHeight, width, padding, align, media/icon gap 값을 보존한다.
- leaf component prop은 `@cx/components/catalog`에 맡긴다.

검증:

- composite render tests
- spacing preservation tests
- `rg '"layout"\\s*:' packages/layout-pattern-store/src/catalog/composite-patterns.json` 결과 0

커밋 메시지 후보:

```text
Convert composite patterns to wrappers
```

자동 실행 stop condition:

- composite pattern이 leaf component prop을 생성하거나 변경함
- height/minHeight/padding/media gap 값이 누락됨
- `composite-patterns.json`에 legacy `layout` shape가 남아 있음

### Step 12. Validation 강화

목표:

- 변환된 계약을 validation에서 강제한다.

작업:

- `area.* -> layout.area.*`
- `Screen.* -> layout.region.*`
- `component/composite -> layout.composite.*`
- screen/region PageStack 금지
- catalog prop default 금지
- unknown componentID 금지

검증:

- validation unit tests
- schema tests
- known bad fixture rejection tests

커밋 메시지 후보:

```text
Enforce layout target validation
```

자동 실행 stop condition:

- target/layout mismatch bad fixture가 통과함
- screen/region PageStack bad fixture가 통과함
- unknown componentID bad fixture가 통과함

### Step 13. Legacy normalization 제거

목표:

- old catalog shape와 old renderer compatibility path를 제거한다.

작업:

- `layout`, `layoutProps`, `match`, `variants` legacy normalization 제거
- old renderer compatibility tests 제거 또는 새 계약 테스트로 교체
- resolver가 componentID registry 기반으로만 동작하게 정리

검증:

- 전체 layout-pattern-store tests
- renderer tests
- validation tests
- `rg '"layout"\\s*:' packages/layout-pattern-store/src/catalog` 결과 0
- `rg '"default"' packages/layout-pattern-store/src/catalog` 결과 prop default 없음

커밋 메시지 후보:

```text
Remove legacy pattern normalization
```

자동 실행 stop condition:

- catalog schema가 legacy `layout`, `match`, `variants`를 계속 normalize함
- resolver가 componentID 없이 pattern을 렌더 가능하게 처리함
- catalog 전체에 legacy `layout` shape가 남아 있음

### Step 14. 문서와 패키지 맵 최종 정리

목표:

- 실제 구현 상태와 문서 책임 경계를 동기화한다.

작업:

- `PACKAGE_MAP.md`
- `PROJECT_STRUCTURE.md`
- `AGENTS.md`
- 필요 시 package README
- `AGENTS_HISTORY.md`

검증:

- 문서 간 책임 충돌 없음
- public surface 표가 실제 package exports와 일치

커밋 메시지 후보:

```text
Document final layout rendering boundaries
```

자동 실행 stop condition:

- `AGENTS.md`, `PACKAGE_MAP.md`, `PROJECT_STRUCTURE.md`의 renderer/materializer 책임 설명이 서로 다름
- public surface 표와 실제 package exports가 다름
- 최종 검증 체크리스트 결과가 history에 기록되지 않음

## 16. 자동 실행 결정

아래 결정은 자동 실행 기준으로 확정한다.

| 결정 | 선택지 | 확정 |
|---|---|---|
| table materializer 패키지명 | `@cx/table-materializer`, `@cx/materializer`, `@cx/parser/table` | `@cx/table-materializer` |
| catalog inventory 위치 | `docs/development/*`, package 내부 docs | `docs/archive/completed-plans/LAYOUT_PATTERN_CATALOG_INVENTORY.md` |
| componentID naming | `*Pattern` 접미사 포함/제외 | 접미사 제외 |
| catalog prop default 허용 | 허용/금지 | 금지 |
| 자동 커밋 push | 단계별 push/마지막 push | 마지막 push |

결정 이유:

- table materializer는 `@cx/table-materializer`로 둔다. table read model을 RenderTree로 바꾸는 책임이 이름에 직접 드러나고, Markdown parser인 `@cx/parser`와 혼동되지 않는다.
- 자동 실행은 단계별 commit까지만 수행하고 push는 사람이 최종 확인한 뒤 한 번 수행한다.
- Step 1, Step 2는 현재 dirty state를 안정화하는 단계이므로 자동 실행 시작 전에 unrelated dirty file이 없는지 먼저 확인한다.

## 17. 자동 실행 공통 검증 명령

모든 Step의 기본 검증은 아래 명령을 기준으로 한다. Step별 특수 검증은 각 Step의 검증 항목을 추가로 실행한다.

```sh
npx tsc --noEmit --pretty false
```

catalog 관련 Step:

```sh
npx vitest run packages/layout-pattern-store/src/__tests__/schema.test.ts packages/layout-pattern-store/src/__tests__/pattern-store.test.ts
```

renderer 관련 Step:

```sh
npx vitest run packages/renderer/src/__tests__/layout-pattern-render.test.tsx
```

table data 관련 Step:

```sh
rg '"pattern"\\s*:' data/tables
rg '"layoutId"' packages/layout-pattern-store/src/catalog
```

최종 검증:

```sh
npx tsc --noEmit --pretty false
npx vitest run packages/layout-pattern-store/src/__tests__/schema.test.ts packages/layout-pattern-store/src/__tests__/pattern-store.test.ts
rg '"pattern"\\s*:' data/tables
rg '"layoutId"' packages/layout-pattern-store/src/catalog
rg '"layout"\\s*:' packages/layout-pattern-store/src/catalog
```
