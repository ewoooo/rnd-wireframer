# @cx/agent 작업 지침

## 패키지 책임

`packages/agent`는 AI가 만든 결과를 바로 신뢰하지 않고, 코드가 정규화하고 검증 가능한 구조로 넘기는 중간 계층이다.

담당 범위는 5단계 파이프라인으로 분리한다. 각 단계의 한 줄 정의:

- **Register**: Parse user input into canonical `RegisteredNodeTree`. (구조 추출: route/variant/screen/area/component 골격, 참조 해소, 누락 warning)
- **Composer**: Place props, hooks and data binding candidates into `ComposedNodeTree`. (콘텐츠 채움: label, title, placeholder, helperText, hook)
- **Decorator**: Match content layout patterns from pattern-store into `DecoratedNodeTree`. (콘텐츠/OGN pattern 매칭, layout recipe 결정)
- **Design Review**: Review decorated tree with `docs/design/` references and apply limited patch operations. (CTA 승격, pattern 보정, 새 component/composite 제안, display 보정)
- **DB transformer**: Materialize reviewed decorator decisions and content into `database/tables` row shape.

```text
md (client-imports)
  -> [Register]   GeneratedNodeTree 생성 + RegisteredNodeTree 정규화 + raw 셀 보존
  -> [Composer]   RegisteredNodeTree → ComposedNodeTree, raw → props/hooks 매핑 (markdown 직접 안 읽음)
  -> [Decorator]  ComposedNodeTree → DecoratedNodeTree, pattern-store 조회 후 layout pattern 메타 부착
  -> [Review]     DecoratedNodeTree → DesignReview patch → ReviewedDecoratedNodeTree 생성
  -> [DB]         ReviewedDecoratedNodeTree → MaterializedNodeTree 생성
```

**단계 내부는 두 패스로 구성한다**: (1) deterministic 매핑 → (2) Agent SDK AI 검수. (1)이 빠르고 비용 0인 안전한 기본값을 만들고, (2)가 (1)이 놓친 부분을 보강한다. (1) 산출물이 (2)의 입력이자 평가 기준이 된다. Decorator는 현재 rule-based resolver를 운용하고, Design Review AI는 `docs/design/` 근거 문서가 붙은 제한 operation patch만 제안한다.

**외부 의존 경계**: markdown 파싱은 오직 Register에서만 일어난다. Composer는 Register가 박은 `component.raw`와 `@cx/renderer`의 `component-catalog`만 읽는다. Screen 설명은 정규 `screen.description` 필드에 둔다.

세부 책임:

- AI import bundle 등록과 정렬
- route / variant / screen / area / component 참조 해소
- 누락 참조 warning 생성
- component props/hooks 합성 (deterministic 추출 + AI 보강)
- pattern decoration (콘텐츠/OGN 레이아웃 한정)
- design review patch 생성/적용 (디자인 문서 근거 필수)
- `database/tables` 계약에 가까운 table row 변환
- Agent SDK 실행을 위한 얇은 adapter

담당하지 않는 범위:

- React 렌더링
- `@cx/renderer` schema validation 소유권
- `@cx/layout` chrome/spacing 구현
- 원본 JSON의 파괴적 수정
- DB 쓰기 side effect

## 디렉토리 구조

```text
packages/agent/
  AGENTS.md
  README.md
  package.json
  src/
    __tests__/
      agent.test.ts
      compose-assets.test.ts
      compose-assets-ai.test.ts
    compose/
      compose-assets.ts
      compose-assets-ai.ts
    database/
      register-assets-to-database-tables.ts
    decorate/
      decorate-assets.ts
    design-review/
      apply-design-review.ts
      design-review-schema.ts
      review-design-tree.ts
      index.ts
    index.ts
    pattern/
      pattern-resolver.ts
      pattern-schema.ts
      pattern-store.ts
    register/
      claude-asset-generator.ts
      register-assets.ts
    runtime/
      agent-sdk-runtime.ts
    types.ts
```

## 파일별 기준

| 경로 | 기준 |
|---|---|
| `runtime/agent-sdk-runtime.ts` | Agent SDK 의존성을 감싸는 최소 runtime adapter만 둔다. 역할별 prompt와 output schema는 별도 파일로 분리한다. |
| `register/claude-asset-generator.ts` *(Register 입력 어댑터)* | local Claude 호출은 서버/API 전용이다. markdown 표 셀은 `component.raw`에 박고, "이벤트" / "액션" / "액션 파라미터"는 `raw.hooks: NodeHook[]`로 구조화한다. 화면 설명은 `screen.description`에 둔다. 케이스 분기 표는 `variant.screens`의 개별 screen으로 materialize하며 `screen.raw`는 만들지 않는다. |
| `register/register-assets.ts` | **Register 단계.** 입력을 mutate하지 않고 order 정규화와 참조 warning만 수행한다. PRDD 입력의 `header`, `contents`, `bottom` slot 분류는 `register/register-prdd.ts`의 영역 번호 계약이 맡는다. `component.raw`는 그대로 보존한다. composite의 콘텐츠 props는 비어있을 수 있으며 Composer에서 채운다. |
| `compose/compose-assets.ts` | **Composer 단계.** Register 산출물의 `component.raw`를 읽어서 `component.props`와 `component.hooks`를 채운다 (markdown을 직접 읽지 않음). `routes`, `variants`, `screens`는 flat 배열과 `children` 참조로 풀고, Register가 만든 `header`, `contents`, `bottom` region 구조를 보존한다. composed 산출물에는 raw와 pending placeholder를 남기지 않는다. 스타일/layout/chrome은 다루지 않는다. |
| `compose/compose-assets-ai.ts` | Composer gap에 한정된 AI 보강만 수행한다. 레이아웃 pattern 선택이나 DB row materialize는 하지 않는다. |
| `decorate/decorate-assets.ts` | **Decorator 단계.** 콘텐츠/OGN 레이아웃 전담: pattern-store에서 content layout pattern 메타를 매칭한다. Screen shell, chrome, 콘텐츠 props는 손대지 않는다. pattern 추론은 교체 가능한 resolver로 유지한다. |
| `design-review/*` | **Design Review 단계.** `DecoratedNodeTree` 이후 디자인 품질을 검수한다. `moveComponent`, `updatePattern`, `createNewPattern`, `createComponent`, `createComposite`, `setDisplay`, `updateComponentProps` 같은 제한 operation만 허용하고, 모든 finding/operation은 `docs/design/`의 책임 문서를 `designReferences`로 인용해야 한다. 판단값은 `design-review-contracts.ts`와 `@cx/pattern-store`에 둔다. 전체 tree 재생성이나 RenderTree 직접 생성은 하지 않는다. |
| `pattern/*` | `@cx/types` pattern schema 호환 re-export, `@cx/pattern-store` store re-export, agent 전용 resolver를 둔다. pattern은 children 배치 layout preset이며 screen shell 분류가 아니다. |
| `database/register-assets-to-database-tables.ts` | **DB transformer 단계.** reviewed `DecoratedNodeTree`를 `MaterializedNodeTree` row로 materialize한다. Screen shell과 regions.children은 코드 계약으로 생성한다. 새 decoration 결정이나 새 콘텐츠 합성은 하지 않는다. |
| `types.ts` | 외부 패키지가 import하는 `GeneratedNodeTree`, `RegisteredNodeTree`, `ComposedNodeTree`, `DecoratedNodeTree`, `NodeHook` 계약 타입을 둔다. |
| `index.ts` | 브라우저 번들에서도 안전한 deterministic 공개 surface만 모은다. Agent SDK나 로컬 Claude처럼 Node.js 전용 의존성을 가진 파일은 루트에서 export하지 않고 subpath export로만 사용한다. |

## 변경 원칙

- 수급 원본 JSON, mock 입력 JSON, `database/tables` 파일을 이 패키지 함수 안에서 직접 수정하지 않는다.
- 새 기능은 가능하면 순수 함수로 시작하고, side effect는 adapter 파일로 격리한다.
- AI가 만든 결과는 항상 deterministic 함수와 renderer validation을 통과하는 후속 흐름을 전제로 한다.
- `useMemo`와 `useCallback`은 이 패키지에서 사용할 일이 없다. React 의존성을 추가하지 않는다.
- Agent SDK의 모델명, 세션 재개, fallback 정책은 하드코딩을 피하고 후속 runner 옵션으로 분리한다.
- Design Review의 CTA 판정, operation dispatch, placement 처리, synthetic area 생성 규칙은 코드 내부 조건문이 아니라 contract table과 pattern-store reference로 표현한다.
- decorator/resolver는 variant 단위로 결정한다. 1 variant = 메인 화면 1 + 엣지 화면 N이고 엣지는 메인의 상태 변형이라 동일 layout pattern을 공유한다. screen마다 resolver를 다시 호출하면 동일한 결정을 N+1번 반복하게 되고, AI fallback이 붙으면 비용이 5배까지 늘어난다. 엣지가 메인과 다른 pattern을 써야 하는 케이스가 생기면 그 시점에 예외 정책을 추가한다.
- 단계 책임을 섞지 않는다. "콘텐츠인가 스타일인가"가 1차 분기 기준이다. Composer는 props 값만, Decorator는 pattern-store 기반 layout recipe를 다룬다. Design Review는 문서 근거가 필요한 디자인 품질 patch만 다루고, 콘텐츠 합성에는 Composer 쪽 AI 보강을 사용한다.
- 앱 클라이언트 컴포넌트가 `@cx/agent` 루트를 import할 수 있으므로, 루트 export에는 `node:*`, `fs`, `async_hooks`, Agent SDK 같은 Node 전용 의존성이 흘러들지 않게 한다.

## 완료 기준

- `npm test -- --run packages/agent`
- `npx tsc --noEmit --incremental false`
- `npx biome check packages/agent`
- 기능이나 계약이 바뀌면 이 README와 루트 `AGENTS_HISTORY.md`를 함께 갱신한다.
