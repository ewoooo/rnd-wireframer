# @cx/agent 작업 지침

## 패키지 책임

`packages/agent`는 원천 입력을 승인 전 `database/tables` shape 후보로 만들고, renderer/quality report/promote 경계로 넘기는 중간 계층이다.

기본 active path는 아래 하나다.

```text
source
  -> [Register]       PRDD/read model을 source record와 invariant report로 정규화
  -> [DraftTables]    database/tables shape의 승인 전 후보 생성
  -> [QualityReport]  validation issue를 MVP quality category로 접음
  -> [Preview]        @cx/renderer가 RenderTree projection/validation/render 담당
  -> [Promote]        승인된 후보만 database/tables로 반영
```

기존 `GeneratedNodeTree -> RegisteredNodeTree -> ComposedNodeTree -> DecoratedNodeTree -> DesignReview -> MaterializedNodeTree` 흐름은 legacy/experimental subpath다. 신규 active path의 필수 의존성으로 추가하지 않는다.

**외부 의존 경계**: markdown 파싱은 오직 Register에서만 일어난다. DraftTables 이후에는 `database/tables` shape와 renderer validation/quality report 계약만 본다. 화면 렌더링과 RenderTree validation 소유권은 `@cx/renderer`에 있다.

세부 책임:

- source register와 invariant report 생성
- DraftTablesBundle 생성
- quality report 생성
- promote/import 후보 검증
- legacy/experimental pipeline의 subpath 호환 유지
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
      quality-report.test.ts
      prdd-pipeline.test.ts
    pipeline/
      draft-tables-pipeline.ts
      prdd-draft-tables.ts
      experimental.ts
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
| `pipeline/draft-tables-pipeline.ts` | **Active path.** source register, DraftTables 생성, optional QualityReport 생성을 오케스트레이션한다. compose/decorate/design-review를 import하지 않는다. |
| `pipeline/prdd-draft-tables.ts` | **Active-support.** PRDD register 결과를 deterministic DraftTablesBundle로 만든다. 향후 direct-to-tables LLM generator가 붙어도 같은 DraftTables 계약을 반환해야 한다. |
| `validate/quality-report.ts` | **Active path.** detailed validation issue를 사용자-facing quality category로 접는다. original code는 개발 로그/추적용으로만 유지한다. |
| `register/claude-asset-generator.ts` *(Register 입력 어댑터)* | local Claude 호출은 서버/API 전용이다. markdown 표 셀은 `component.raw`에 박고, "이벤트" / "액션" / "액션 파라미터"는 `raw.hooks: NodeHook[]`로 구조화한다. 화면 설명은 `screen.description`에 둔다. 케이스 분기 표는 `variant.screens`의 개별 screen으로 materialize하며 `screen.raw`는 만들지 않는다. |
| `register/register-assets.ts` | **Legacy.** `GeneratedNodeTree` 계열 입력을 정규화한다. 신규 active path에서 import하지 않는다. |
| `compose/*`, `decorate/*`, `design-review/*` | **Legacy/experimental.** 화면 품질 문제가 반복될 때 명시 subpath로만 사용한다. active path barrel에 추가하지 않는다. |
| `database/register-assets-to-database-tables.ts`, `database/materialize-composition.ts` | **Legacy/experimental materializer.** active path의 기본 변환 경로가 아니다. |
| `types.ts` | legacy NodeTree 타입과 agent-local 타입을 둔다. 공유 active 계약은 `@cx/types`를 우선한다. |
| `index.ts` | active path 공개 surface만 모은다. Agent SDK, local Claude, legacy/experimental pipeline은 루트에서 export하지 않는다. |

## 변경 원칙

- 수급 원본 JSON, mock 입력 JSON, `database/tables` 파일을 이 패키지 함수 안에서 직접 수정하지 않는다.
- 새 기능은 가능하면 순수 함수로 시작하고, side effect는 adapter 파일로 격리한다.
- AI가 만든 결과는 항상 deterministic 함수와 renderer validation을 통과하는 후속 흐름을 전제로 한다.
- `useMemo`와 `useCallback`은 이 패키지에서 사용할 일이 없다. React 의존성을 추가하지 않는다.
- Agent SDK의 모델명, 세션 재개, fallback 정책은 하드코딩을 피하고 후속 runner 옵션으로 분리한다.
- active path에서 `composition-output`, `decorated-output`, `compose-screen`, `decorate-screen`, `design-review`를 import하지 않는다. `pnpm run lint:agent-boundary`로 강제한다.
- Design Review의 CTA 판정, operation dispatch, placement 처리, synthetic area 생성 규칙은 코드 내부 조건문이 아니라 contract table과 pattern-store reference로 표현한다.
- decorator/resolver는 variant 단위로 결정한다. 1 variant = 메인 화면 1 + 엣지 화면 N이고 엣지는 메인의 상태 변형이라 동일 layout pattern을 공유한다. screen마다 resolver를 다시 호출하면 동일한 결정을 N+1번 반복하게 되고, AI fallback이 붙으면 비용이 5배까지 늘어난다. 엣지가 메인과 다른 pattern을 써야 하는 케이스가 생기면 그 시점에 예외 정책을 추가한다.
- `deck/*`는 LLM prompt packaging과 감사/재현 snapshot만 담당한다. validation rule은 기본적으로 `buildDefaultValidatorContext()`를 통해 `@cx/components/catalog`, `@cx/pattern-store`, `docs/design`, `@cx/types` SSOT를 직접 조회하고, deck 기반 context는 테스트/재현에서만 명시적으로 주입한다.
- 단계 책임을 섞지 않는다. "콘텐츠인가 스타일인가"가 1차 분기 기준이다. Composer는 props 값만, Decorator는 pattern-store 기반 layout recipe를 다룬다. Design Review는 문서 근거가 필요한 디자인 품질 patch만 다루고, 콘텐츠 합성에는 Composer 쪽 AI 보강을 사용한다.
- 앱 클라이언트 컴포넌트가 `@cx/agent` 루트를 import할 수 있으므로, 루트 export에는 `node:*`, `fs`, `async_hooks`, Agent SDK 같은 Node 전용 의존성이 흘러들지 않게 한다.

## 완료 기준

- `npm test -- --run packages/agent`
- `npx tsc --noEmit --incremental false`
- `npx biome check packages/agent`
- 기능이나 계약이 바뀌면 이 README와 루트 `AGENTS_HISTORY.md`를 함께 갱신한다.
