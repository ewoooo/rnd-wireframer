# Divider Prop Restore Plan

## 1. 목적

레이아웃 패턴 전환 과정에서 old pattern-store의 `divider` 의미가 실제 렌더 결과에서 사라졌다.

이 문서는 divider를 다시 살리되, catalog default나 renderer fallback으로 되돌리지 않고 현재 설계 원칙에 맞게 실제 layout pattern component가 prop/default를 소유하도록 구현하는 계획을 정의한다.

## 2. 현재 확인 결과

원격 `origin/main` 기준:

- table record 자체에는 `divider`가 직접 저장돼 있지 않았다.
- `database/tables/areas.json`의 area `props`는 비어 있었고, `pattern`만 참조했다.
- `database/tables/components.json`에도 `Divider` component row가 직접 들어있지 않았다.
- divider 의미는 old `packages/pattern-store/src/catalog/*-patterns.json`의 layout 계약에 있었다.

원격 main에서 divider가 있던 위치:

| layer  | old location                 | examples                                                                                    |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------- |
| region | `layout.childWrap.divider`   | 최신 3영역 고정 계약에서는 제거. Header/Contents/Bottom region rail은 구조만 담당한다.      |
| area   | `layout.layoutProps.divider` | `product-disclosure-accordion`, `price-accordion-stack-area`, `pagestack-info-text-section` |

현재 local 기준:

- `@cx/layout-pattern-store` catalog에는 `divider` prop contract가 남아 있다.
- `packages/layout-pattern-store/src/components/registry.ts`도 divider prop을 허용한다.
- 하지만 실제 구현인 `RegionStack.tsx`, `GeneralArea.tsx`, `PageStackArea.tsx`, `PageStack.tsx`가 divider를 소비하지 않는다.
- 따라서 renderer나 table materializer 문제가 아니라 pattern component 구현 누락이다.

## 3. 설계 방향

Divider 렌더 책임은 `@cx/layout-pattern-store`의 실제 pattern component가 가진다.

```text
RenderTree node props
-> @cx/renderer interpreter
-> @cx/layout-pattern-store registered layout component
-> divider prop/default 해석
-> children 사이에 @cx/components Divider 삽입
```

금지할 방향:

- renderer가 layout id를 보고 divider를 추측하지 않는다.
- table materializer가 divider component node를 임의로 삽입하지 않는다.
- catalog JSON에 runtime default를 다시 넣지 않는다.
- old `layout.layoutProps` normalization을 되살리지 않는다.

허용할 방향:

- pattern component default에 old divider 의미를 복원한다.
- RenderTree에서 `props.divider`가 오면 component default보다 우선한다.
- divider가 없는 pattern은 현재처럼 children만 렌더한다.
- divider 삽입은 React children 조합 helper로만 처리한다.

## 3-1. 실제 적용 방식

적용은 "원격 main의 old catalog 의미를 현재 component default로 이식"하는 방식으로 한다.

핵심은 다음과 같다.

1. old main에서 divider가 있던 pattern 목록을 기준표로 고정한다.
2. 현재 `layout.*` component 중 같은 의미를 가진 component에 divider default를 둔다.
3. RenderTree node의 `props.divider`가 있으면 default보다 우선한다.
4. 실제 DOM에는 pattern component가 children 사이 또는 `divider: true` trailing 위치에 `@cx/components`의 `Divider`를 삽입한다.
5. renderer와 table materializer는 변경하지 않는다.

구현 흐름:

Region divider 복구는 최신 3영역 고정 계약과 충돌하므로 적용하지 않는다. 세부 section/list divider는 Contents region이 아니라 area pattern에서 소유한다.

```text
layout.area.priceAccordionStackArea
-> PriceAccordionStackArea default divider = "between-accordion-rows"
-> GeneralArea maps it to Divider(contents)
-> PageStack contents renders accordion row 사이에 contents divider
```

이 방식은 old `layout.childWrap.divider`와 `layout.layoutProps.divider`를 다시 catalog data에 넣는 것이 아니라, 현재 설계대로 "실제 컴포넌트가 기본 레이아웃 동작을 소유"하게 만든다.

## 4. Divider 계약

### Region divider

최신 계약에서는 region을 `Screen.Header`, `Screen.Contents`, `Screen.Bottom` 세 rail로만 고정하고, region layout id도 `layout.region.header`, `layout.region.contents`, `layout.region.bottom`만 사용한다.

따라서 region divider는 복원하지 않는다. old `childWrap.divider` 의미는 해당 화면 흐름을 표현하는 area pattern으로 이전한다.

### Area divider

Area 계열은 old `layoutProps.divider` string을 복원한다.

```ts
type AreaDividerProp =
  | boolean
  | "contents"
  | "section"
  | "between-accordion-rows"
  | "between-info-text-rows";
```

초기 매핑:

| value                    | Divider type | insertion            |
| ------------------------ | ------------ | -------------------- |
| `true`                   | `contents`   | 각 child 뒤 trailing |
| `contents`               | `contents`   | children 사이        |
| `between-accordion-rows` | `contents`   | children 사이        |
| `between-info-text-rows` | `contents`   | children 사이        |
| `section`                | `section`    | children 사이        |

## 5. 구현 단계

### Step 1. Divider helper 추가

파일 후보:

- `packages/layout-pattern-store/src/components/shared/divider.tsx`

역할:

- `@cx/components`의 `Divider`를 import한다.
- `children`을 `Children.toArray(children)`로 안정화한다.
- divider가 없거나 child가 0~1개면 원본 children을 반환한다.
- divider가 있으면 child 사이에 `<Divider type="..." />`를 삽입한다.
- key는 `divider-${index}`처럼 deterministic하게 만든다.

완료 기준:

- helper 단위 테스트에서 child 3개가 `child/divider/child/divider/child` 순서로 나온다.
- divider type `contents`, `section`이 각각 유지된다.

### Step 2. RegionStack default 복구

파일:

- `packages/layout-pattern-store/src/components/region/RegionStack.tsx`

변경:

- `RegionStackDefaults`에 `divider`를 추가한다.
- old region pattern의 divider default를 실제 component default로 옮긴다.
- `props.divider`가 있으면 우선하고, 없으면 default divider를 사용한다.
- `createRegionStack` render에서 `{children}` 대신 `withDividers(children, divider)`를 사용한다.

기본값 복구 대상:

| component                                 | default divider                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `SectionStackRegion`                      | `{ type: "section" }`                                                  |
| `CommerceDetailContentStackRegion`        | `{ type: "section" }`                                                  |
| `SubscriptionDetailRichContentRegion`     | `{ type: "section" }`                                                  |
| `BenefitBrandDetailContentRegion`         | `{ type: "section" }`                                                  |
| `DeviceDetailOptionContentRegion`         | `{ type: "section" }`                                                  |
| `SummaryTextListContentRegion`            | `{ type: "section", between: ["summary", "list-section"] }`            |
| `SummaryTitleFilterTextListContentRegion` | `{ type: "section", between: ["summary", "filterable-list-section"] }` |
| `ProductCardSectionedListContentRegion`   | `{ type: "section", between: ["product-list-groups"] }`                |

완료 기준:

- 해당 region component에서 children 사이 section divider가 렌더된다.
- `PlainStackRegion`, flat list region, bottom action region에는 divider가 들어가지 않는다.

### Step 3. Area PageStack default 복구

파일:

- `packages/layout-pattern-store/src/components/area/GeneralArea.tsx`

변경:

- `StackAreaDefaults`에 `divider`를 추가한다.
- divider가 필요한 old area pattern의 default를 실제 component default로 둔다.
- `createPageStackArea`에서 PageStack children에 divider helper를 적용한다.

기본값 복구 대상:

| component                        | old pattern                    | default divider          |
| -------------------------------- | ------------------------------ | ------------------------ |
| `ProductDisclosureAccordionArea` | `product-disclosure-accordion` | `contents`               |
| `PriceAccordionStackArea`        | `price-accordion-stack-area`   | `between-accordion-rows` |
| `DeliveryInfoAccordionArea`      | `delivery-info-accordion-area` | `between-accordion-rows` |
| `NoticeAccordionStackArea`       | `notice-accordion-stack-area`  | `between-accordion-rows` |
| `PagestackInfoTextSectionArea`   | `pagestack-info-text-section`  | `between-info-text-rows` |
| `TextListGroupArea`              | `text-list-group-area`         | `between-info-text-rows` |
| `PlainInfoTextListArea`          | `plain-info-text-list-area`    | `between-info-text-rows` |
| `AccordionNoticeListArea`        | `accordion-notice-list-area`   | `between-accordion-rows` |

완료 기준:

- area component에서 해당 default divider가 children 사이에 렌더된다.
- `ListStackArea`, `FieldStackArea`, `CheckboxStackArea`, `MessageStackArea` 등 일반 PageStack 계열에는 divider가 들어가지 않는다.

### Step 4. RenderTree prop override 보장

대상:

- region/area component의 `props.divider`

원칙:

- RenderTree node가 `props.divider`를 제공하면 default보다 우선한다.
- `props.divider: true`는 table에서 명시하는 trailing contents divider로 해석한다.
- `props.divider: false` 또는 `null` 같은 명시 disable이 필요할지 결정한다.

초기 결정:

- `false`는 divider disable로 해석한다.
- `true`는 각 child 뒤에 contents divider를 붙이는 trailing divider로 해석한다.
- `undefined`는 default 사용으로 해석한다.

완료 기준:

- 테스트에서 default divider pattern에 `props.divider: false`를 넣으면 divider가 렌더되지 않는다.
- 테스트에서 `props.divider: true`를 넣으면 trailing contents divider가 렌더된다.
- 테스트에서 `props.divider: "section"`을 넣으면 section divider가 렌더된다.

### Step 5. 테스트 추가

테스트 후보:

- `packages/layout-pattern-store/src/__tests__/components.test.tsx`
- `packages/renderer/src/__tests__/layout-pattern-render.test.tsx`

필수 케이스:

- region default divider 렌더
- area default divider 렌더
- `props.divider` override
- `props.divider: false` disable
- divider 없는 pattern은 기존 children count 유지

권장 검증:

```bash
npx vitest run packages/layout-pattern-store/src/__tests__/components.test.tsx packages/renderer/src/__tests__/layout-pattern-render.test.tsx
npx tsc --noEmit --pretty false
npx vitest run
```

## 6. 예상 사이드이펙트

| risk                                                  | impact                     | mitigation                                                                      |
| ----------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| divider가 너무 많은 위치에 들어감                     | 화면 밀도와 높이 증가      | default 복구 대상을 old main divider 보유 pattern으로 제한                      |
| `gap`과 divider가 동시에 적용돼 간격이 커짐           | Figma 대비 레이아웃 벌어짐 | old divider pattern 대부분 `gap: 0`; gap 있는 pattern은 screenshot smoke로 확인 |
| `between` 의미가 부정확하게 적용됨                    | divider 위치 오류          | 초기 구현에서 `between`은 보존만 하고 all-between insertion만 수행              |
| renderer 책임으로 오해됨                              | interpreter 순수성 훼손    | renderer는 변경하지 않고 pattern component test로 고정                          |
| table materializer가 divider를 생성해야 한다고 오해됨 | read model 오염            | table materializer는 변경하지 않음                                              |

## 7. 커밋 단위

### Commit 1. Add divider render helper

- shared divider helper 추가
- helper/component test 추가

### Commit 2. Restore region divider defaults

- `RegionStack.tsx` default divider 복구
- region 렌더 테스트 추가

### Commit 3. Restore area divider defaults

- `GeneralArea.tsx` area divider default 복구
- area 렌더 테스트 추가

### Commit 4. Document divider ownership

- `PROJECT_STRUCTURE.md` 또는 package README에 divider ownership 한 줄 추가
- `AGENTS_HISTORY.md`에 결정 기록

## 8. 완료 기준

- old main에서 divider 의미가 있던 region/area pattern은 현재 렌더에서도 divider를 표시한다.
- divider가 없던 pattern에는 새 divider가 생기지 않는다.
- renderer는 divider 삽입 로직을 소유하지 않는다.
- table materializer는 divider component node를 생성하지 않는다.
- `npx tsc --noEmit --pretty false`와 관련 vitest가 통과한다.

## 9. 성공 기준

### 기능 성공 기준

- old main에서 divider 의미가 있던 모든 region/area pattern에 divider가 복구된다.
- `props.divider`가 없을 때는 component default가 적용된다.
- `props.divider: false`를 주면 default divider도 꺼진다.
- `props.divider: true`를 주면 table 명시값으로 trailing contents divider가 렌더된다.
- `props.divider: "section"` 또는 `{ type: "section" }`을 주면 section divider가 렌더된다.
- `props.divider: "contents"` 또는 accordion/info-row divider 값은 contents divider로 렌더된다.
- child가 0개 또는 1개인 경우 divider가 생기지 않는다.

### 구조 성공 기준

- `@cx/renderer`에는 divider 관련 조건문이 추가되지 않는다.
- `@cx/table-materializer`는 divider component node를 생성하지 않는다.
- `@cx/layout-pattern-store`의 component layer에만 divider 삽입 책임이 생긴다.
- catalog JSON에는 runtime default가 다시 생기지 않는다.
- validation/catalog prop contract는 divider prop을 허용하는 현재 방향을 유지한다.

### 회귀 성공 기준

- divider가 없던 pattern의 snapshot 또는 DOM child count가 변하지 않는다.
- 기존 PageStack padding, gap, section padding 값이 유지된다.
- `npx tsc --noEmit --pretty false`가 통과한다.
- 관련 layout-pattern-store/renderer 테스트가 통과한다.
- 전체 `npx vitest run`이 통과한다.

## 10. 예상 화면 품질 변화

### 개선 전

현재 화면은 레이아웃 패턴 전환 후 divider가 빠지면서 다음 문제가 생긴다.

- 상품 상세 contents에서 section 간 경계가 약해진다.
- accordion row가 연속 텍스트 덩어리처럼 보여 스캔성이 떨어진다.
- 정보 리스트에서 행 구분이 사라져 Figma의 list rhythm과 다르게 보인다.
- PageStack padding은 남아 있지만 divider가 없어 섹션 구조가 덜 명확하다.
- 특히 `gap: 0`인 accordion/list 계열은 divider가 빠지면 항목 사이의 구분 수단이 거의 없어진다.

### 개선 후

복구 후 기대 화면 품질:

- 상세 화면의 큰 섹션 사이에는 4px section divider가 돌아온다.
- accordion row, info text row 사이에는 1px contents divider가 돌아온다.
- 사용자는 hero, 상품 정보, 고시, footer legal 같은 영역 구분을 더 빠르게 읽을 수 있다.
- Figma 원본의 "PageStack 안에서 행/섹션을 divider로 자르는 리듬"에 가까워진다.
- padding/gap은 기존 component default를 유지하므로, divider만 복구되고 전체 레이아웃 체계는 흔들리지 않는다.

품질 판단 기준:

| 화면 요소                | 기대 품질                                            |
| ------------------------ | ---------------------------------------------------- |
| 상품 상세 contents       | section divider로 큰 정보 묶음이 분명히 나뉨         |
| 가격/배송/고시 accordion | row 사이가 1px divider로 구분되어 반복 구조가 명확함 |
| 정보 텍스트 리스트       | 행 단위 scan이 쉬워짐                                |
| CTA/bottom action        | divider 추가 없음, 기존 고정 하단 밀도 유지          |
| plain/flat list          | divider 추가 없음, 의도하지 않은 시각 잡음 없음      |

## 11. 리스크와 대응

| 리스크                                                           | 화면 영향                                            | 발생 가능성 | 대응                                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------- | ----------: | ----------------------------------------------------------------------------------------------- |
| divider가 모든 children 사이에 들어가 과해 보임                  | 화면 높이 증가, 섹션이 잘게 쪼개져 보임              |        중간 | old main에서 divider가 있던 pattern에만 default 적용                                            |
| region divider가 area 사이에 들어가고 area 내부 divider도 들어감 | 이중 divider처럼 보일 수 있음                        |        중간 | section divider는 region, contents divider는 area로 구분하고 테스트 화면에서 중첩 여부 확인     |
| `between` 조건을 무시해 원래보다 divider가 넓게 들어감           | 특정 subtype에서 divider 위치가 Figma와 다를 수 있음 |        중간 | 초기에는 `between`을 보존만 하고, slot metadata가 안정화되면 selective insertion으로 확장       |
| gap과 divider가 동시에 적용됨                                    | divider 주변 여백이 커져 화면이 늘어짐               |        낮음 | 대상 old pattern 대부분 `gap: 0`; gap 있는 pattern만 smoke로 확인                               |
| Divider component import로 package dependency가 커짐             | layout-pattern-store가 components에 의존             |        낮음 | 이미 pattern component는 렌더 자산이므로 leaf visual primitive 사용을 허용한다는 문서 결정 추가 |
| `props.divider: false` 처리 누락                                 | 특정 화면에서 divider를 끌 수 없음                   |        낮음 | override/disable 테스트를 필수 케이스로 추가                                                    |
| renderer 테스트가 divider DOM 증가로 실패                        | 기존 snapshot/DOM count 변경                         |        중간 | divider 대상 pattern test만 expectation 갱신, divider 없는 pattern은 unchanged test 추가        |

## 12. 구현 우선순위

1. Area accordion/list divider 복구를 먼저 한다.
   - 화면 품질 체감이 가장 크다.
   - `gap: 0` 계열이라 divider 누락이 가장 눈에 띈다.
2. Region section divider를 복구한다.
   - 상품 상세 contents의 큰 구조를 회복한다.
   - section divider는 높이가 4px라 화면 높이 변화가 있으므로 별도 확인한다.
3. override/disable을 붙인다.
   - 후속 화면별 예외 대응을 가능하게 한다.
4. 문서와 테스트로 책임 경계를 고정한다.
   - renderer/table 쪽으로 책임이 번지지 않게 막는다.
