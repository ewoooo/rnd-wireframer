# 레이아웃 규칙 (Editor Chrome Layout)

이 디렉터리(`components/layout/`)는 **에디터 화면 골격**을 소유한다.
캔버스 *안*에 렌더되는 폰 와이어프레임의 레이아웃은 별개다
(그건 `@cx/components` / `packages/agent`의 `LAYOUT_SPACING_CONTRACT.md` 소관 — 혼동 금지).

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

## 컴포넌트

- `Rail.tsx` — 좌측 세로 내비(아이콘+라벨). 페이지 전환.
- `DoubleBorder.tsx` — 영역 강조 구분선(수직/수평). 위 3개 경계에 사용.
- `LeftAside` / `RightAside` / `Canvas` — (이관 진행 중) 각 패널을 기능 손실 없이 하나씩 aside 안으로 옮긴다.

## 마이그레이션 원칙

기존 패널(NavigationRoutes / EditSidebar 등)을 **한 번에 옮기지 말고 하나씩 조심히** 이 구조 안으로 이관한다.
각 단계에서 기능(선택/저장/드로어 등) 손실이 없는지 확인하며 진행.
