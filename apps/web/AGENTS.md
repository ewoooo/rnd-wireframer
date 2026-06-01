# apps/web 에이전트 지침

## Workbench Data Loader

- `src/data/*loader.ts`는 앱이 소비할 workbench read model을 만드는 loader 계층이다.
- 로컬 JSON loader와 후속 DB/API loader는 같은 소비 데이터 계약을 반환해야 한다.
- workbench, store, renderer는 데이터 출처가 로컬 JSON인지 DB/API인지 알지 못해야 한다.
- table JSON, DB read model, API 응답을 render tree로 바꾸는 순수 변환 로직은 `src/adapters/`에 둔다.
- `mock`이라는 이름은 fixture 자체에만 사용하고, 앱 실행 데이터 공급자는 `loader`라는 이름을 포함한다.

## Server Boundary

- `src/app/api/**/route.ts`는 HTTP request parsing, status code, `NextResponse`만 담당한다.
- 파일 시스템 접근, client-import 보관/조회, Claude/Agent SDK 실행, AI import artifact write는 `src/server/` 아래에 둔다.
- `src/data/**`는 workbench read model loader와 앱 소비 데이터 shape만 다룬다. `node:*`, 파일 쓰기, 업로드 처리는 넣지 않는다.
- `src/server/**`는 browser component나 zustand store에서 import하지 않는다.
- `src/agent/**`는 브라우저 작업면에서 쓰는 asset registry view/helper만 둔다. 서버 전용 agent orchestration은 `src/server/agent/**`로 분리한다.

## Layout (레이아웃 골격 — 라우팅·콘텐츠와 독립)

- 모든 페이지는 라우팅과 무관하게 동일한 레이아웃 골격을 따른다. 골격은 콘텐츠를 모른다(content-agnostic).
- 최상위 구성:
  1. `Rail` (nav)
  2. nav 외 영역: `LeftAside` → `Canvas`(또는 canvas wrapper) → `RightAside`
- 위 영역들은 아주 얇은 직사각형 `Divider`로 구분되며, 시각적으로 double border처럼 보인다.
- 각 `Aside`는 `Panel`을 자식으로 가지며 수직 배치한다. 한 Aside에 n개의 Panel을 두면 그 사이에 총 n−1개의 resizable `Divider`가 들어간다.
- `Panel`은 모두 동일한 slot 컴포넌트다. `title`, `children` 등을 prop으로 받는다.
- 프리미티브 명명: `Rail` / `LeftAside` / `Canvas` / `RightAside`, 그리고 `Aside` / `Panel` / `Divider`.
- 레이아웃 프리미티브에 페이지별 콘텐츠를 하드코딩하지 않는다. 어떤 Panel에 무엇이 들어갈지는 페이지가 결정한다.

## Panel 콘텐츠 컨벤션 (코드 외 공유 지식 — 레이아웃 규칙 아님)

> 레이아웃과 콘텐츠는 독립이다. 아래 위치별 콘텐츠 매핑은 레이아웃 프리미티브에 새겨 넣을 규칙이 **아니라**, AI와 디자이너가 공유하는 코드 외적 지식이다. 페이지 컴포넌트가 이 컨벤션에 따라 Panel을 채운다. 적용 대상은 screen / area / component 페이지뿐이다.

개념 위계로 위치가 정해진다 — 좌측은 "탐색"(상=나보다 큰 개념, 하=형제), 우측은 "현재 대상의 구조"(상=레이어, 하=나보다 작은 개념).

| 위치 | 의미 | screen | area | component |
| --- | --- | --- | --- | --- |
| 좌상단 | 나보다 큰 개념(부모 맥락) | 도메인·루트 선택 | 나를 사용하는 screen 목록 | 나를 사용하는 area 목록 |
| 좌하단 | 형제(같은 레벨) | 같은 루트의 다른 screen·variant | 모든 area | 모든 component |
| 우상단 | 레이어 패널 | 현재 캔버스 요소의 레이어 트리(Figma식). 캔버스로도 순서 변경 가능하나 더 세밀한 제어용. 세 페이지 공통 | ← | ← |
| 우하단 | 나보다 작은 개념(자식) | area를 고르는 리스트 | component를 고르는 리스트 | raw values 설정 패널 |

Canvas:

- 상단 툴바: 편집 대상 "그 자체"의 설정. 위치가 페이지 간 동일하므로, screen 페이지에선 screen 자체 설정(저장, 다크모드, 상태바 표시 등)을 둔다.
- 본문: 요소 직접 편집. 요소 복제/삭제가 가능하고, component의 경우 여기서 prop을 설정할 수 있다.
