# 레이아웃 규칙 (Editor Chrome Layout)

이 디렉터리(`components/layout/`)는 **에디터 화면 골격**을 소유한다.
캔버스 *안*에 렌더되는 폰 와이어프레임의 레이아웃은 별개다
(그건 `@cx/components` / `packages/agent`의 `LAYOUT_SPACING_CONTRACT.md` 소관 — 혼동 금지).

> **참고 기준(reference):** UI는 커밋 `d75e8d2`(PR #7, "render_* 스키마 이전·Run 페이지 추가", main 복원 시점)의
> `components/layout/*` · `ui/resizable.tsx`를 레퍼런스로 참고해 현재 main 방언으로 재구현했다.
> 이 커밋은 main 히스토리의 **영구 앵커**다(임시 워크트리·스냅샷 브랜치에 의존하지 않음).
> 아래 "good-ui"라는 표현은 모두 이 커밋 시점의 UI를 가리킨다.

## 전체 구조 (모든 페이지 공통)

Screen / Area / Component / Run 등 **모든 페이지가 동일한 구조를 공유한다.**

```
body  (flex, 수평)
├─ Rail
├─ DoubleBorder            ← ① rail ↔ main 분리 (항상 표시)
└─ main  (flex, 수평)
   ├─ left  (숨기기 가능)
   │  ├─ LeftAside
   │  └─ DoubleBorder      ← ② leftAside ↔ canvas 분리
   ├─ Canvas               (가변폭 = 나머지 공간)
   └─ right  (숨기기 가능)
      ├─ DoubleBorder      ← ③ canvas ↔ rightAside 분리
      └─ RightAside
```

## 규칙

- **수평 4단:** `Rail · LeftAside · Canvas · RightAside` (위치 기반 명명. 역할 기반 이름 금지).
- **수직 DoubleBorder 3개:**
  1. `rail ↔ main` — 항상 표시.
  2. `leftAside ↔ canvas` — `left` 그룹 **안**에 속함.
  3. `canvas ↔ rightAside` — `right` 그룹 **안**에 속함.
- **숨김 동작:** `left` / `right`는 숨기기 가능. DoubleBorder ②③은 각 그룹 안에 있으므로
  해당 aside를 숨기면 **그 경계선도 함께 사라진다.** Rail은 항상 표시 → ①도 항상 표시.
- **Canvas**는 가변폭(나머지 공간 차지). 내부 메뉴/툴바는 추후 구체화.

## Aside 내부 구성 (panel · divider)

하나의 Aside는 **n개의 panel과 n-1개의 divider**로 이루어진다.

- **첫(최상단) 패널은 divider가 없다.** 단 하나만 존재할 수도 있는 패널이므로.
- 패널이 추가될 때마다 **그 패널 위에 divider가 붙는다** → divider는 자기 아래 패널과 한 세트.

```
(panel1) (divider + panel2) (divider + panel3) ⋯
```

즉 `index > 0`인 패널 앞에만 divider를 끼운다 (good-ui `Aside.tsx`와 동일).

**두 종류의 선은 역할이 다르다 — 혼동 금지:**
- **DoubleBorder** = 레이아웃 *칼럼* 간 경계(rail↔main, aside↔canvas). 강한 분리, 고정.
- **Divider** = aside *내부* 패널 간 분리. 드래그로 비율 조절(`ResizableHandle`, 중앙 알약선).
  `ResizablePanelGroup`(vertical) 안에서 `ResizablePanel` 사이에 `ResizableHandle`로 구현.

## 컴포넌트

- `Rail.tsx` — 좌측 세로 내비(아이콘+라벨). 페이지 전환.
- `DoubleBorder.tsx` — 칼럼 경계 강조 구분선(수직/수평). 위 3개 경계에 사용.
- `Aside.tsx` — 규칙을 코드화한 프리미티브. `Aside`(n Panel 사이에 Divider 자동 삽입) · `Panel`(title/footer/defaultSize/minSize, body 자동 스크롤) · `Divider`(=`ResizableHandle`). good-ui `Aside.tsx`를 native 이식.
- `ui/resizable.tsx` `ResizableHandle` — aside 내부 패널 divider(드래그, 중앙 알약선). good-ui 디자인 차용.
- `LeftAside` / `RightAside` / `Canvas` — (이관 진행 중) 기존 패널(NavigationRoutes/EditSidebar)을 위 `Aside`/`Panel`로 하나씩 옮긴다.

## 마이그레이션 원칙

기존 패널(NavigationRoutes / EditSidebar 등)을 **한 번에 옮기지 말고 하나씩 조심히** 이 구조 안으로 이관한다.
각 단계에서 기능(선택/저장/드로어 등) 손실이 없는지 확인하며 진행.
