# RND Screen Generator Display Preview Schema

## 1. 문서 책임

이 문서는 디스플레이 프리뷰 화면에서 특정 screen 또는 area을 열었을 때 프론트엔드가 소비하는 조회용 JSON 스키마를 정의한다.

SQL에 적재하는 1차 원천 정보의 책임은 [DATA_MAP.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/DATA_MAP.md)를 따른다. 이 문서의 스키마는 원천 테이블이 아니라 화면 표시를 위한 read model이다.

## 2. 설계 원칙

- display preview schema는 DB SSOT가 아니라 조인/파싱 결과다.
- 같은 정보가 SQL 원천 테이블에 있어도 프론트 렌더링에 필요한 형태로 다시 묶을 수 있다.
- 화면을 열었을 때 좌측 목록, 중앙 프리뷰, 우측 상세 패널을 한 응답으로 구성한다.
- 우측 상세의 table row는 표시 순서를 가진다.
- table row에는 화면 표시값과 원천 추적용 code를 함께 둔다.
- 생성 전 화면은 `preview.status = "empty"`로 표현한다.
- 생성 후 화면은 `preview.status = "generated"`와 `generatedScreenId` 또는 `wireframeJson` 참조로 표현한다.

## 3. 최상위 구조

```ts
type DisplayPreviewScreen = {
  schemaVersion: "display-preview-screen/v1";
  module: DisplayPreviewModule;
  selected: DisplayPreviewSelection;
  navigation: DisplayPreviewNavigation;
  workspace: DisplayPreviewWorkspace;
};
```

| 필드 | 타입 | 책임 |
|---|---|---|
| `schemaVersion` | string | 프리뷰 조회 JSON 버전 |
| `module` | object | 현재 모듈 정보 |
| `selected` | object | 현재 선택된 대상과 탭/케이스 상태 |
| `navigation` | object | 좌측 목록 렌더링 데이터 |
| `workspace` | object | 중앙 프리뷰와 우측 상세 데이터 |

## 4. Module

```ts
type DisplayPreviewModule = {
  code: string;
  name: string;
};
```

| 필드 | 타입 | 예시 | 책임 |
|---|---|---|---|
| `code` | string | `mbr` | SQL의 `module` |
| `name` | string | `MBR` | 화면 표시용 모듈명 |

## 5. Selection

```ts
type DisplayPreviewSelection = {
  entityType: "screen" | "area";
  code: string;
  activeTab: "screen" | "area";
  activeCaseCode: string;
};
```

| 필드 | 타입 | 책임 |
|---|---|---|
| `entityType` | enum | 현재 상세 패널의 기준 대상 |
| `code` | string | 선택된 screen code 또는 area code |
| `activeTab` | enum | 상단 탭 상태 |
| `activeCaseCode` | string | 선택된 기본/오류/분기 케이스 |

## 6. Navigation

```ts
type DisplayPreviewNavigation = {
  searchPlaceholder: string;
  groups: DisplayPreviewNavigationGroup[];
};

type DisplayPreviewNavigationGroup = {
  type: "screen" | "area";
  title: string;
  items: DisplayPreviewNavigationItem[];
};

type DisplayPreviewNavigationItem = {
  code: string;
  name: string;
  version: string;
  updatedAt: string;
  selected?: boolean;
  parentCode?: string;
  unresolved?: boolean;
};
```

| 필드 | 책임 |
|---|---|
| `groups[].type` | 목록 그룹 종류 |
| `groups[].items[].code` | screen code 또는 area code |
| `groups[].items[].name` | 목록에 표시할 이름 |
| `groups[].items[].version` | 목록 우측 version 표시 |
| `groups[].items[].updatedAt` | 목록 우측 날짜 표시 |
| `groups[].items[].parentCode` | area일 때 연결된 screen code 또는 상위 code |
| `groups[].items[].unresolved` | 원천 참조가 아직 해결되지 않은 항목 표시 |

## 7. Workspace

```ts
type DisplayPreviewWorkspace = {
  tabs: DisplayPreviewTab[];
  cases: DisplayPreviewCase[];
  preview: DisplayPreviewFrame;
  detail: DisplayPreviewDetail;
};
```

### tabs

```ts
type DisplayPreviewTab = {
  code: "screen" | "area";
  label: string;
  active: boolean;
};
```

### cases

```ts
type DisplayPreviewCase = {
  code: string;
  label: string;
  type: "base" | "branch" | "error" | "empty";
  selected: boolean;
};
```

`cases`는 화면 상단 chip으로 표시한다. 기본 화면, case branch, 오류 화면, empty 상태를 모두 같은 배열로 표현한다.

### preview

```ts
type DisplayPreviewFrame = {
  status: "empty" | "generated" | "failed";
  message?: string;
  device: "mobile";
  frame: {
    width: number;
    height: number;
  };
  generatedScreenId?: string;
  wireframeJson?: unknown;
};
```

생성 전에는 `status = "empty"`와 `message`를 사용한다. 생성 후에는 `generatedScreenId` 또는 `wireframeJson`으로 렌더링 대상을 연결한다.

## 8. Detail

```ts
type DisplayPreviewDetail = {
  entityType: "screen" | "area";
  title: string;
  actions: DisplayPreviewAction[];
  summary: DisplayPreviewSummaryRow[];
  sections: DisplayPreviewDetailSection[];
};

type DisplayPreviewAction = {
  code: string;
  label: string;
  icon: string;
};
```

| 필드 | 책임 |
|---|---|
| `entityType` | 우측 상세 패널이 screen 상세인지 area 상세인지 구분 |
| `title` | 상세 패널 제목 |
| `actions` | 우측 상단 action 버튼 |
| `summary` | 기본 정보 key-value 목록 |
| `sections` | 상세 테이블 섹션 목록 |

### summary

```ts
type DisplayPreviewSummaryRow = {
  key: string;
  label: string;
  value: string | string[] | null;
  valueType?: "text" | "code" | "code-list" | "link" | "date";
  href?: string;
};
```

`summary`에는 화면 ID, 화면 명, 화면 설명, 화면 경로, 구현 유형, 관련 정책 그룹, 관련 유즈케이스, 관련 기능, 작성일, 작성자, 버전처럼 우측 상단에 노출되는 행을 둔다.

### sections

```ts
type DisplayPreviewDetailSection =
  | DisplayPreviewCompositionSection
  | DisplayPreviewFlowSection;

type DisplayPreviewCompositionSection = {
  type: "screen-composition";
  title: "화면 구성";
  columns: DisplayPreviewTableColumn[];
  rows: DisplayPreviewCompositionRow[];
};

type DisplayPreviewFlowSection = {
  type: "screen-flow";
  title: "화면 흐름";
  columns: DisplayPreviewTableColumn[];
  rows: DisplayPreviewFlowRow[];
};

type DisplayPreviewTableColumn = {
  key: string;
  label: string;
};
```

## 9. 화면 구성 Row

```ts
type DisplayPreviewCompositionRow = {
  no: string;
  areaType: "static" | "dynamic" | "conditional" | "overlay";
  areaDescription: string;
  layout: "vertical" | "horizontal" | "stack" | "overlay";
  areaCode: string;
  areaName: string;
  areaDescription: string;
  serverControl: string[];
  exposure: {
    min: number | null;
    max: number | null;
    priority: number | null;
  };
  errorHandling: string | null;
};
```

| 필드 | 원천 후보 |
|---|---|
| `no` | screen-area order, section no |
| `areaType` | area state, screen composition type |
| `areaDescription` | screen-area 설명 또는 area 역할 |
| `layout` | area `meta.layout` |
| `areaCode` | area source code |
| `areaName` | area `meta.name` |
| `areaDescription` | area `meta.description` |
| `serverControl` | area states/action, component action, policy |
| `exposure` | visibleComponents, priority, min/max 규칙 |
| `errorHandling` | area state error 또는 case branch 후속 처리 |

## 10. 화면 흐름 Row

```ts
type DisplayPreviewFlowRow = {
  kind: "transition" | "case-branch" | "fallback";
  screenCode: string;
  screenName: string;
  condition: string;
  payload: string[];
  followUp: string | null;
};
```

| 필드 | 원천 후보 |
|---|---|
| `kind` | 화면 전환, 케이스 분기, fallback 구분 |
| `screenCode` | 대상 screen code 또는 variant screen code |
| `screenName` | 대상 screen name |
| `condition` | transition 조건 또는 case branch 조건 |
| `payload` | 다음 화면에 전달되는 데이터 |
| `followUp` | 후속 처리 설명 |

## 11. Mock 파일

샘플 read model은 `docs/data-mockups/3-parsed-jsons/display-preview-screen.json`에 둔다. 이 디렉토리는 파싱된 조회용 fixture를 보관하는 위치이며, 샘플 파일은 후속 display preview fixture 작업에서 추가한다.

추가될 샘플 파일은 SQL 적재 대상이 아니라 프론트엔드 상세 화면 구현과 API 응답 계약을 검토하기 위한 기준 샘플이다.
