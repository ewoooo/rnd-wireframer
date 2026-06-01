# Web Component Restructure Plan

## 1. 목적

현재 `apps/web/src/components/App.tsx`에 집중된 workbench UI 책임을 분리한다.

원격 `origin/main`의 web 구조는 `App.tsx`를 앱 shell로 얇게 유지하고 navigation, canvas, inspection, screen card, state model을 별도 책임으로 나누고 있다. 이 계획은 그 구조적 장점을 현재 재설계 브랜치의 패키지 경계에 맞게 이식하기 위한 작업 순서와 완료 기준을 정의한다.

## 2. 적용 원칙

- 현재 브랜치의 `ScreenSummary` 입력 흐름과 `@cx/table-materializer` 기반 RenderTree materialize 흐름을 유지한다.
- 원격 `origin/main`의 DB loader, Supabase action, legacy package 의존성은 그대로 복원하지 않는다.
- `@cx/renderer`는 RenderTree JSON을 React로 렌더링하는 책임만 가진다는 현재 패키지 경계를 유지한다.
- React 코드에 신규 `useMemo`와 `useCallback`을 추가하지 않는다.
- 문자열 literal 기반 hardcoded `switch`/`if`-chain 매핑을 늘리지 않는다.
- 수급 원본 JSON, mock 입력 JSON, 생성 결과물을 파괴적으로 수정하지 않는다.

## 3. 목표 구조

```text
apps/web/src/
  components/
    App.tsx
    layout/
      NavigationRail.tsx
      NavigationPanel.tsx
      Canvas.tsx
      InspectionPanel.tsx
    screen/
      RenderedScreen.tsx
      ScreenVariantCard.tsx
  model/
    workbench-view-model.ts
```

선택적으로 상태가 커지면 `workbench-view-model.ts`를 `workbench-store.ts`로 확장한다. 1차 재구성에서는 현재 preview 기능을 유지하는 것을 우선한다.

## 4. 작업 순서

### 4.1 기준 확인

1. 현재 `App.tsx`의 책임을 분류한다.
   - 앱 shell/layout
   - navigation rail
   - route/module grouping
   - screen variant list
   - canvas preview
   - inspection panel
   - selected area/component traversal helper

2. `origin/main`에서 가져올 구조와 제외할 구조를 확정한다.
   - 가져올 것: layout component 분리 방식, screen variant card 분리 방식, state/view model 집중 방식
   - 제외할 것: DB mutation action, Supabase loader, agent registry 실행 흐름, legacy 타입 의존성

3. 현재 유지해야 할 데이터 계약을 확인한다.
   - `apps/web/src/lib/screen-sources.ts`의 `ScreenSummary`
   - `ScreenSummary.renderTree`
   - `@cx/table-materializer` 산출 RenderTree
   - `RenderedScreen` 입력 계약

### 4.2 View Model 분리

1. `apps/web/src/model/workbench-view-model.ts`를 추가한다.

2. 다음 타입을 `App.tsx`에서 이동한다.
   - `NavigatorTab`
   - `ScreenRouteGroup`
   - `ScreenModuleGroup`
   - `ScreenVariantGroup`
   - `ScreenVariantOption`

3. 다음 helper를 이동한다.
   - `buildScreenRouteGroups`
   - `buildScreenModuleGroups`
   - `getModuleName`
   - `getModuleSortOrder`
   - `compareScreenOptions`
   - `getInitialScreen`
   - `getScreenOptionLabel`
   - `collectNodesByTypePrefix`
   - `collectLeafComponents`

4. View model public surface를 최소화한다.
   - `createWorkbenchViewModel(screens)`
   - `getInitialScreen(screens)`
   - `collectScreenAreas(screen)`
   - `collectScreenComponents(screen)`

5. 동일 키 도메인 매핑은 기존 상수 테이블로 유지한다.
   - `moduleNamesById`
   - `moduleSortOrderById`

### 4.3 Navigation Rail 분리

1. `apps/web/src/components/layout/NavigationRail.tsx`를 추가한다.

2. `primaryNavigationTabs`, `secondaryNavigationTabs`, `NavigationButton`을 이동한다.

3. `NavigationRail` props를 단순하게 유지한다.

```ts
type NavigationRailProps = {
  activeTab: NavigatorTab;
  onSelectTab: (tab: NavigatorTab) => void;
};
```

4. 검증한다.
   - `SCN`, `ARE`, `CMP`, `AGT` 탭 클릭이 기존과 동일하게 동작한다.
   - `aria-label`, `aria-pressed`, `title` 정보가 유지된다.

### 4.4 Screen Variant Card 분리

1. `apps/web/src/components/screen/ScreenVariantCard.tsx`를 추가한다.

2. 기존 `ScreenVariantCard`를 이동한다.

3. chip label 계산은 `workbench-view-model.ts`의 helper를 사용하거나 card 내부의 좁은 helper로 둔다.

4. 검증한다.
   - 선택된 variant row highlight가 유지된다.
   - option chip 클릭 시 해당 screen이 선택된다.
   - chip 클릭이 row 선택 이벤트와 충돌하지 않는다.

### 4.5 Navigation Panel 분리

1. `apps/web/src/components/layout/NavigationPanel.tsx`를 추가한다.

2. 기존 `NavigationPanel`, `ScreenModuleGroupView`를 이동한다.

3. `NavigationPanel` props를 명시한다.

```ts
type NavigationPanelProps = {
  activeTab: NavigatorTab;
  activeRouteId?: string;
  onSelectRoute: (routeId: string) => void;
  onSelectScreen: (screenId: string) => void;
  screenModules: ScreenModuleGroup[];
  screenRoute?: ScreenRouteGroup;
  selectedScreenId?: string;
};
```

4. 비활성 탭 placeholder는 현재 문구를 유지하되, 데이터 연결 책임을 이 컴포넌트에 추가하지 않는다.

5. 검증한다.
   - route 선택 시 첫 variant option screen이 선택된다.
   - selected screen이 바뀌면 active route가 동기화된다.
   - module/route/variant 목록이 기존 순서로 표시된다.

### 4.6 Canvas 분리

1. `apps/web/src/components/layout/Canvas.tsx`를 추가한다.

2. 중앙 header와 preview 영역을 이동한다.

3. `Canvas` props를 단순하게 유지한다.

```ts
type CanvasProps = {
  selectedScreen?: ScreenSummary;
};
```

4. 검증한다.
   - 선택된 screen title이 header에 표시된다.
   - `RenderedScreen`이 기존과 동일한 node를 렌더링한다.
   - 선택된 screen이 없을 때 안전한 empty 상태가 유지된다.

### 4.7 Inspection Panel 분리

1. `apps/web/src/components/layout/InspectionPanel.tsx`를 추가한다.

2. 기존 `InspectionPanel`, `InfoRow`, `StatCard`, `NodeList`를 이동한다.

3. `InspectionPanel` props를 명시한다.

```ts
type InspectionPanelProps = {
  activeTab: NavigatorTab;
  areas: RenderTreeNode[];
  components: RenderTreeNode[];
  screen?: ScreenSummary;
};
```

4. 검증한다.
   - selected screen 정보가 표시된다.
   - area count와 component count가 기존과 동일하다.
   - `CMP` 탭에서는 component list가 표시된다.
   - 그 외 탭에서는 area list가 표시된다.

### 4.8 App Shell 정리

1. `App.tsx`에서 분리된 컴포넌트를 import한다.

2. `App.tsx`에는 다음 책임만 남긴다.
   - `screens` 입력 수신
   - selected tab/screen/route state
   - view model 생성 호출
   - layout component 조립

3. `App.tsx` 목표 분량은 80줄 이하로 한다. 꼭 필요한 경우에도 120줄을 넘기지 않는다.

4. 검증한다.
   - `App.tsx`에 route grouping 구현이 남아 있지 않다.
   - `App.tsx`에 RenderTree traversal 구현이 남아 있지 않다.
   - `App.tsx`에 panel 내부 JSX가 남아 있지 않다.

### 4.9 검증

1. 정적 검증을 실행한다.
   - repo 표준 typecheck 명령
   - repo 표준 test 명령
   - React hooks policy check가 별도로 있으면 실행

2. web smoke test를 실행한다.
   - 첫 화면 렌더
   - route 선택
   - variant chip 선택
   - `SCN`, `ARE`, `CMP`, `AGT` 탭 전환
   - inspection panel count 확인

3. 실패 시 책임 분리 범위 안에서 수정한다. 데이터 계약이나 패키지 경계를 바꾸는 수정은 별도 결정으로 분리한다.

### 4.10 문서와 이력 반영

1. 변경 완료 후 `AGENTS_HISTORY.md`에 기록한다.

2. 실제 구조가 `PROJECT_STRUCTURE.md`의 web 설명과 달라지면 해당 문서를 갱신한다.

3. 계획 문서와 실제 결과가 달라진 경우 이 문서의 상태 또는 후속 항목을 갱신한다.

## 5. 완료 기준

### 5.1 구조 기준

- `App.tsx`가 앱 shell 역할만 한다.
- route/module/variant grouping 로직이 `App.tsx`에서 제거된다.
- area/component traversal 로직이 `App.tsx`에서 제거된다.
- navigation rail, navigation panel, canvas, inspection panel, screen variant card가 별도 파일로 분리된다.
- view model 또는 store 파일이 UI 파생 데이터 생성을 담당한다.

### 5.2 동작 기준

- 첫 화면에서 기본 screen preview가 렌더링된다.
- 좌측 rail에서 `SCN`, `ARE`, `CMP`, `AGT` 탭 전환이 가능하다.
- `SCN` 탭에서 module/route 목록과 variant 목록이 표시된다.
- route 선택 시 해당 route의 첫 screen option이 선택된다.
- variant option 선택 시 중앙 preview가 해당 screen으로 갱신된다.
- 우측 panel에 selected screen 정보가 표시된다.
- 우측 panel의 area count와 component count가 기존과 동일하다.
- `CMP` 탭에서는 component 목록이, `ARE` 탭에서는 area 목록이 표시된다.
- 연결되지 않은 탭은 안전한 placeholder 또는 empty state를 표시한다.

### 5.3 계약 기준

- `ScreenSummary` 입력 계약을 유지한다.
- `@cx/table-materializer` 기반 RenderTree materialize 흐름을 유지한다.
- `@cx/renderer`에 table projection 또는 materializer 책임을 다시 넣지 않는다.
- 원격 `origin/main`의 DB loader, Supabase action, legacy package 의존성을 무리하게 복원하지 않는다.
- 원본 JSON과 mock 입력 JSON을 수정하지 않는다.

### 5.4 코드 정책 기준

- 신규 `useMemo`와 `useCallback`을 추가하지 않는다.
- 같은 키 도메인을 분기하는 hardcoded `switch` 또는 반복 `if` chain을 추가하지 않는다.
- 필요한 매핑은 계약 테이블 또는 기존 상수 테이블로 유지한다.
- 새 helper는 UI 컴포넌트 내부에 누적하지 않고 view model 또는 좁은 책임 파일로 이동한다.
- 변경 범위는 web component restructure에 한정한다.

### 5.5 검증 기준

- repo 표준 typecheck가 통과한다.
- 관련 unit test 또는 전체 test가 통과한다.
- web smoke test에서 첫 화면, route 선택, variant 선택, tab 전환, inspection count가 확인된다.
- 검증하지 못한 항목이 있으면 최종 작업 기록에 명시한다.

### 5.6 문서 기준

- 구현 완료 후 `AGENTS_HISTORY.md`에 변경 이력이 기록된다.
- 구조 문서와 실제 구조가 충돌하면 관련 development 문서가 갱신된다.
- 이 계획에서 제외한 DB/action/agent 기능은 후속 작업으로 분리된다.

## 6. 비완료 조건

- `App.tsx`에 grouping, traversal, panel JSX가 계속 집중되어 있다.
- 원격 `origin/main`의 DB/action 코드를 그대로 가져와 현재 재설계 흐름을 깨뜨린다.
- UI는 분리됐지만 route 선택, variant 선택, preview, inspection 정보 중 하나가 회귀한다.
- typecheck 또는 smoke test 없이 완료로 처리한다.
- 문서 또는 이력 기록 없이 구조 변경만 수행한다.

## 7. 후속 후보

- `AGT` 탭의 placeholder를 현재 `@cx/agent` 문서 자산 기반 inspection으로 연결한다.
- `ARE`와 `CMP` 탭의 목록 UI를 별도 컴포넌트로 추가 분리한다.
- preview smoke test를 Playwright 또는 Browser 기반 자동 검증으로 고정한다.
- web workbench state가 커지면 `workbench-view-model.ts`를 작은 store로 전환한다.
