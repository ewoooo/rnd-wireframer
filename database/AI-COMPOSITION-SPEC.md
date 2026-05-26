# AI Composition Spec

LLM이 PRDD를 읽어 화면을 조립하는 새 파이프라인의 **데이터 모양과 규율**을 정의한다. 이 문서가 잠긴 뒤 코드로 옮긴다.

상위 lifecycle 규칙은 [README.md](./README.md) 참조. 이 문서는 그 위에서 "AI가 무엇을 입력받고 무엇을 출력하는가"만 다룬다.

---

## 1. 모델 요약

### 1.1 두 계층 카탈로그

```
catalog/
├─ primitives/                ← 인간만 작성. ComponentPropContract 잠김
└─ component-patterns/
   ├─ registered/             ← 큐레이션 통과
   └─ proposed/               ← AI 저작, 검토 대기
```

- **primitive**: 더 이상 쪼개지 않는 기초 컴포넌트. `@cx/components/catalog` 항목.
- **componentPattern**: primitives(+다른 componentPatterns)의 parametrized composition. 자기 props·variants·contract를 가진 1급 객체.
- **layoutPattern**: screen/region/area/group의 배치 recipe. 현재 `database/pattern-store`가 소유한다.
- AI는 primitives를 **추가하지 못한다**. 부족하면 *gap report*를 낸다.

이 문서에서 `pattern`이라고 단독으로 쓰지 않는다. Compose가 선택/제안하는 것은 **componentPattern**, Decorate가 선택하는 것은 **layoutPattern**이다.

### 1.2 AI의 네 가지 행동

각 컴포넌트 슬롯에서 LLM Composer는 정확히 하나를 선택한다.

| mode | 의미 | 출력 |
|---|---|---|
| `reuse-primitive` | primitive를 직접 사용 | `primitiveId` + props |
| `reuse-pattern` | registered/proposed componentPattern 사용 | `componentPatternId` + props |
| `propose-pattern` | 새 componentPattern을 정의해 사용 | componentPattern 드래프트 동봉 |
| `report-gap` | 어떤 primitive로도 의도 표현 불가 | gap report 동봉 |

### 1.3 카탈로그 가시성 (설계 1)

LLM이 받는 카탈로그 카드덱은 `primitives`와 `componentPatterns`를 **명시적으로 분리**한 형태. componentPattern이 1급 시민으로 보여야 reuse-pattern 압력이 자연스럽게 생긴다.

### 1.4 파이프라인 단계

LLM은 **의미 해석에만**, 결정론적 단계는 **일관성에만**. 호출 경계를 단계별로 분리해 단일-호출-통째 방식의 토큰·수렴 실패를 피한다. LLM은 **두 단계**에 들어가며, 각 단계 직후 Validator가 1급 게이트로 작동한다.

```
PRDD.md
   │
   ▼
[Register = deterministic parser]
   │  - Schema A (PRDD Screen Record) 생성
   │  - PRDD prose를 자르거나 요약하지 않고 1급 필드로 보존
   │  - catalog 매칭 가능성만 표시하고 최종 composition 결정은 하지 않음
   ▼
[Archetype Scaffold = deterministic]
   │  - screen archetype과 최소 block 골격 계약 생성
   │  - 화면별 수동 체크리스트가 아니라 archetype별 재사용 scaffold
   │  - 비즈니스 사실은 생성하지 않고 expected/optional/synthetic 허용 범위만 제공
   ▼
[Compose = LLM #1]                 ← 화면 단위 1회 호출
   │  - Schema A 입력
   │  - Archetype Scaffold 입력
   │  - 카탈로그 카드덱(설계 1) prior
   │  - docs/design 기반 design deck prior
   │  - layoutPatternStore prior
   │  - 각 슬롯에서 reuse-primitive / reuse-pattern / propose-pattern / report-gap
   │  - componentPattern 결정
   │  - layoutPattern 1차 결정
   │  - 출력: Schema B composed.json + (Schema C proposed componentPattern 드래프트) + (Schema D gap reports)
   ▼
[Contract Validator #1] ★1급 게이트
   │  catalog hit / variant 존재 / ComponentPropContract / TokenRole /
   │  variantTokens / DAG / propose 5종 세트 / Resolver 룰
   │  위반 시 → 좁은 재시도 (위반 노드/슬롯만 LLM #1에 다시)
   ▼
[Decorate = LLM #2]                ← 화면 단위 1회 호출
   │  - composed.json 입력
   │  - Compose가 만든 layoutPattern 1차안을 검증·보정
   │  - 비어 있거나 호환되지 않는 layoutPattern만 보완
   │  - 출력: decorated.json (트리 구조 불변, layoutPattern 검증 결과만 추가)
   ▼
[Contract Validator #2] ★1급 게이트
   │  layoutPattern hit / variant 존재 / 노드 종류와 layoutPattern 호환성 /
   │  layoutPatternStore 룰 / Resolver 룰
   │  위반 시 → 좁은 재시도 (위반 노드만 LLM #2에 다시)
   ▼
[Materializer = deterministic]
   │  DB row shape
   ▼
[Design Review]
   │  docs/design 근거로 composed/decorated 결과 검증·개선 patch
   │  proposed componentPattern 큐레이션 → registered 승격
   │  gap report 큐 처리 → 인간이 primitive 추가
```

**LLM 책임 분리**:
- **LLM #1 (Compose)**: componentPattern + layoutPattern 1차안. "어떤 UI 블록을 어디에 놓고, 어떤 design/layout pattern으로 조립하는가."
- **LLM #2 (Decorate)**: layoutPattern 검증·보정. Compose의 layoutPattern 1차안을 유지하는 것을 기본으로 하고, 누락·비호환·명백한 품질 문제만 보정한다.
- Compose는 `docs/design/` 책임 문서를 근거로 화면 골격, area role, componentPattern, layoutPattern을 함께 결정한다.
- Archetype Scaffold는 코드가 만든 얇은 설계도다. Compose는 이 설계도를 채우고, 채울 수 없는 block을 `missingBlocks`/`gapReports`로 설명한다.
- Decorate는 트리 구조·prop·binding **절대 변경 금지**. layoutPattern 검증 결과와 보정 사유만 추가한다.

**layoutPattern 핸드오프 규칙** (Compose draft → Decorate verification):
1. Compose는 screen/area/decision 단위에 가능한 한 `layoutPatternDraft`를 작성한다. area에는 필수, decision에는 componentPattern 내부 배치가 필요한 경우 작성한다.
2. Validator #1은 Compose의 `layoutPatternDraft`를 검증한다 (layoutPatternStore hit, variant 존재, node kind 호환).
3. Decorate는 Compose draft를 (a) 그대로 승인, (b) variant만 조정, (c) 다른 layoutPattern으로 보정 중 하나로 처리한다.
4. Decorate가 조정/보정한 경우 `verification.reasons[]`에 원 draft와 변경 사유, 참조한 `docs/design/` 문서를 남긴다.
5. Decorate는 새 화면 구조, 새 componentPattern, 새 props/binding/hook을 만들 수 없다.

**경계 규율**:
- LLM 호출은 **Compose와 Decorate 두 단계뿐**. Materializer는 절대 LLM이 만지지 않음.
- PRDD 추출은 LLM 책임이 아니다. Register가 PRDD를 deterministic하게 파싱해 Schema A를 만들고, LLM #1은 Schema A를 읽어 composition decision만 수행한다.
- 재시도는 **위반 노드 범위로 좁힘**. 전체 트리 재생성 금지.
- 화면 단위 호출. 다중 화면 일괄 호출 금지 (457KB→0 실패 패턴 회피).
- 단계 간 책임은 `CLAUDE.md` 메모리 룰 그대로 — Register=parse, Composer=place props·bindings·layoutPattern drafts, Decorator=verify/improve layoutPatterns, DB=materialize. Compose는 Register가 보존한 PRDD prose와 `docs/design/` 근거를 재해석할 수 있지만, 원문 추출·파싱 결과를 대체하지 않는다.

**두 LLM 단계의 위험**:
- Compose 출력이 Decorate 입력 — Validator #1이 새는 결함은 Decorate 비용까지 끌고 감. Validator #1 엄격도가 중요.
- 비용·지연이 단일 LLM 호출의 2배. 화면 93개 × 2 호출이 운영 부담이 되면 Decorate를 결정론적으로 되돌릴 escape hatch를 남겨둠 (§9 #5 참고).

---

## 2. Schema A — PRDD Screen Record

**AI Compose 입력 사이드카**. runtime registered tree가 아니다.

Register는 한 PRDD에서 두 표상을 함께 생성한다:
- **runtime `RegisteredScreenNode`** (`packages/agent/src/types.ts`) — route/variant/screen tree. Composer/Decorator/Materializer가 소비.
- **`PrddScreenRecord` (Schema A)** — PRDD prose 1급 보존본. LLM #1 Compose가 의미 해석용으로 읽음.

두 표상은 동일 PRDD import 호출에서 **함께** 생성되며, 이 cross-table 정합성은 Register의 책임이다 (§2.1).

### 2.1 Cross-table Invariant (Register 책임)

| invariant | 의미 |
|---|---|
| 같은 `screenId` | 두 표상은 동일한 screen 식별자로 매칭된다 |
| 같은 `importJobId` | 한 PRDD import 호출에서 동시 생성됨을 보증. 양쪽에 동일 값 |
| `areas.length` 일치 | PrddScreenRecord의 areas 수 = runtime tree의 area 수 |
| `area.children.length` 일치 | 각 area의 component entry 수 = runtime tree의 같은 area component 수 |
| `semanticName` / `rawComponentId` 추적 가능 | runtime tree의 component name이 PrddComponentEntry에서 역추적됨 |

Validator는 이 invariant도 cross-table integrity 검사로 1줄씩 확인한다.

### 2.2 타입 정의

```ts
interface PrddScreenRecord {
  level: "screen";
  id: string;
  name: string;
  order: number;
  screenType: ScreenSurfaceType;   // @cx/types NODE_TYPES.screenSurface
  description: string;

  /** Register가 부여하는 import 호출 ID. runtime tree와 공유. */
  importJobId: string;

  states: PrddScreenState[];       // PRDD "컴포넌트 상태" 표
  flow: PrddScreenFlow[];          // PRDD "화면 흐름" 표
  policyGroups: string[];          // PRDD 헤더 "관련 정책 그룹"
  useCases: string[];              // "관련 유즈케이스"
  features: string[];              // "관련 기능"

  areas: PrddArea[];
}

interface PrddScreenState {
  state: "default" | "loading" | "error" | string;
  trigger: string;                 // 자연어 그대로
  changes: PrddAreaChange[];       // [영역 N] 어떤 변화
  action?: string;                 // 후속 액션 (예: apiCall)
}

interface PrddAreaChange {
  areaRef: string;                 // "영역 1" 또는 areaId
  description: string;             // 변화 산문
}

interface PrddScreenFlow {
  kind: "transition" | "case-branch";
  targetScreenId: string;
  targetScreenName: string;
  condition: string;               // 자연어 그대로
  payload?: string;                // "전달 데이터" 컬럼
  postProcess?: string;            // "후속 처리" 컬럼
}

type PrddAreaSlot = "header" | "contents" | "bottom";

interface PrddArea {
  areaId: string;
  order: number;
  slot: PrddAreaSlot;
  area: {
    level: "area";
    id: string;
    name: string;
    description: string;
    layout: string;                // PRDD "영역 레이아웃" 원문

    // PRDD prose 보존
    visibilityRuleRaw: string;     // "노출 조건" 컬럼 원문 (보존 1급)
    visibilityRuleHint?: PrddVisibilityHint; // 결정 ①: parser가 명확 판정 가능할 때만
    serverControls: string[];      // "서버 제어 항목"
    countMin?: number;
    countMax?: number;
    priority?: number;
    errorHandling?: string;        // "오류 처리 방식"
    notes: string[];               // 정책 인용 산문 (비고 컬럼)

    children: PrddComponentEntry[];
  };
}

interface PrddComponentEntry {
  // catalog 매칭 결과
  primitiveId: string | null;      // catalog hit 여부. null이면 미해석

  // PRDD 원본 보존
  semanticName: string;            // 예: "CardSummaryProductSummary"
  rawComponentId: string;          // 예: "CardSummary" (PRDD 컴포넌트 ID 컬럼)
  variantHint: string | null;      // PRDD variant 컬럼 원문
  displayTextTemplate: string;     // "title: {상품명}<br>subText: ..." 그대로
  bindings: PrddBinding[];         // "바인딩(소스)" 컬럼 파싱
  events: EventHook[];             // 이벤트·액션·파라미터
  notes: string[];                 // 비고 산문 (정책 근거 포함)
  policyIds: string[];             // notes에서 추출
  order: number;
}

interface PrddBinding {
  origin: "api" | "policy" | "static" | "state";
  ref: string;                     // "FN-PRDD-DTL-001" / "PI-..." / "-"
  description: string;             // 원문
}

interface PrddVisibilityHint {
  kind: "always" | "state" | "api" | "policy";
  ref?: string;
}

interface EventHook {
  trigger: string;                 // onClick, onChange
  action: string;                  // navigate, setState, apiCall
  target?: string;
  params?: Record<string, unknown>;
}
```

**원칙**: PRDD prose는 자르거나 정규화하지 않는다. 파싱 비용을 들이되 의미는 1:1 보존. 다운스트림 LLM Composer가 이걸 직접 읽는다.

**결정 ①**: 자연어 필드는 원문을 1급으로 보존하고, deterministic parser가 명확히 판정할 수 있는 경우에만 보조 normalized field를 추가한다. 예: `visibilityRuleRaw: string` + `visibilityRuleHint?: { kind: "always" | "state" | "api" | "policy"; ref?: string }`. LLM은 raw와 hint를 함께 보되, raw를 대체하지 않는다.

---

## 3. Schema B — Composition Decision Output

LLM #1 Compose의 주 산출물. Schema A를 직접 수정하지 않고, Schema A의 source를 참조해 **어떤 UI 블록을 어디에 놓을지** 결정한다.

Materializer 앞 deterministic adapter는 이 Schema B를 Schema A와 합쳐 기존 `ComposedNodeTree` 계열 또는 후속 table draft로 변환한다.

```ts
interface CompositionOutput {
  kind: "composition-output";
  schemaVersion: string;
  source: {
    screenId: string;
    registeredSchemaVersion: string;
    catalogDeckVersion: string;
    designDeckVersion: string;
    layoutPatternStoreDeckVersion: string;
  };

  screen: CompositionScreen;
  areas: CompositionArea[];
  decisions: CompositionDecision[];

  proposedComponentPatterns: ComponentPattern[]; // Schema C. mode === "propose-pattern"에서 참조
  gapReports: GapReport[];          // Schema D. mode === "report-gap"에서 참조
  warnings: CompositionWarning[];
}

interface CompositionScreen {
  screenId: string;
  intent: string;                   // PRDD 전체를 읽은 화면 목적
  primaryUserGoal: string;          // 사용자가 이 화면에서 달성해야 하는 일
  strategy:
    | "task-flow"
    | "comparison"
    | "decision-summary"
    | "error-recovery"
    | "form-entry"
    | "detail-reading"
    | "confirmation"
    | "support";
  archetype:
    | "commerce-detail"
    | "form-entry"
    | "agreement-flow"
    | "confirmation"
    | "list-browse"
    | "support"
    | "generic-detail";
  completeness: {
    requiredBlocks: ArchetypeBlockId[];
    presentBlocks: ArchetypeBlockId[];
    syntheticBlocks: ArchetypeBlockId[];
    missingBlocks: ArchetypeBlockId[];
    omittedBlocks: Array<{ blockId: ArchetypeBlockId; reason: string }>;
  };
  stateRefs: string[];              // Schema A states[].state 참조
  flowRefs: string[];               // Schema A flow row에서 파생한 stable id
  policyRefs: string[];
  designRefs: DesignReference[];
  layoutPatternDraft: LayoutPatternDraft;
}

type ArchetypeBlockId =
  | "navigation"
  | "hero-summary"
  | "primary-facts"
  | "option-selection"
  | "supporting-info"
  | "disclosure"
  | "primary-action"
  | "terms-list"
  | "agreement-control"
  | "form-fields"
  | "validation-feedback"
  | "result-state"
  | "next-action"
  | "list-results"
  | "filter-sort"
  | "support-action"
  | "section-header"
  | "divider"
  | "footer-legal";

interface CompositionArea {
  areaId: string;                   // Schema A PrddArea.area.id
  sourceAreaRef: string;            // 대표 PRDD 영역 번호 또는 areaId
  sourceRefs: CompositionSourceRef[];
  compositionAction:
    | "preserve-source-area"
    | "merge-source-areas"
    | "split-source-area"
    | "synthesize-supporting-area";
  slot: "header" | "contents" | "bottom";
  role:
    | "navigation"
    | "hero"
    | "summary"
    | "form"
    | "list"
    | "guide"
    | "error"
    | "empty"
    | "confirmation"
    | "action"
    | "supporting";
  intent: string;
  visualIntent:
    | "primary"
    | "secondary"
    | "supporting"
    | "warning"
    | "confirmation"
    | "cta-support";
  order: number;
  decisionIds: string[];
  synthetic?: {
    reason: string;
    basedOnSourceRefs: CompositionSourceRef[];
  };

  // Compose가 만드는 1차 layoutPattern. Decorate는 검증·보정만 한다.
  layoutPatternDraft: LayoutPatternDraft;
  designRefs: DesignReference[];
}

type CompositionMode =
  | "reuse-primitive"
  | "reuse-pattern"
  | "propose-pattern"
  | "report-gap";

interface CompositionDecision {
  id: string;                       // stable id, 예: cmp-NOVA-...-a1-2
  mode: CompositionMode;

  // 추적성: 모든 decision은 Schema A의 원천 위치를 반드시 가리킨다.
  sourceRef: {
    screenId: string;
    areaId: string;
    componentRow?: number;
    componentEntryId?: string;
    semanticName?: string;
    rawComponentId?: string;
  };
  sourceRefs: CompositionSourceRef[];

  target: {
    areaId: string;
    order: number;
    slot?: string;                  // componentPattern slot에 끼워 넣는 경우
  };

  intent: string;                   // 이 decision이 표현하려는 UI 의미
  rationale: string;                // PRDD 근거. 최소 1개 구체 근거 포함
  emphasis: "high" | "medium" | "low";
  policyRefs: string[];
  stateRefs: string[];

  selection: CompositionSelection;  // mode별 discriminated union
  props: Record<string, unknown>;   // primitive/componentPattern public contract에 맞춘 props
  bindings: Binding[];
  hooks: EventHook[];

  display?: {
    visibleWhen?: string;           // Schema A visibility/state 문구 참조. 자유 표현 저장만.
    emptyWhen?: string;
    errorWhen?: string;
  };

  layoutPatternDraft?: LayoutPatternDraft; // componentPattern 내부 배치가 필요한 경우 작성.
  designRefs?: DesignReference[];
}

interface CompositionSourceRef {
  screenId: string;
  areaId?: string;
  areaNo?: number;
  componentRow?: number;
  componentEntryId?: string;
  semanticName?: string;
  rawComponentId?: string;
  reason: string;
}

type CompositionSelection =
  | {
      mode: "reuse-primitive";
      primitiveId: string;
      variant?: string;
    }
  | {
      mode: "reuse-pattern";
      componentPatternId: string;
      variant?: string;
    }
  | {
      mode: "propose-pattern";
      proposedComponentPatternId: string; // proposedComponentPatterns[].id와 매칭
      variant?: string;
    }
  | {
      mode: "report-gap";
      gapReportId: string;          // gapReports[].id와 매칭
    };

interface LayoutPatternDraft {
  layoutPatternId: string;
  variant?: string;
  reasons: string[];
  confidence: "high" | "medium" | "low";
}

interface DesignReference {
  document:
    | "COMPOSITION_LAYERS.md"
    | "DESIGN_FOUNDATION.md"
    | "LAYOUT_SPACING_CONTRACT.md"
    | "SECTION_PATTERNS.md"
    | "SCREEN_PATTERN_SUMMARY.md"
    | "COMPONENT_INVENTORY.md"
    | "INTERACTION_PATTERNS.md"
    | "VISUAL_FOUNDATION_OBSERVATIONS.md";
  section?: string;
  reason: string;
}

interface CompositionWarning {
  sourceRef?: CompositionDecision["sourceRef"];
  message: string;
}
```

**Schema B 불변 조건**:
- `CompositionDecision.mode`와 `selection.mode`는 반드시 같아야 한다.
- 모든 `sourceRef.areaId`는 Schema A의 area를 참조해야 한다.
- 모든 `sourceRefs[]`는 Schema A의 screen/area/component row 또는 synthetic 근거를 추적할 수 있어야 한다.
- 모든 `target.areaId`는 Schema B `areas[].areaId` 중 하나여야 한다.
- `compositionAction`이 `merge-source-areas`이면 area `sourceRefs[]`가 2개 이상이어야 한다.
- `compositionAction`이 `split-source-area`이면 같은 source area를 참조하는 Schema B area가 2개 이상이어야 한다.
- `compositionAction`이 `synthesize-supporting-area`이면 `synthetic.reason`과 `synthetic.basedOnSourceRefs[]`가 필수다.
- `reuse-primitive`는 catalog primitive만 참조한다.
- `reuse-pattern`은 registered/proposed componentPattern만 참조한다.
- `propose-pattern`은 `proposedComponentPatterns[].id`를 반드시 참조한다.
- `report-gap`은 `gapReports[].id`를 반드시 참조한다.
- screen과 모든 area는 `layoutPatternDraft`를 가져야 한다.
- 모든 `layoutPatternDraft`는 `layoutPatternStore`에 존재하는 layoutPattern과 variant를 참조해야 한다.
- `screen.archetype`은 deterministic Archetype Scaffold Resolver 결과와 일치해야 한다.
- `screen.completeness`는 scaffold의 `requiredBlocks`를 각각 present/synthetic/missing/omitted 중 하나로 설명해야 한다.
- `syntheticBlocks`는 scaffold의 `allowedSyntheticBlocks` 범위 안에서만 사용한다. 비즈니스 사실은 synthetic으로 만들지 않고 `missingBlocks` 또는 `gapReports`로 남긴다.
- screen과 모든 area의 design 판단에는 `designRefs[]`를 남긴다.
- decision의 `designRefs[]`는 high emphasis, area 재구성/합성 근거, decision-level `layoutPatternDraft`, 또는 판단이 모호한 경우에만 필수다.
- Schema B는 Schema A의 원문 필드를 덮어쓰지 않는다. 정규화된 의사결정만 추가한다.

---

## 4. Schema C — ComponentPattern Object

`proposed`와 `registered` 동일한 모양. `status` 필드만 다름.

```ts
interface ComponentPattern {
  id: string;                      // kebab-case, 예: "card-product-summary"
  name: string;                    // 사람 읽는 이름
  status: "registered" | "proposed";
  version: string;                 // semver

  // 사용처 의미
  intent: string;                  // 한 줄: "상품 핵심 요약을 카드로 표시"
  rationale: string;               // PRDD 인용 포함 자세한 설명

  // 외부 인터페이스 (재사용 가능하게)
  props: ComponentPatternProp[];
  slots: ComponentPatternSlot[];    // 자식 컴포넌트가 들어갈 자리
  variants: ComponentPatternVariant[]; // variantTokens 포함

  // 내부 구조
  composition: ComponentPatternNode; // root node (DAG)

  // 토큰 사용처
  tokensUsed: TokenUsage[];        // TokenRole 매핑

  // AI 저작 메타
  proposedBy?: {
    by: "llm";
    model: string;
    screen: string;                // 처음 제안된 화면
    timestamp: string;
  };
  promotedFrom?: string;           // proposed → registered 승격 시 원본 id
  usedInScreens?: string[];        // 사용 통계 (승격 후보 판단)
}

interface ComponentPatternProp {
  name: string;
  contract: ComponentPropContract; // @cx/types 재사용
  required: boolean;
  description: string;
}

interface ComponentPatternSlot {
  name: string;                    // "actions", "media"
  accepts: "primitive" | "componentPattern" | "any";
  cardinality: "one" | "many";
  description: string;
}

interface ComponentPatternVariant {
  name: string;
  variantTokens: Record<string, string>;  // 기존 variantTokens 계약 준수
  description: string;
}

interface ComponentPatternNode {
  kind: "primitive" | "componentPattern" | "slot";
  ref?: string;                    // primitiveId 또는 componentPatternId
  slotName?: string;               // kind === "slot"일 때
  props?: Record<string, unknown>; // 정적/바인딩
  children?: ComponentPatternNode[];
}

interface TokenUsage {
  path: string;                    // "root.background"
  role: TokenRole;                 // @cx/types
  tokenRef: string;                // "color.surface.primary"
}
```

**제약**:
- `composition` 내부 모든 `kind: "primitive"` 노드의 `ref`는 **카탈로그에 존재하는 primitiveId**여야 한다. 위반 시 hard error.
- `kind: "componentPattern"`은 **registered componentPattern만** 참조 가능하다. proposed componentPattern이 다른 proposed componentPattern을 참조하는 것은 v1에서 금지한다.
- componentPattern 참조 그래프는 **순환 금지** (DAG).
- 깊이 제한: TBD (5단 정도가 안전).

**결정 ②**: 중복 제안 방지는 v1에서 `compositionDigest` + normalized `intent` 문자열 유사도 기준으로 시작한다. exact digest match는 hard duplicate로 reject하고, intent 유사도는 review warning으로 남긴다. embedding 기반 dedupe는 후속 고도화로 둔다.

**결정 ③**: v1에서는 proposed componentPattern → proposed componentPattern 참조를 금지한다. proposed는 primitives와 registered componentPatterns만 조합할 수 있다. 이유는 큐레이션 단위를 단일 드래프트로 유지하고, 하나의 proposed가 reject될 때 의존 proposed들을 연쇄 정리해야 하는 상황을 피하기 위함이다.

---

## 5. Schema D — Gap Report

primitive가 부족할 때 AI가 인간에게 넘기는 작업 지시서.

```ts
interface GapReport {
  id: string;                      // 자동 생성
  kind: "gap-report";
  status: "open" | "in-progress" | "resolved" | "rejected";

  // 발견 맥락
  detectedIn: {
    screen: string;                // 화면 ID
    areaId: string;
    componentRow: number;          // PRDD 컴포넌트 상세 표의 row no.
  };

  // 무엇이 표현 안 되는가
  prddEvidence: {
    intent: string;                // PRDD 컴포넌트 설명/비고에서 발췌
    displayText: string;           // 표시 텍스트 컬럼
    bindings: Binding[];
    policyCitations: string[];     // 비고의 정책 인용
  };

  // 왜 기존 primitive로 안 되는지
  consideredPrimitives: Array<{
    primitiveId: string;
    rejectReason: string;          // "표시 슬롯 3개, 5개 필요" 같은 구체적 이유
  }>;
  consideredComponentPatterns: Array<{
    componentPatternId: string;
    rejectReason: string;
  }>;

  // 제안 (참고용, 인간이 확정)
  suggestedPrimitive: {
    name: string;                  // 예: "CardProductHero"
    description: string;
    props: Array<{
      name: string;
      contractHint: string;        // 자연어. ComponentPropContract는 인간이 확정
      required: boolean;
    }>;
    variantsHint: string[];
    tokensUsedHint: string[];
  };

  // 인간 작업자가 채움
  resolution?: {
    resolvedBy: string;
    resolvedAt: string;
    primitiveId: string;           // 실제 등록된 primitive id (이름 다를 수 있음)
    notes: string;
  };
}
```

**중요**: `suggestedPrimitive`는 *제안*. 인간이 contract를 확정. AI가 짠 contract를 그대로 등록하지 않는다.

---

## 6. Build-time Decks

LLM Composer가 호출 시점에 받는 catalog/design/layoutPatternStore deck은 **빌드 타임에 미리 생성**한다.

### 6.1 위치

```
database/catalog/generated/catalog-deck.json   ← 빌드 산출물
database/catalog/generated/design-deck.json
database/catalog/generated/layout-pattern-store-deck.json
```

`database/tables`는 승인된 소비 데이터, `database/ai-imports`는 AI 생성 후보 산출물이다. deck은 둘 중 어느 쪽도 아니므로 generated reference 위치에 둔다.

### 6.2 구조

```ts
interface CatalogDeck {
  builtAt: string;
  version: string;

  primitives: PrimitiveCard[];     // 설계 1: 별도 섹션
  componentPatterns: {
    registered: ComponentPatternCard[];
    proposed: ComponentPatternCard[]; // proposed도 노출 (재사용 + 중복 제안 방지)
  };
}

interface DesignDeck {
  builtAt: string;
  version: string;
  documents: DesignDocumentCard[];
}

interface DesignDocumentCard {
  id: DesignReference["document"];
  title: string;
  responsibility: string;
  rules: Array<{
    id: string;
    section?: string;
    summary: string;
    appliesTo: Array<"screen" | "area" | "componentPattern" | "interaction" | "layoutPattern">;
  }>;
}

interface PrimitiveCard {
  id: string;
  name: string;
  description: string;
  props: ComponentPropContract[];
  variants: string[];
  tokensExpected: TokenRole[];
  exampleUsage: string;            // 짧은 예시
}

interface ComponentPatternCard {
  id: string;
  name: string;
  status: "registered" | "proposed";
  intent: string;                  // 한 줄
  rationale: string;
  props: ComponentPatternProp[];
  slots: ComponentPatternSlot[];
  variants: ComponentPatternVariant[];
  // composition은 카드덱엔 안 넣음 (LLM이 사용만 함, 내부구조 노출 불요)
  // 단, propose 시 중복 방지를 위해 compositionDigest는 포함
  compositionDigest: string;
}
```

### 6.3 빌드 트리거

- `@cx/components/catalog` 변경 시 → primitives 재생성
- `component-patterns/registered/*` 변경 시 → componentPatterns.registered 재생성
- `component-patterns/proposed/*` 변경 시 → componentPatterns.proposed 재생성
- `docs/design/*.md` 변경 시 → design deck 재생성
- `database/pattern-store/*.json` 변경 시 → layoutPatternStore deck 재생성
- pre-commit 또는 dev server start hook에서 자동

**결정 ④**: generated deck은 `database/catalog/generated/`에 둔다. Compose는 `catalog-deck.json`, `design-deck.json`, `layout-pattern-store-deck.json`을 함께 입력받는다.

---

## 7. Validator 규칙 (요약)

두 게이트 모두 결과는 `{ok, issues, data?}` shape (기존 메모리 룰).

### 7.1 Validator #1 — Compose 직후

| 검사 | 규칙 | 위반 시 |
|---|---|---|
| primitive 존재 | `reuse-primitive`의 `primitiveId` ∈ catalog.primitives | hard error |
| primitive variant | `variant` ∈ primitive의 variants 목록 | hard error |
| prop contract | props가 ComponentPropContract 충족 | hard error |
| TokenRole | 색·간격·타이포가 TokenRole로 전달됨 (raw 값 금지) | hard error |
| componentPattern 존재 | `reuse-pattern`의 `componentPatternId` ∈ catalog.componentPatterns (registered ∪ proposed) | hard error |
| propose 내부 | `proposedComponentPatterns[].composition`의 primitive 잎이 전부 catalog.primitives | hard error (gap-report로 우회) |
| propose 완전성 | props·slots·variants·tokensUsed·rationale 5종 세트 | hard error |
| proposed 참조 범위 | proposed componentPattern composition은 primitives와 registered componentPatterns만 참조 | hard error |
| decision/source 정합성 | `sourceRef`가 Schema A에 존재하고 `target.areaId`가 Schema B areas에 존재 | hard error |
| multi-source 추적성 | area/decision의 `sourceRefs[]`가 비어있지 않고 Schema A 원천 또는 synthetic 근거를 추적 가능 | hard error |
| area 재구성 규칙 | `merge-source-areas`/`split-source-area`/`synthesize-supporting-area`의 sourceRefs·synthetic 조건 충족 | hard error |
| screen strategy | `screen.strategy`가 enum 값이고 area role/visualIntent와 충돌하지 않음 | hard error |
| visual hierarchy | area `visualIntent`와 decision `emphasis`가 존재 | hard error |
| mode union 정합성 | `CompositionDecision.mode`와 `selection.mode`가 일치 | hard error |
| proposed 참조 | `propose-pattern.proposedComponentPatternId`가 `proposedComponentPatterns[].id`에 존재 | hard error |
| gap 참조 | `report-gap.gapReportId`가 `gapReports[].id`에 존재 | hard error |
| 순환 | componentPattern 참조 그래프가 DAG | hard error |
| Resolver 룰 | variant는 variant 단위에서 한 번만 resolve | hard error |
| layoutPattern draft 필수 | screen과 모든 area에 `layoutPatternDraft` 존재 | hard error |
| layoutPattern draft 정합성 | `layoutPatternDraft.layoutPatternId` ∈ layoutPatternStore, `variant` ∈ 해당 variants, node kind 호환 | hard error |
| design reference (screen/area) | `CompositionScreen.designRefs` / `CompositionArea.designRefs`가 비어있지 않음 | hard error |
| design reference (decision) | `CompositionDecision.designRefs`는 타입상 optional. Validator는 검사하지 않음 (LLM이 필요할 때만 첨부) | — |
| gap-report 완전성 | `report-gap` mode인 경우 prddEvidence·consideredPrimitives·consideredComponentPatterns·suggestedPrimitive 4종 세트 | hard error |

### 7.2 Validator #2 — Decorate 직후

| 검사 | 규칙 | 위반 시 |
|---|---|---|
| layoutPattern 존재 | `layoutPattern.id` ∈ layoutPatternStore | hard error |
| layout variant | `layoutPattern.variant` ∈ 해당 layoutPattern의 variants | hard error |
| 노드 호환성 | layoutPattern이 적용 가능한 노드 종류(screen/area/group) 매치 | hard error |
| 트리 불변 | composed.json의 노드 구조·props·bindings가 변경되지 않음 | hard error (Compose 영역 침범) |
| reasons 필수 | 각 layoutPattern verification에 `reasons[]`가 비어있지 않음 | hard error |
| draft 변경 시 사유 필수 | Compose `layoutPatternDraft`를 **변경한 경우**(layoutPatternId 또는 variant) 다음 3종 세트 필수: 원 draft 보존, `reasons[]`에 변경 사유, `designRefs[]`에 `docs/design/` 근거. **변경 자체는 허용**. 누락만 위반. | hard error |
| Resolver 룰 | variant 캐시 정합 | hard error |

---

## 8. 운영 결정 사항

본문의 ①~④와 함께 아래 운영 기본값을 따른다.

- ⑤ **propose-pattern 승격 기준**: 사용 횟수는 후보 신호일 뿐이다. registered 승격은 Design Review 또는 인간 reviewer의 명시 승인 후에만 가능하다.
- ⑥ **gap-report 큐 위치**: gap report는 `database/ai-imports/gap-reports/{screenId}/{gapReportId}.json` 단위 파일로 둔다. jsonl 누적은 상태 전이와 개별 resolution 추적이 어려워 v1에서 쓰지 않는다.
- ⑦ **LLM 호출 단위**: 기본 호출은 화면 단위 1회다. Validator 재시도만 위반 decision/node 범위로 좁힌다. area 단위 최초 호출은 화면 전체 의도 손실 위험 때문에 기본값으로 쓰지 않는다.
- ⑧ **재시도 루프 한도**: Validator gate별 좁은 재시도는 최대 2회다. 2회 후에도 hard error가 남으면 산출물을 실패 상태로 저장하고 issue report를 남긴다.
- ⑨ **Schema B area role enum 확장 기준**: 새 role은 3개 이상 화면에서 반복되거나, 기존 role로 넣었을 때 Validator/Design Review 규칙이 모호해질 때만 추가한다. 그 전에는 `supporting`과 `intent`로 흡수한다.
- ⑩ **area 재구성 권한**: Compose는 PRDD source area를 merge/split하거나 supporting area를 합성할 수 있다. 단 모든 재구성은 `compositionAction`, `sourceRefs[]`, `synthetic.reason`, `designRefs[]`로 추적되어야 하며, 원본 PRDD row를 삭제한 것으로 취급하지 않는다.

---

## 9. 다음 단계

이 문서가 잠긴 뒤에는 스키마를 먼저 고정하고, 그 다음 Validator를 붙인다. Validator는 Schema B/D의 실제 출력 계약을 검증해야 하므로 타입보다 앞설 수 없다.

1. `@cx/types`에 Schema A·B·C·D 타입 추가
2. catalog/design/layoutPatternStore deck 빌드 스크립트 (§6)
3. **Contract Validator 모듈** (1급 게이트, 두 인스턴스 공통)
   - Schema 위반을 `ValidationIssue`로
   - 위반 노드 범위로 좁힌 재시도 인터페이스 노출
   - 기존 Register/Compose-AI 출력에 먼저 붙여 회귀 안전망부터 확보
4. **Compose LLM #1** — Schema A를 입력으로 semantic composition decision 생성
   - 화면 단위 호출
   - 입력은 Schema A(PRDD Screen Record) + catalog/design/layoutPatternStore deck
   - 출력은 Schema B composed.json + Schema C 드래프트 + Schema D(gap)
   - Validator #1이 즉시 검수
5. **Decorate를 LLM 기반으로 (LLM #2)** — Compose layoutPattern draft를 검증·보정
   - Validator #2가 즉시 검수
   - escape hatch: 비용·지연이 운영 부담이 되면 결정론적 룰 기반 Decorator로 우회 가능하게 둠
6. design-review에 proposed componentPattern 큐레이션 + gap report 큐 뷰
