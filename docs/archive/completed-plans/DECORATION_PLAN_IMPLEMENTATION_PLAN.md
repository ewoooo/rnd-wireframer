# Decoration Plan Implementation Plan

## 1. 문서 책임

이 문서는 SourceSpec을 최종 RenderTree로 생성하기 전에 사용자에게 노출될 화면 구조를 보강하는 `DecorationPlan` 단계의 구현 계획을 정의한다.

pipeline stage 순서와 side effect 경계는 [PIPELINE_STAGE_PROTOCOL.md](/Users/plusx/Documents/rnd-screen-generator/docs/development/PIPELINE_STAGE_PROTOCOL.md)를 따르고, 패키지 책임은 [PACKAGE_MAP.md](/Users/plusx/Documents/rnd-screen-generator/PACKAGE_MAP.md)를 따른다.

이 문서는 prompt 원문, validator 세부 구현, 컴포넌트 prop catalog 원문을 소유하지 않는다. 해당 내용은 각 패키지와 `packages/agent/docs/`에서 관리한다.

## 2. 배경

`NOVA-MBR-PG-001-0` 약관 동의 화면 smoke에서 다음 문제가 확인됐다.

- SourceSpec의 내부 섹션명인 `TermsSection`이 사용자 노출 stack title로 남았다.
- `약관 목록 조회`와 `약관 동의`가 별도 area로 분리되지 않고 하나의 `TermsSection` area로 합쳐졌다.
- `ListText` 약관 row가 실제 약관명 대신 기본값 `본문`으로 렌더링됐다.
- AI는 source skeleton 보존 지시를 강하게 따랐고, 약관 목록 row나 동의 영역을 디자인 패턴 기준으로 확장하지 않았다.

원인은 생성 과정에 "사용자 노출 구조로 장식하는 단계"가 명시 계약으로 존재하지 않았기 때문이다. 현재는 SourceSpec, screen intent, composition plan, pattern selection, generation prompt 사이에서 이 책임이 암묵적으로 섞여 있다.

## 3. 목표

- 내부 source id/name을 사용자 노출 title로 사용하지 않는다.
- SourceSpec의 원본 구조와 사용자 노출 구조를 분리한다.
- 약관처럼 목록 조회와 동의 controls가 함께 있는 section은 계약에 따라 area를 분리한다.
- 반복 템플릿과 예시가 있는 list row는 대표 row 후보로 구체화한다.
- layout 선택은 source name 추론보다 decoration role과 계약 테이블을 우선한다.
- AI가 임의로 추론한 것과 deterministic decoration 계약으로 결정한 것을 artifact에서 구분할 수 있게 한다.

## 4. 비목표

- 원본 Markdown 또는 수급 JSON을 수정하지 않는다.
- source에 없는 error state, accordion detail, 전체 동의 항목을 무조건 추가하지 않는다.
- 특정 source area 이름에 대한 hardcoded `switch`/`if` 체인을 추가하지 않는다.
- table projection을 generation 중간 단계로 되돌리지 않는다.

## 5. 제안 pipeline 흐름

현재 흐름:

```text
Markdown Source
-> SourceSpec
-> ScreenIntent
-> CompositionPlan
-> PatternSelection
-> RenderTree
-> Validation
```

제안 흐름:

```text
Markdown Source
-> SourceSpec
-> ScreenIntent
-> CompositionPlan
-> DecorationPlan
-> PatternSelection
-> RenderTree
-> Validation
```

`DecorationPlan`은 `@cx/orchestration`이 순수 helper로 조립하고, `@cx/pipeline`은 stage 실행과 artifact write만 담당한다.

## 6. DecorationPlan 계약 초안

`@cx/schema`에 generation 중간 산출물 DTO를 추가한다.

```ts
type DecorationPlan = {
  schemaVersion: "decoration-plan.v0.1";
  screenId: string;
  sourceScreenRef: string;
  displayRules: DecorationDisplayRules;
  areas: DecorationArea[];
  diagnostics?: DecorationDiagnostic[];
};

type DecorationDisplayRules = {
  hideInternalSourceNames: boolean;
};

type DecorationArea = {
  id: string;
  sourceAreaId: string;
  displayTitle: string;
  role: DecorationAreaRole;
  splitFrom?: string;
  componentRefs: string[];
  repeatedItems?: DecorationRepeatedItem[];
  layoutIntent?: DecorationLayoutIntent;
};

type DecorationAreaRole =
  | "navigation"
  | "content-list"
  | "agreement-controls"
  | "form"
  | "message"
  | "bottom-action";

type DecorationRepeatedItem = {
  sourceComponentRef: string;
  label: string;
  required?: boolean;
  propsHint?: Record<string, unknown>;
};

type DecorationLayoutIntent = {
  areaPatternRole:
    | "app-bar"
    | "list-stack"
    | "checkbox-stack"
    | "field-stack"
    | "message-stack"
    | "bottom-action";
};
```

`sourceAreaId`와 `splitFrom`은 provenance 추적용이며, `displayTitle`만 사용자 노출 title 후보로 사용한다.

## 7. Decoration contract table

문자열 literal 기반 분기를 피하기 위해 decoration 규칙은 계약 테이블로 둔다.

후보 위치:

```text
packages/orchestration/src/catalog/decoration-contracts.json
packages/orchestration/src/public/decoration-contracts.ts
```

초기 계약은 약관 동의 흐름을 대상으로 한다.

```json
{
  "termsAgreementFlow": {
    "match": {
      "componentTypesAny": ["ListText", "Checkbox"],
      "sourceKeywordsAny": ["약관", "동의"]
    },
    "areas": [
      {
        "role": "content-list",
        "displayTitle": "약관 목록 조회",
        "componentTypes": ["ListText"],
        "layoutIntent": "list-stack"
      },
      {
        "role": "agreement-controls",
        "displayTitle": "약관 동의",
        "componentTypes": ["Checkbox"],
        "layoutIntent": "checkbox-stack"
      }
    ]
  }
}
```

계약 테이블은 특정 `TermsSection` 이름이 아니라 component type, source keyword, 반복/필수 여부 같은 source 특성으로 match한다.

## 8. 구현 단계

### Phase 1. Schema 추가

- `@cx/schema`에 `DecorationPlan` DTO와 public export를 추가한다.
- schemaVersion은 artifact-local 버전인 `decoration-plan.v0.1`로 둔다.
- `sourceRef`와 사용자 노출 title을 분리하는 필드를 명확히 둔다.
- 예시 fixture와 schema public API test를 추가한다.

### Phase 2. Orchestration helper 추가

- `packages/orchestration/src/public/decoration-plan.ts`를 추가한다.
- SourceSpec, composition plan, decoration contract table을 입력으로 받아 `DecorationPlan`을 반환한다.
- helper는 파일 IO와 AI 실행을 하지 않는다.
- 내부 source name이 display title로 남는 경우 diagnostic을 만든다.

### Phase 3. 약관 split 계약 적용

`NOVA-MBR-PG-001-0` 기준으로 다음 결과를 목표로 한다.

```text
TermsSection
-> area: 약관 목록 조회
   - role: content-list
   - children: ListText based term rows
-> area: 약관 동의
   - role: agreement-controls
   - children: Checkbox based agreement controls
```

반복 row 생성 규칙:

- source에 `{약관명}` placeholder와 예시가 있으면 예시를 label 후보로 사용한다.
- required/optional 정보가 있으면 `[필수]`, `[선택]` prefix를 유지한다.
- source에 없는 `전체 약관 동의`, error message, accordion detail은 초기 구현에서 자동 추가하지 않는다.

### Phase 4. Generation input 연결

- `packages/orchestration/src/public/agent-inputs.ts`의 generation input에 `DecorationPlan`을 포함한다.
- prompt contract에는 다음 규칙을 추가한다.
  - visible title은 `DecorationPlan.displayTitle`을 우선한다.
  - source area name은 provenance로만 보존한다.
  - internal source id/name을 visible copy로 사용하지 않는다.
  - split area가 있으면 split 결과를 RenderTree area node로 만든다.
  - repeatedItems가 있으면 placeholder 대신 representative row를 사용한다.

### Phase 5. Pattern selection 연결

- `DecorationArea.role` 또는 `layoutIntent`를 area layout candidate selection의 우선 입력으로 사용한다.
- 초기 mapping은 contract table 조회로 표현한다.

```text
navigation -> layout.area.areaAppBar
content-list -> layout.area.listStack
agreement-controls -> layout.area.checkboxStack
form -> layout.area.fieldStack
message -> layout.area.messageStack
bottom-action -> layout.area.bottomActionArea
```

region layout은 계속 다음 세 가지 표준 rail만 사용한다.

```text
layout.region.header
layout.region.contents
layout.region.bottom
```

region rail은 padding, gap, safe-area를 소유하지 않는다.

### Phase 6. Validation gate 추가

`@cx/validation`에 다음 검증을 추가한다.

- 사용자 노출 title에 내부명 패턴이 있으면 실패 또는 P0 warning
  - 예: `TermsSection`, `ActionButtonSection`, `*Component`, `/Section$/`
- `ListText`의 dot/table row가 실제 렌더 prop 없이 기본값 `본문`으로 떨어질 가능성이 있으면 warning
- SourceSpec에서 list role과 checkbox role이 함께 확인됐는데 RenderTree area가 분리되지 않았으면 warning
- `minCount >= 2` 반복 계약이 있는데 representative row가 부족하면 warning

초기에는 warning으로 시작하고, smoke 안정화 후 failure gate로 승격한다.

### Phase 7. Pipeline artifact 추가

`@cx/pipeline`은 `DecorationPlan` stage 결과를 artifact로 저장한다.

예상 artifact:

```text
decoration-plan-input.json
decoration-plan.json
```

최종 run summary에는 다음을 포함한다.

- 적용된 decoration contract id
- split된 source area 목록
- internal visible title diagnostic 수
- representative row 생성 수

### Phase 8. Smoke와 table apply 재검증

대상:

```text
data/client-imports/{id}/260528_mbr/NOVA-MBR-PG-001-0.md
```

검증 기준:

- smoke generation validation warning 0 또는 허용 warning만 존재
- RenderTree에 `약관 목록 조회`, `약관 동의` area가 별도로 존재
- `TermsSection`이 visible title로 렌더링되지 않음
- 약관 list row가 `본문`이 아니라 실제 representative label로 렌더링됨
- table apply 후 `areas.json`에 decorated display title 저장
- `screen_regions` 계층에는 `layout.region.header`, `layout.region.contents`, `layout.region.bottom`만 사용
- region rail에는 padding/gap/safe-area가 없음

## 9. 테스트 계획

### Unit tests

- `@cx/schema`
  - `DecorationPlan` fixture schema validation
  - public export 확인
- `@cx/orchestration`
  - SourceSpec 약관 section이 두 decorated area로 split되는지
  - internal source name이 display title로 남지 않는지
  - representative row가 source 예시와 required/optional 정보를 반영하는지
- `@cx/validation`
  - internal visible title diagnostic
  - `ListText` dot prop mismatch diagnostic
  - list + checkbox mixed area split diagnostic
- `@cx/pipeline`
  - decoration artifact write
  - generation input에 decoration plan 포함

### Smoke tests

```bash
npm run smoke:pipeline -- \
  --target 'data/client-imports/{id}/260528_mbr/NOVA-MBR-PG-001-0.md' \
  --run-id 'NOVA-MBR-PG-001-0-decoration-plan-smoke' \
  --out-dir 'tmp/generation-runs/NOVA-MBR-PG-001-0-decoration-plan-smoke' \
  --use-ai
```

```bash
npm run smoke:apply-tables -- \
  --run-dir 'tmp/generation-runs/NOVA-MBR-PG-001-0-decoration-plan-smoke' \
  --module-id mbr \
  --write
```

## 10. 완료 기준

- `DecorationPlan` DTO가 `@cx/schema` public contract로 추가된다.
- `@cx/orchestration`에 deterministic decoration helper와 contract table이 추가된다.
- generation input이 `DecorationPlan`을 소비한다.
- pattern selection이 decoration role/layout intent를 우선한다.
- validation이 internal visible title과 약관 list prop mismatch를 감지한다.
- `NOVA-MBR-PG-001-0` smoke 결과에서 약관 목록과 약관 동의가 별도 area로 생성된다.
- table apply 후 current table RenderTree가 위 기준을 만족한다.
- 변경 이력이 `AGENTS_HISTORY.md`에 기록된다.

## 11. 열린 이슈

- `전체 약관 동의`를 source 없는 디자인 패턴 보강으로 허용할지 결정이 필요하다.
- accordion detail과 약관 조회 실패 message를 source 없는 state coverage 보강으로 허용할지 결정이 필요하다.
- decoration contract table을 JSON catalog로 둘지 TypeScript typed table로 둘지 확정이 필요하다.
- validation gate를 최초부터 failure로 둘지 warning으로 시작할지 smoke 결과를 보고 조정한다.
