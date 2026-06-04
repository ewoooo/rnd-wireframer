# App Shell 리팩터 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/web/src/components/workbench/AppShell.tsx`(789줄) god component를 3개 도메인 훅으로 분해하고 인프라 코드(API 클라이언트·localStorage)를 `lib/`로 추출하되, 앱 동작은 100% 보존한다.

**Architecture:** 도메인별 커스텀 훅(`useScreenWorkbench`/`useNewScreenInference`/`usePuckEditing`) + 얇은 컨테이너. `activeTab`은 AppShell이 소유해 순환을 끊고, Puck 편집 훅은 스크린 훅의 출력을 읽기만 한다(단방향 의존).

**Tech Stack:** React 19, Next 16, TypeScript, Vitest + @testing-library/react, Biome, zustand(미사용 유지).

**검증 도구 (모든 태스크 공통):**
- 통합 회귀 테스트: `bunx vitest run apps/web/src/components/App.test.tsx`
- 단위 테스트 전체: `bun test`
- 타입체크: `bunx tsc --noEmit -p apps/web/tsconfig.json`
- 훅 정책 린트: `node scripts/check-react-hooks-policy.mjs apps packages`

**리팩터 성격:** 순수 구조 이동. 새 동작·새 기능 없음. 각 태스크는 "기존 그린 확인 → 코드 이동 → 그린 재확인 → 커밋" 패턴이다. 새 테스트는 추출된 순수 함수(localStorage)에만 추가한다.

**선행 작업:** `main`에서 작업 중이면 먼저 브랜치를 판다.

```bash
git checkout -b refactor/app-shell-hooks
```

설계 문서: `docs/superpowers/specs/2026-06-04-app-shell-refactor-design.md`

---

## Task 0: 베이스라인 그린 확인

리팩터 전 안전망이 통과하는지 먼저 확인한다. 통과하지 않으면 이후 단계의 "회귀 없음" 판정이 무의미하다.

**Files:** (변경 없음)

- [ ] **Step 1: 통합 테스트 실행**

Run: `bunx vitest run apps/web/src/components/App.test.tsx`
Expected: PASS (모든 it 통과)

- [ ] **Step 2: 타입체크 실행**

Run: `bunx tsc --noEmit -p apps/web/tsconfig.json`
Expected: 에러 0

- [ ] **Step 3: 전체 단위 테스트 실행**

Run: `bun test`
Expected: PASS

베이스라인이 그린이 아니면 여기서 중단하고 보고한다.

---

## Task 1: API 클라이언트 추출

`AppShell.tsx` 558–682줄의 fetch 래퍼 9개를 두 개의 `lib/` 모듈로 이동한다. AppShell은 import만 교체한다. 동작 변화 없음.

**Files:**
- Create: `apps/web/src/lib/screens-client.ts`
- Create: `apps/web/src/lib/screen-inference-client.ts`
- Modify: `apps/web/src/components/workbench/AppShell.tsx` (import 교체, 함수 삭제)

**이동 매핑:**

`screens-client.ts` 로 이동:
- `fetchScreensFromApi` (568–591) — `ScreensApiResponse`, `ScreenTreeApiResponse` 타입 동반
- `fetchPuckCatalogItemsFromApi` (558–566) — `PuckCatalogApiResponse`, `PuckCatalogScope` 타입 동반

`screen-inference-client.ts` 로 이동:
- `uploadScreenInferenceSource` (593–609) — `ScreenInferenceSourceUploadResponse` 동반
- `fetchScreenInferenceSources` (611–620) — `ScreenInferenceSourceListResponse` 동반
- `createScreenInferenceRunFromSource` (622–645)
- `fetchScreenInferenceRunStatus` (647–656)
- `fetchScreenInferenceArtifact` (658–671)
- `applyScreenInferenceRun` (673–682)

> `readErrorMessage`(684–686)는 여러 훅이 공유하므로 이번 태스크에서는 옮기지 않는다. Task 3에서 `lib/`로 정리한다(아래 주: 임시로 AppShell에 유지).

- [ ] **Step 1: `screens-client.ts` 생성**

`AppShell.tsx`의 `fetchScreensFromApi`, `fetchPuckCatalogItemsFromApi` 함수 본문과 그들이 쓰는 타입(`ScreensApiResponse`, `ScreenTreeApiResponse`, `PuckCatalogApiResponse`, `PuckCatalogScope`)을 그대로 옮긴다. 함수에 `export`를 붙인다. import는 원본과 동일하게:

```ts
import type { PuckCatalogItem } from "@cx/adapters/puck";
import type { RenderTreeScreenNode } from "@cx/renderer";
import type { ScreenSummary } from "@/lib/screen-sources";

export type PuckCatalogScope = "area" | "screen-region";
// ...원본 타입 4개...
export async function fetchScreensFromApi(): Promise<ScreenSummary[]> { /* 원본 그대로 */ }
export async function fetchPuckCatalogItemsFromApi(scope: PuckCatalogScope): Promise<PuckCatalogItem[]> { /* 원본 그대로 */ }
```

- [ ] **Step 2: `screen-inference-client.ts` 생성**

`AppShell.tsx`의 inference fetch 함수 6개와 응답 타입(`ScreenInferenceSourceUploadResponse`, `ScreenInferenceSourceListResponse`)을 옮기고 `export`를 붙인다. import:

```ts
import type { RenderTree, RenderTreeScreenNode } from "@cx/renderer";
import type { QualityInspectionContract, ValidationReportContract } from "@cx/schema";
import type {
  ScreenInferenceRunCreateResponse,
  ScreenInferenceRunResponse,
  ScreenInferenceRunStatus,
} from "@/lib/screen-inference-run";
import type { NewScreenSourceItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";
```

- [ ] **Step 3: `AppShell.tsx`에서 함수 삭제 + import 추가**

558–682줄의 9개 함수와 그들 전용 타입 정의(`ScreensApiResponse`, `ScreenTreeApiResponse`, `PuckCatalogApiResponse`, `ScreenInferenceSourceUploadResponse`, `ScreenInferenceSourceListResponse`)를 삭제한다. `PuckCatalogScope`는 AppShell의 state 타입(`puckCatalogItemsByScope`)에도 쓰이므로 `screens-client.ts`에서 import한다. 상단에 추가:

```ts
import {
  fetchPuckCatalogItemsFromApi,
  fetchScreensFromApi,
  type PuckCatalogScope,
} from "@/lib/screens-client";
import {
  applyScreenInferenceRun,
  createScreenInferenceRunFromSource,
  fetchScreenInferenceArtifact,
  fetchScreenInferenceRunStatus,
  fetchScreenInferenceSources,
  uploadScreenInferenceSource,
} from "@/lib/screen-inference-client";
```

- [ ] **Step 4: 타입체크**

Run: `bunx tsc --noEmit -p apps/web/tsconfig.json`
Expected: 에러 0 (미사용 import나 중복 타입이 없어야 함)

- [ ] **Step 5: 통합 테스트**

Run: `bunx vitest run apps/web/src/components/App.test.tsx`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/lib/screens-client.ts apps/web/src/lib/screen-inference-client.ts apps/web/src/components/workbench/AppShell.tsx
git commit -m "refactor(app-shell): extract API clients to lib"
```

---

## Task 2: localStorage 영속화 추출

`AppShell.tsx` 688–762줄의 localStorage 영속화 + 타입가드를 `lib/`로 옮기고, 순수 함수이므로 단위 테스트를 추가한다.

**Files:**
- Create: `apps/web/src/lib/new-screen-workbench-storage.ts`
- Create: `apps/web/src/lib/new-screen-workbench-storage.test.ts`
- Modify: `apps/web/src/components/workbench/AppShell.tsx`

**이동 매핑:**
- `NEW_SCREEN_WORKBENCH_STORAGE_KEY`, `NEW_SCREEN_SOURCE_IMPORT_ID` 상수 (41–42)
- `mergeNewScreenSources` (688–704)
- `readNewScreenWorkbenchState` (706–731)
- `writeNewScreenWorkbenchState` (733–746)
- `isNewScreenSourceItem` (748–758)
- `isWebUploadedNewScreenSource` (760–762)

- [ ] **Step 1: `new-screen-workbench-storage.ts` 생성**

위 6개 심볼을 그대로 옮기고 `export`를 붙인다. import:

```ts
import type { NewScreenSourceItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";

export const NEW_SCREEN_WORKBENCH_STORAGE_KEY = "cx.new-screen.workbench.v0.1";
export const NEW_SCREEN_SOURCE_IMPORT_ID = "web-upload";
// mergeNewScreenSources, readNewScreenWorkbenchState, writeNewScreenWorkbenchState,
// isNewScreenSourceItem, isWebUploadedNewScreenSource — 전부 export
```

- [ ] **Step 2: 단위 테스트 작성 (failing)**

`new-screen-workbench-storage.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import {
  mergeNewScreenSources,
  readNewScreenWorkbenchState,
  writeNewScreenWorkbenchState,
} from "@/lib/new-screen-workbench-storage";
import type { NewScreenSourceItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";

const baseSource: NewScreenSourceItem = {
  batchId: "b1",
  importId: "web-upload",
  path: "a.md",
  screenId: "S-1",
};

afterEach(() => window.localStorage.clear());

describe("new-screen-workbench-storage", () => {
  it("round-trips selectedSourcePath and sources through localStorage", () => {
    writeNewScreenWorkbenchState({ selectedSourcePath: "a.md", sources: [baseSource] });
    const state = readNewScreenWorkbenchState();
    expect(state.selectedSourcePath).toBe("a.md");
    expect(state.sources).toHaveLength(1);
    expect(state.sources[0].path).toBe("a.md");
  });

  it("drops non-web-upload sources on read", () => {
    const foreign = { ...baseSource, importId: "cli", path: "b.md" };
    window.localStorage.setItem(
      "cx.new-screen.workbench.v0.1",
      JSON.stringify({ selectedSourcePath: "b.md", sources: [foreign] }),
    );
    expect(readNewScreenWorkbenchState().sources).toHaveLength(0);
  });

  it("prefers latestRunId from current when server source lacks it", () => {
    const current = [{ ...baseSource, latestRunId: "run-1" }];
    const server = [{ ...baseSource }];
    const merged = mergeNewScreenSources(current, server);
    expect(merged[0].latestRunId).toBe("run-1");
  });
});
```

- [ ] **Step 3: 테스트 실행 (fail 확인)**

Run: `bunx vitest run apps/web/src/lib/new-screen-workbench-storage.test.ts`
Expected: AppShell에서 아직 함수를 삭제하지 않았다면 PASS. (이 태스크는 추출+검증이므로, Step 1에서 새 모듈이 생성되면 곧장 통과한다. fail이 필요 없는 순수 이동 — import 경로가 새 모듈을 가리키므로 PASS가 정상.)
Expected: PASS

- [ ] **Step 4: `AppShell.tsx`에서 삭제 + import**

41–42줄 상수와 688–762줄 6개 함수를 삭제한다. 상단에 추가:

```ts
import {
  mergeNewScreenSources,
  NEW_SCREEN_SOURCE_IMPORT_ID,
  readNewScreenWorkbenchState,
  writeNewScreenWorkbenchState,
} from "@/lib/new-screen-workbench-storage";
```

> `NEW_SCREEN_SOURCE_IMPORT_ID`는 AppShell의 `uploadScreenInferenceSource` 호출부에서 직접 쓰이지 않는다(현재 "web-upload" 리터럴이 client로 이동). AppShell에 남은 사용처가 없으면 import하지 않는다. `isNewScreenSourceItem`/`isWebUploadedNewScreenSource`도 AppShell에 직접 사용처가 없으면 import 제외 — Step 5 타입체크로 미사용 import를 잡는다.

- [ ] **Step 5: 타입체크 + 전체 테스트**

Run: `bunx tsc --noEmit -p apps/web/tsconfig.json`
Expected: 에러 0
Run: `bun test`
Expected: PASS (신규 storage 테스트 포함)

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/lib/new-screen-workbench-storage.ts apps/web/src/lib/new-screen-workbench-storage.test.ts apps/web/src/components/workbench/AppShell.tsx
git commit -m "refactor(app-shell): extract new-screen workbench storage to lib"
```

---

## Task 3: `useNewScreenInference` 훅 추출 (도메인 B)

가장 독립적인 도메인이라 먼저 추출한다. new-screen source/run/artifact/apply의 state·effect·handler 전부를 훅으로 옮긴다.

**Files:**
- Create: `apps/web/src/model/workbench/use-new-screen-inference.ts`
- Modify: `apps/web/src/components/workbench/AppShell.tsx`

**훅으로 이동할 state (AppShell 80–101 중):**
`newScreenSourceError`, `newScreenSources`, `newScreenPreviewNode`, `newScreenQuality`, `newScreenRunStatus`, `newScreenValidation`, `isUploadingNewScreenSource`, `isStartingNewScreenRun`, `selectedNewScreenSourcePath`. 그리고 파생값 `selectedNewScreenSource`(161–163), `selectedNewScreenRunId`(164).

**이동할 effect:** 192–212(loadUploadedSources), 239–244(persist), 246–275(pollRunStatus), 277–307(loadReviewArtifacts).

**이동할 handler:** `handleSelectNewScreenSource`(336–348), `handleUploadNewScreenSource`(350–365), `handleRunSelectedNewScreenSource`(367–389), `handleRerunSelectedNewScreenSource`(391–416), `handleApplyNewScreenRun`(418–431).

**훅 시그니처:**

```ts
import type { NavigatorTab } from "@/model/workbench-view-model";
import type { SaveState } from "@/components/workbench/canvas/CanvasToolbar";

export function useNewScreenInference(
  activeTab: NavigatorTab,
  setSaveState: (state: SaveState) => void,
) {
  // ...state 9개, effect 4개, handler 5개...
  return {
    sources: newScreenSources,
    selectedSourcePath: selectedNewScreenSourcePath,
    error: newScreenSourceError,
    runStatus: newScreenRunStatus,
    previewNode: newScreenPreviewNode,
    validation: newScreenValidation,
    quality: newScreenQuality,
    isUploading: isUploadingNewScreenSource,
    isStarting: isStartingNewScreenRun,
    onSelectSource: handleSelectNewScreenSource,
    onUpload: handleUploadNewScreenSource,
    onRun: handleRunSelectedNewScreenSource,
    onRerun: handleRerunSelectedNewScreenSource,
    onApply: handleApplyNewScreenRun,
  };
}
```

**필요 import (훅 파일):** `useEffect`, `useState` from react; client 함수 6개 from `@/lib/screen-inference-client`; `mergeNewScreenSources`, `readNewScreenWorkbenchState`, `writeNewScreenWorkbenchState` from `@/lib/new-screen-workbench-storage`; `readErrorMessage`(아래 Step 1에서 이 훅 파일로 이동); `readScreenNodeFromRenderTreeArtifact`·`isRenderTreeScreenNode`(764–775, 이 훅 전용이므로 함께 이동); 타입 import(`NewScreenSourceItem`, `RenderTree`, `RenderTreeScreenNode`, `QualityInspectionContract`, `ValidationReportContract`, `ScreenInferenceRunStatus`); 상수 `TERMINAL_SCREEN_INFERENCE_STATUSES`(76, 이 훅 전용이므로 이동).

- [ ] **Step 1: `use-new-screen-inference.ts` 생성**

위 state/effect/handler를 훅 본문으로 옮긴다. `initialNewScreenWorkbenchState`는 훅 내부에서 `readNewScreenWorkbenchState()`로 계산한다(현재 AppShell 79줄과 동일). `readErrorMessage`, `readScreenNodeFromRenderTreeArtifact`, `isRenderTreeScreenNode`, `TERMINAL_SCREEN_INFERENCE_STATUSES`를 이 파일로 옮긴다(이후 Task 4·5에서 `readErrorMessage`가 또 필요하면 그때 `lib/api-error.ts` 등으로 승격 — 지금은 훅 내부 유지로 충분).

> `readErrorMessage`는 Task 4(useScreenWorkbench)에서도 쓰인다. 중복을 피하려면 이 Step에서 `lib/api-error.ts`에 이미 있는지 확인한다(`lib/api-error.ts` 존재). 거기에 `readErrorMessage`가 없으면 추가하고 양쪽 훅에서 import한다.

- [ ] **Step 2: 확인 — `lib/api-error.ts`에 `readErrorMessage` 배치**

Run: `grep -n "readErrorMessage\|export" apps/web/src/lib/api-error.ts`
`readErrorMessage`가 없으면 추가:

```ts
export function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "화면 데이터를 불러오지 못했습니다.";
}
```

훅 파일은 `import { readErrorMessage } from "@/lib/api-error";`로 사용한다.

- [ ] **Step 3: `AppShell.tsx`에서 도메인 B 코드 삭제 + 훅 호출**

해당 state 9개, effect 4개, handler 5개, 파생값 2개, 헬퍼 4개, 상수 1개를 삭제한다. AppShell 본문에 추가:

```ts
const newScreen = useNewScreenInference(activeTab, setSaveState);
```

JSX(471–519)에서 new-screen 관련 props를 `newScreen.*`로 교체한다:
- `NavigationRoutes`: `newScreenSourceError={newScreen.error}`, `newScreenSources={newScreen.sources}`, `onRerunSelectedNewScreenSource={newScreen.onRerun}`, `onRunSelectedNewScreenSource={newScreen.onRun}`, `onUploadNewScreenSource={newScreen.onUpload}`, `onSelectNewScreenSource={newScreen.onSelectSource}`, `selectedNewScreenSourcePath={newScreen.selectedSourcePath}`, `isUploadingNewScreenSource={newScreen.isUploading || newScreen.isStarting}`
- `Canvas`: `onApplyNewScreenRun={newScreen.onApply}`, `newScreenPreviewNode={newScreen.previewNode}`, `newScreenRunStatus={newScreen.runStatus}`
- `EditSidebar`: `newScreenReview`의 `quality={newScreen.quality}`, `status={newScreen.runStatus}`, `validation={newScreen.validation}`

> `handleApplyNewScreenRun`은 현재 `setSaveState`를 호출한다(420, 426, 429). 훅이 주입받은 `setSaveState`로 동일하게 호출한다.

- [ ] **Step 4: 훅 정책 린트**

Run: `node scripts/check-react-hooks-policy.mjs apps packages`
Expected: 위반 0

- [ ] **Step 5: 타입체크 + 통합 테스트**

Run: `bunx tsc --noEmit -p apps/web/tsconfig.json`
Expected: 에러 0
Run: `bunx vitest run apps/web/src/components/App.test.tsx`
Expected: PASS (특히 업로드→Run→running 흐름 it이 통과해야 함)

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/model/workbench/use-new-screen-inference.ts apps/web/src/lib/api-error.ts apps/web/src/components/workbench/AppShell.tsx
git commit -m "refactor(app-shell): extract useNewScreenInference hook"
```

---

## Task 4: `useScreenWorkbench` 훅 추출 (도메인 A)

스크린 로딩·선택·파생상태·저장을 훅으로 옮긴다.

**Files:**
- Create: `apps/web/src/model/workbench/use-screen-workbench.ts`
- Modify: `apps/web/src/components/workbench/AppShell.tsx`

**훅으로 이동할 state:** `screens`, `loadState`, `saveState`, `selectedAreaId`, `selectedComponentId`, `screenCandidates`, `selectedScreenId`, `activeRouteId`.

**이동할 파생상태 (109–160):** `initialScreen`, `screenModules`/`screenRoutes`(createWorkbenchViewModel), `selectedScreen`, `selectedScreenCandidate`, `visibleScreen`, `navigationScreens`, `visibleAreas`, `selectedAreaEntry`, `selectedArea`, `visibleAreaItems`, `visibleComponents`, `selectedComponentEntry`, `selectedComponent`, `visibleComponentItems`, `activeRoute`.

**이동할 effect:** 166–190(loadScreens).

**이동할 handler:** `handleSelectRoute`(309–314), `handleSelectScreen`(316–320), `handleSelectArea`(322–327), `handleSelectComponent`(329–334), `handleScreenCandidateChange`(433–438), `handleScreenCandidatePublish`(440–458), `handleSaveSelectedScreen`(460–463).

**훅 시그니처:**

```ts
export function useScreenWorkbench(activeTab: NavigatorTab) {
  // activeTab은 현재 도메인 A 로직에서 직접 쓰이지 않지만,
  // 파생상태가 selectedArea/Component에 의존하고 그것이 향후 tab과 묶일 수 있어
  // 시그니처에 받아둔다. 사용처가 전혀 없으면 인자를 생략하고 호출부도 맞춘다.
  return {
    loadState, screens, screenRoutes, screenModules,
    selectedScreenId, activeRouteId,
    visibleScreen, navigationScreens,
    visibleAreaItems, selectedArea, visibleComponentItems, selectedComponent,
    saveState, setSaveState,
    onSelectRoute: handleSelectRoute,
    onSelectScreen: handleSelectScreen,
    onSelectArea: handleSelectArea,
    onSelectComponent: handleSelectComponent,
    onScreenCandidateChange: handleScreenCandidateChange,
    onScreenCandidatePublish: handleScreenCandidatePublish,
    onSaveSelectedScreen: handleSaveSelectedScreen,
  };
}
```

> **순환 주의:** `setSaveState`는 Task 3에서 `useNewScreenInference`에 주입된다. 따라서 AppShell에서 호출 순서는 `const screen = useScreenWorkbench(activeTab);` → `const newScreen = useNewScreenInference(activeTab, screen.setSaveState);` 가 되어야 한다(screen 먼저).

**필요 import:** `useEffect`, `useState`, `useMemo` from react; `createWorkbenchViewModel`, `collectWorkbenchAreas`, `collectWorkbenchComponents`, `getInitialScreen`, `toNavigationNodeItems`, `NavigatorTab` from `@/model/workbench-view-model`; `fetchScreensFromApi` from `@/lib/screens-client`; `readErrorMessage` from `@/lib/api-error`; 타입(`ScreenSummary`, `RenderTreeScreenNode`, `SaveState`).

- [ ] **Step 1: `use-screen-workbench.ts` 생성**

state·파생상태·effect·handler를 훅으로 옮긴다. 파생상태 블록은 매 렌더 재계산되던 것이므로, "명백한 개선"으로 다음을 `useMemo`로 감싼다(의존성 배열 명시):
- `{ screenModules, screenRoutes } = useMemo(() => createWorkbenchViewModel(screens), [screens])`
- `navigationScreens = useMemo(..., [screens, screenCandidates])`
- `visibleAreas = useMemo(() => collectWorkbenchAreas(navigationScreens), [navigationScreens])`
- `visibleComponents = useMemo(() => collectWorkbenchComponents(navigationScreens), [navigationScreens])`

나머지 단순 `find`/조건 파생값은 메모 없이 그대로 둔다(과최적화 회피).

`handleScreenCandidatePublish`는 `setSaveState`를 호출하므로 훅 내부 `setSaveState`를 그대로 쓴다.

- [ ] **Step 2: `AppShell.tsx`에서 도메인 A 코드 삭제 + 훅 호출**

해당 state·파생상태·effect·handler를 삭제하고 본문 최상단(activeTab 선언 직후)에 추가:

```ts
const [activeTab, setActiveTab] = useState<NavigatorTab>("scn");
const screen = useScreenWorkbench(activeTab);
const newScreen = useNewScreenInference(activeTab, screen.setSaveState);
```

JSX에서 스크린 관련 props를 `screen.*`로 교체:
- `NavigationRoutes`: `activeRouteId={screen.activeRoute?.id}`→ 반환에 `activeRoute` 추가하거나 `activeRouteId`만 노출. **활성 라우트 객체가 필요하므로 훅 반환에 `activeRoute`를 포함한다.** `areas={screen.visibleAreaItems}`, `components={screen.visibleComponentItems}`, `onSelectArea={screen.onSelectArea}`, `onSelectComponent={screen.onSelectComponent}`, `onSelectRoute={screen.onSelectRoute}`, `onSelectScreen={screen.onSelectScreen}`, `screenModules={screen.screenModules}`, `screenRoute={screen.activeRoute}`, `selectedAreaId={screen.selectedArea?.metadata.id}`, `selectedComponentId={screen.selectedComponent?.metadata.id}`, `selectedScreenId={screen.visibleScreen?.id}`
- `Canvas`: `loadState={screen.loadState}`, `onSaveSelectedScreen={screen.onSaveSelectedScreen}`, `saveState={screen.saveState}`, `selectedScreen={screen.visibleScreen}`

> 위 props 목록에서 `activeRoute`가 필요하므로 Step 1의 훅 반환에 `activeRoute`를 반드시 포함시킨다(시그니처 보강).

- [ ] **Step 3: 훅 정책 린트**

Run: `node scripts/check-react-hooks-policy.mjs apps packages`
Expected: 위반 0

- [ ] **Step 4: 타입체크 + 통합 테스트**

Run: `bunx tsc --noEmit -p apps/web/tsconfig.json`
Expected: 에러 0
Run: `bunx vitest run apps/web/src/components/App.test.tsx`
Expected: PASS (탭 전환·컴포넌트/영역 선택·저장 흐름 통과)

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/model/workbench/use-screen-workbench.ts apps/web/src/components/workbench/AppShell.tsx
git commit -m "refactor(app-shell): extract useScreenWorkbench hook"
```

---

## Task 5: `usePuckEditing` 훅 추출 (도메인 C)

Puck 편집 scope·catalog·변경 핸들러를 훅으로 옮긴다. 도메인 A의 출력을 입력으로 받는다(단방향).

**Files:**
- Create: `apps/web/src/model/workbench/use-puck-editing.ts`
- Modify: `apps/web/src/components/workbench/AppShell.tsx`

**훅으로 이동할 state:** `puckCatalogItemsByScope`.

**이동할 파생상태 (140–153):** `editScope`(resolveEditScope), `isEditingWithPuck`, `puckCatalogScope`(readPuckCatalogScope), `catalogItems`.

**이동할 effect:** 214–237(loadPuckCatalogItems).

**이동할 handler/헬퍼:** `handlePuckChange`(526–535), `readEditScopeKey`(777–782), `readPuckCatalogScope`(784–789).

**훅 시그니처:**

```ts
export function usePuckEditing(input: {
  activeTab: NavigatorTab;
  visibleScreen?: ScreenSummary;
  selectedArea?: RenderTreeNode;
  selectedComponent?: RenderTreeNode;
  onScreenCandidateChange: (screenId: string, node: RenderTreeScreenNode) => void;
}) {
  // editScope = resolveEditScope({ activeTab, selectedArea, selectedComponent, selectedScreen: visibleScreen?.renderTree })
  // ...catalog effect, handlePuckChange...
  return {
    editScope,
    isEditingWithPuck,    // isPuckEditTab(activeTab) && !!editScope
    catalogItems,
    buildPuckConfig: () => buildPuckConfigForScope(editScope!, catalogItems),
    buildPuckData: () => buildPuckDataForScope(editScope!),
    editScopeKey: editScope ? readEditScopeKey(editScope) : "none",
    handlePuckChange,
  };
}
```

**필요 import:** `useEffect`, `useState` from react; `resolveEditScope`, `isPuckEditTab` from `@/model/puck-edit-scope`; `buildPuckConfigForScope` from `@/components/puck/workbench/workbench-puck`; `applyPuckChangeToScope`, `buildPuckDataForScope`, `normalizePuckData`, `readItemKindForScope`, `resolveCatalogItemsForScope` from `@/lib/workbench-puck/puck-scope`; `fetchPuckCatalogItemsFromApi`, `PuckCatalogScope` from `@/lib/screens-client`; 타입.

- [ ] **Step 1: `use-puck-editing.ts` 생성**

위 항목을 옮긴다. `handlePuckChange`는 현재 `editScope`/`visibleScreen` 가드 후 `applyPuckChangeToScope`를 호출하고 `handleScreenCandidateChange(visibleScreen.id, nextScreen)`를 부른다. 훅에서는 주입받은 `onScreenCandidateChange(input.visibleScreen.id, nextScreen)`로 교체한다. catalog effect의 의존성(`puckCatalogScope`, `puckCatalogItemsByScope`)을 유지한다.

- [ ] **Step 2: `AppShell.tsx`에서 도메인 C 코드 삭제 + 훅 호출 + Puck 렌더 정리**

해당 state·파생상태·effect·handler·헬퍼를 삭제한다. 호출부:

```ts
const puck = usePuckEditing({
  activeTab,
  visibleScreen: screen.visibleScreen,
  selectedArea: screen.selectedArea,
  selectedComponent: screen.selectedComponent,
  onScreenCandidateChange: screen.onScreenCandidateChange,
});
```

`EditSidebar`의 `scope={editScope}` → `scope={puck.editScope}`.

최종 return부(524–555):

```tsx
if (!puck.isEditingWithPuck || !puck.editScope || !screen.visibleScreen) return workbenchLayout;

return (
  <Puck
    key={`${screen.visibleScreen.id}:${activeTab}:${puck.editScope.kind}:${puck.editScopeKey}`}
    config={puck.buildPuckConfig()}
    data={puck.buildPuckData() as Data}
    headerTitle={screen.visibleScreen.title}
    iframe={{ enabled: false }}
    onChange={puck.handlePuckChange}
    permissions={{ delete: true, drag: true, duplicate: false, edit: true, insert: true }}
  >
    {workbenchLayout}
  </Puck>
);
```

> `handlePuckChange`의 인자 타입(`Data`)과 내부 `normalizePuckData` 호출은 훅 내부로 이동했으므로 AppShell에는 `Data` import만 남으면 된다(Puck `data` 캐스팅용). 미사용 import는 Step 3 타입체크로 잡는다.

- [ ] **Step 3: 훅 정책 린트 + 타입체크**

Run: `node scripts/check-react-hooks-policy.mjs apps packages`
Expected: 위반 0
Run: `bunx tsc --noEmit -p apps/web/tsconfig.json`
Expected: 에러 0

- [ ] **Step 4: 통합 테스트**

Run: `bunx vitest run apps/web/src/components/App.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/model/workbench/use-puck-editing.ts apps/web/src/components/workbench/AppShell.tsx
git commit -m "refactor(app-shell): extract usePuckEditing hook"
```

---

## Task 6: AppShell 최종 정리 및 검증

남은 와이어링을 점검하고 AppShell이 목표 형태(약 130줄, 훅 조립 + JSX)인지 확인한다.

**Files:**
- Modify: `apps/web/src/components/workbench/AppShell.tsx`

- [ ] **Step 1: 잔여 죽은 코드/미사용 import 제거**

`AppShell.tsx`를 읽고 다음을 확인·제거한다:
- 세 훅으로 옮겨간 뒤 남은 미사용 import(예: `useEffect`, `useState`는 `activeТ ab`/조립용만 남아야 함)
- 남은 헬퍼 함수가 없는지(전부 훅/lib로 이동했어야 함)
- `ASIDE_WIDTH` 상수는 JSX에서 쓰이므로 유지

Run: `grep -n "^function \|^async function \|^const.*=.*=>" apps/web/src/components/workbench/AppShell.tsx`
Expected: 파일 레벨 함수는 `AppShell`만 남아야 한다(헬퍼 전부 이동 완료).

- [ ] **Step 2: 라인 수 확인**

Run: `wc -l apps/web/src/components/workbench/AppShell.tsx`
Expected: 약 120–150줄 (789줄에서 대폭 감소)

- [ ] **Step 3: 전체 검증 스위트**

Run: `bunx tsc --noEmit -p apps/web/tsconfig.json`
Expected: 에러 0
Run: `node scripts/check-react-hooks-policy.mjs apps packages`
Expected: 위반 0
Run: `bun test`
Expected: PASS (전체)
Run: `bunx biome lint apps/web/src/components/workbench apps/web/src/model/workbench apps/web/src/lib`
Expected: 에러 0

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/components/workbench/AppShell.tsx
git commit -m "refactor(app-shell): tidy container after hook extraction"
```

---

## 완료 기준 (Definition of Done)

- `AppShell.tsx`가 약 130줄, 파일 레벨 함수는 `AppShell` 하나.
- `model/workbench/` 아래 훅 3개, `lib/` 아래 client 2개 + storage 1개 생성.
- `App.test.tsx` 통합 테스트와 전체 `bun test` 그린.
- 타입체크·훅 정책 린트·biome 린트 그린.
- 동작 변화 없음(API 시퀀스·폴링 주기 1500ms·localStorage 키 동일).

## 자체 검토 메모 (spec 대비 커버리지)

- 설계의 파일 구조 6개 산출물 → Task 1(client 2), Task 2(storage 1), Task 3·4·5(훅 3)로 전부 커버.
- 단방향 의존(activeTab 컨테이너 소유, C가 A 읽기만) → Task 4 호출 순서 주석 + Task 5 입력 주입으로 보장.
- saveState A 소유 + B 주입 → Task 3 시그니처 + Task 4 setSaveState 노출로 일치.
- useMemo는 "명백한 개선" 범위로 Task 4 Step 1에 한정(과최적화 회피).
- 함수명 일관성: `onScreenCandidateChange`(A 반환) = `usePuckEditing` 입력명 일치 확인.
