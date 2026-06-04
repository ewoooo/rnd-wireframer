# App Shell 리팩터 설계

- 작성일: 2026-06-04
- 대상: `apps/web/src/components/workbench/AppShell.tsx` (789줄)
- 목표: 단일 god component를 도메인별 커스텀 훅으로 분해하고, 인프라 코드(API 클라이언트·localStorage)를 `lib/`로 추출한다.

## 배경 / 문제

`AppShell.tsx`는 워크벤치 전체를 떠받치는 단일 클라이언트 컴포넌트다. UI 트리는 이미 자식 컴포넌트(`Canvas`, `NavigationRoutes`, `EditSidebar` 등)로 잘 분리되어 있으나, **상태·로직 계층이 한 함수에 평탄하게 펼쳐져 있다.** 즉 "뷰는 분리됐으나 컨트롤러가 분리되지 않은" 상태다.

현재 `AppShell.tsx` 내부 구성:

| 구간 | 줄 | 내용 | 분류 |
|---|---|---|---|
| State 선언 | 80–164 | useState 20개 + 파생상태 약 15개 (메모 없음) | 혼합 |
| Effects | 166–307 | useEffect 5개 (스크린로드/소스로드/카탈로그/persist/폴링/아티팩트) | 혼합 |
| Handlers | 309–463 | 선택·업로드·실행·적용·저장 핸들러 13개 | 혼합 |
| Layout JSX | 465–555 | Sidebar+Nav+Canvas+EditSidebar, Puck 래핑 | 뷰 |
| API 클라이언트 | 558–682 | fetch 래퍼 9개 | 인프라 (잘못된 위치) |
| localStorage | 706–746 | new-screen 상태 persist read/write | 인프라 (잘못된 위치) |
| 타입가드/헬퍼 | 684–789 | merge/isXxx/readXxx 8개 | 유틸 |

세 개의 독립 도메인이 한 함수에 엉켜 있다:

| 도메인 | 관련 state | 관련 effect/handler |
|---|---|---|
| **A. Screen 워크벤치** | screens, loadState, selectedScreenId, screenCandidates, saveState | loadScreens, handleSelect*, handleSave*, handleScreenCandidate* |
| **B. New-screen 추론** (가장 큼) | newScreenSources, RunStatus, PreviewNode, Quality, Validation, isUploading/isStarting | loadUploadedSources, pollRunStatus, loadReviewArtifacts, handleUpload/Run/Rerun/Apply |
| **C. Puck 편집** | activeTab, selected{Area,Component}Id, puckCatalogItemsByScope | loadPuckCatalogItems, handlePuckChange |

## 설계 결정 (확정)

1. **분해 메커니즘**: 도메인별 커스텀 훅. (zustand 스토어/Context+Reducer 대신 — 외부 의존 없고 React 관용 패턴이며 독립 테스트 가능.)
2. **리팩터 성격**: 순수 구조 이동 + 명백한 개선만. 동작은 100% 보존하고, 훅화 과정에서 자연스럽게 생기는 `useMemo` 정도만 적용한다. 동작을 바꾸는 정리는 범위 밖.
3. **훅 입도**: A안 — 3개 도메인 훅 + 얇은 컨테이너. (6~8개 잘게 쪼개기는 과분해, 단일 마스터 훅은 god 모듈이 그대로 이동할 뿐이라 둘 다 기각.)
4. **`saveState`**: 도메인 A가 소유하고 도메인 B에 setter를 주입. (별도 `useSaveState` 분리는 YAGNI.)
   - ⚠️ 정정: 본 설계 초안의 "파생상태 useMemo 적용" 제안은 무효다. 프로젝트가 `useMemo`/`useCallback`을 lint 정책으로 금지하므로 파생상태는 plain const로 둔다.
5. **`activeTab`**: AppShell이 직접 소유(useState 하나). 세 훅 모두의 입력이라 어느 한 훅에 넣으면 순환이 생긴다.
6. **훅 위치**: `model/workbench/`. 기존 `model/workbench-view-model.ts`, `model/puck-edit-scope.ts`와 같은 계층(도메인 로직)이며 훅은 그것들을 소비하는 상위 계층이다.

## 최종 파일 구조

```
apps/web/src/
├─ components/workbench/
│  └─ AppShell.tsx                     # 789 → 약 130줄 (훅 조립 + JSX만)
├─ model/workbench/                    # 도메인 훅 (상태 + 로직)
│  ├─ use-screen-workbench.ts          # 도메인 A
│  ├─ use-new-screen-inference.ts      # 도메인 B
│  └─ use-puck-editing.ts              # 도메인 C
└─ lib/
   ├─ screens-client.ts                # fetchScreensFromApi, puck-catalog, tree PUT
   ├─ screen-inference-client.ts       # upload/list/run/status/artifact/apply fetch 9개
   └─ new-screen-workbench-storage.ts  # localStorage read/write + 타입가드
```

## 각 훅의 인터페이스

```ts
// 도메인 A — 스크린 로딩·선택·편집·저장
function useScreenWorkbench(activeTab: NavigatorTab): {
  loadState; screens; screenRoutes; screenModules;
  selectedScreenId; activeRouteId;
  visibleScreen; navigationScreens;
  visibleAreaItems; selectedArea; visibleComponentItems; selectedComponent;
  saveState; setSaveState;
  onSelectRoute; onSelectScreen; onSelectArea; onSelectComponent;
  onScreenCandidateChange; onScreenCandidatePublish; onSaveSelectedScreen;
}

// 도메인 B — 새 화면 추론 (가장 독립적)
function useNewScreenInference(
  activeTab: NavigatorTab,
  setSaveState: (state: SaveState) => void,
): {
  sources; selectedSourcePath; error;
  runStatus; previewNode; validation; quality;
  isUploading; isStarting;
  onSelectSource; onUpload; onRun; onRerun; onApply;
}

// 도메인 C — Puck 편집 (A의 출력에 의존)
function usePuckEditing(input: {
  activeTab: NavigatorTab;
  visibleScreen?: ScreenSummary;
  selectedArea?: RenderTreeNode;
  selectedComponent?: RenderTreeNode;
  onScreenCandidateChange: (screenId: string, node: RenderTreeScreenNode) => void;
}): {
  editScope; isEditingWithPuck; catalogItems;
  buildPuckConfig; buildPuckData; handlePuckChange;
}
```

> 위 반환 형태는 설계 의도를 보이기 위한 스케치다. 정확한 타입은 구현 단계에서 기존 코드의 타입을 그대로 따른다.

## 훅 간 와이어링 (교차 의존 해결)

현재 코드의 까다로운 점은 `editScope` 계산이 세 입력에 걸쳐 있다는 것이다(`activeTab` + 도메인 A의 `selectedArea`/`selectedComponent`/`visibleScreen`). 의존을 단방향으로 고정한다:

```
activeTab (AppShell 소유, useState 하나)
   │
   ├─→ useScreenWorkbench(activeTab) ─→ visibleScreen, selectedArea, selectedComponent, setSaveState
   │                                          │
   ├──────────────────────────────────────────┤  (A의 출력을 C에 주입)
   │                                          ▼
   └─→ usePuckEditing({ activeTab, ...A의 출력, onScreenCandidateChange })
   │
   └─→ useNewScreenInference(activeTab, setSaveState)   (A·C와 독립, saveState만 공유)
```

- 도메인 C는 도메인 A의 출력만 **읽고** A를 수정하지 않는다 → 단방향 유지. `handlePuckChange`는 A의 `onScreenCandidateChange`를 콜백으로 받아 호출한다.
- 도메인 B는 A·C와 독립적이며, 저장 표시줄(`saveState`)만 공유한다. A가 소유한 `setSaveState`를 주입받아 `onApply` 시 갱신한다.

## AppShell 최종 모양 (약 130줄)

```tsx
export function AppShell() {
  const [activeTab, setActiveTab] = useState<NavigatorTab>("scn");
  const screen    = useScreenWorkbench(activeTab);
  const puck      = usePuckEditing({
    activeTab,
    visibleScreen: screen.visibleScreen,
    selectedArea: screen.selectedArea,
    selectedComponent: screen.selectedComponent,
    onScreenCandidateChange: screen.onScreenCandidateChange,
  });
  const newScreen = useNewScreenInference(activeTab, screen.setSaveState);

  const workbenchLayout = (
    /* JSX: NavigationSidebar / NavigationRoutes / Canvas / EditSidebar
       — props를 세 훅의 반환값에서 전달 */
  );

  if (!puck.isEditingWithPuck || !puck.editScope || !screen.visibleScreen) {
    return workbenchLayout;
  }
  return <Puck {...puck.puckProps}>{workbenchLayout}</Puck>;
}
```

## 마이그레이션 순서

각 단계는 독립 커밋 단위이며, 단계마다 앱 동작은 동일하게 유지된다. 각 단계 후 `bun test`와 타입체크(`bunx tsc --noEmit` 또는 프로젝트 설정)를 실행한다.

1. **API 클라이언트 추출** — fetch 래퍼 9개를 `screens-client.ts` / `screen-inference-client.ts`로 이동, AppShell은 import만 교체. 동작 변화 없음.
2. **localStorage 추출** — persist read/write + 타입가드를 `new-screen-workbench-storage.ts`로 이동.
3. **도메인 B 훅** (`useNewScreenInference`) — 가장 독립적이라 먼저. 추출 후 AppShell에서 호출하고 setSaveState 주입.
4. **도메인 A 훅** (`useScreenWorkbench`) — 로딩·선택·파생상태·저장.
5. **도메인 C 훅** (`usePuckEditing`) — A의 출력 주입, Puck 래핑 로직 이동.
6. **AppShell 정리** — 잔여 와이어링 정리 + 파생상태 `useMemo` 적용.

## 동작 보존 / 검증

- 기존 테스트: `apps/web/src/components/App.test.tsx`(478줄), `SmokeRunExplorer.test.tsx`가 회귀 안전망 역할을 한다. 각 단계 후 전부 통과해야 한다.
- 순수 구조 이동이므로 새 동작·새 기능은 없다. API 호출 시퀀스, effect 실행 조건, 폴링 주기(1500ms), localStorage 키(`cx.new-screen.workbench.v0.1`)는 모두 그대로 유지한다.

## 범위 밖 (YAGNI)

- zustand 스토어 도입.
- 훅 6~8개로의 세분화.
- 자식 뷰 컴포넌트 리팩터(이미 양호).
- `model/workbench-view-model.ts`, `model/puck-edit-scope.ts` 변경(이미 양호).
- 에러 처리 방식 통일 등 동작을 바꾸는 정리.
