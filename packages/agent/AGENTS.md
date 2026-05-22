# @cx/agent 작업 지침

## 패키지 책임

`packages/agent`는 AI가 만든 결과를 바로 신뢰하지 않고, 코드가 정규화하고 검증 가능한 구조로 넘기는 중간 계층이다.

담당 범위는 4단계 파이프라인으로 분리한다. 각 단계의 한 줄 정의:

- **Register**: Parse user input into canonical data structure. (구조 추출: composite/organism/screen 골격, 참조 해소, 누락 warning)
- **Composer**: Place props, placeholders and data bindings. (콘텐츠 채움: label, title, placeholder, helperText, binding)
- **Decorator**: Match content layout patterns from pattern-store. (콘텐츠/OGN patternId 매칭, layout recipe 결정)
- **DB transformer**: Materialize decorator decisions and content into `database/tables` row shape.

```text
md (client-imports)
  -> [Register]   markdown 파싱 + 골격 정규화 + raw 셀 보존
  -> [Composer]   raw → props/placeholders/bindings 매핑 (markdown 직접 안 읽음)
  -> [Decorator]  pattern-store 조회 후 content layout patternId/recipe 결정 메타 박음
  -> [DB]         결정 메타 materialize + database/tables row 생성
```

**단계 내부는 두 패스로 구성한다**: (1) deterministic 매핑 → (2) Agent SDK AI 검수. (1)이 빠르고 비용 0인 안전한 기본값을 만들고, (2)가 (1)이 놓친 부분을 보강한다. (1) 산출물이 (2)의 입력이자 평가 기준이 된다. Decorator의 (2) 패스는 marketplace(Vendor↔Consumer) 협상으로 진행할 예정 (설계 진행 중, 현재는 rule-based resolver만 운용).

**외부 의존 경계**: markdown 파싱은 오직 Register에서만 일어난다. Composer는 Register가 박은 `component.raw`만 읽는다. Screen 설명은 정규 `screen.description` 필드에 둔다.

세부 책임:

- AI import bundle 등록과 정렬
- route / variant / screen / organism / component 참조 해소
- 누락 참조 warning 생성
- composite content props 합성 (deterministic 추출 + AI 보강)
- pattern decoration (콘텐츠/OGN 레이아웃 한정)
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
    index.ts
    pattern/
      pattern-resolver.ts
      pattern-schema.ts
      pattern-store.ts
    register/
      claude-asset-generator.ts
      register-assets.ts
      register-assets-to-tables.ts
    runtime/
      agent-sdk-runtime.ts
    types.ts
```

## 파일별 기준

| 경로 | 기준 |
|---|---|
| `runtime/agent-sdk-runtime.ts` | Agent SDK 의존성을 감싸는 최소 runtime adapter만 둔다. 역할별 prompt와 output schema는 별도 파일로 분리한다. |
| `register/claude-asset-generator.ts` *(Register 입력 어댑터)* | local Claude 호출은 서버/API 전용이다. markdown 표 셀은 `component.raw`에 verbatim으로 박고, 화면 설명은 `screen.description`에 둔다. 케이스 분기 표는 `variant.screens`의 개별 screen으로 materialize하며 `screen.raw`는 만들지 않는다. |
| `register/register-assets.ts` | **Register 단계.** 입력을 mutate하지 않고 order 정규화와 참조 warning만 수행한다. `component.raw`는 그대로 보존한다. composite의 콘텐츠 props는 비어있을 수 있으며 Composer에서 채운다. |
| `register/register-assets-to-tables.ts` | persistence를 수행하지 않고 row object만 반환한다. |
| `compose/compose-assets.ts` | **Composer 단계.** Register 산출물의 `component.raw`만 읽어서 `component.props`를 채운다 (markdown을 직접 읽지 않음). legacy `screen.raw`가 들어오면 `screen.description`으로 승격하고 raw 자체는 제거한다. 스타일/layout/chrome은 다루지 않는다. |
| `compose/compose-assets-ai.ts` | Composer gap에 한정된 AI 보강만 수행한다. 레이아웃 pattern 선택이나 DB row materialize는 하지 않는다. |
| `decorate/decorate-assets.ts` | **Decorator 단계.** 콘텐츠/OGN 레이아웃 전담: pattern-store에서 content layout patternId를 매칭한다. Screen shell, chrome, 콘텐츠 props는 손대지 않는다. pattern 추론은 교체 가능한 resolver로 유지한다. |
| `pattern/*` | pattern schema/store/resolver를 함께 둔다. pattern은 children 배치 layout preset이며 screen shell 분류가 아니다. |
| `database/register-assets-to-database-tables.ts` | **DB transformer 단계.** Decorator 결정 메타를 `database/tables/*.json` row로 materialize한다. Screen shell과 regions.children은 코드 계약으로 생성한다. 새 decoration 결정이나 새 콘텐츠 합성은 하지 않는다. |
| `types.ts` | 외부 패키지가 import하는 계약 타입을 둔다. |
| `index.ts` | 브라우저 번들에서도 안전한 deterministic 공개 surface만 모은다. Agent SDK나 로컬 Claude처럼 Node.js 전용 의존성을 가진 파일은 루트에서 export하지 않고 subpath export로만 사용한다. |

## 변경 원칙

- 수급 원본 JSON, mock 입력 JSON, `database/tables` 파일을 이 패키지 함수 안에서 직접 수정하지 않는다.
- 새 기능은 가능하면 순수 함수로 시작하고, side effect는 adapter 파일로 격리한다.
- AI가 만든 결과는 항상 deterministic 함수와 renderer validation을 통과하는 후속 흐름을 전제로 한다.
- `useMemo`와 `useCallback`은 이 패키지에서 사용할 일이 없다. React 의존성을 추가하지 않는다.
- Agent SDK의 모델명, 세션 재개, fallback 정책은 하드코딩을 피하고 후속 runner 옵션으로 분리한다.
- decorator/resolver는 variant 단위로 결정한다. 1 variant = 메인 화면 1 + 엣지 화면 N이고 엣지는 메인의 상태 변형이라 동일 layout pattern을 공유한다. screen마다 resolver를 다시 호출하면 동일한 결정을 N+1번 반복하게 되고, AI fallback이 붙으면 비용이 5배까지 늘어난다. 엣지가 메인과 다른 pattern을 써야 하는 케이스가 생기면 그 시점에 예외 정책을 추가한다.
- 단계 책임을 섞지 않는다. "콘텐츠인가 스타일인가"가 1차 분기 기준이다. Composer는 props 값만, Decorator는 시각 결정만 다룬다. Decorator의 AI fallback은 "visual pattern 선택"에만 사용하고, 콘텐츠 합성에는 Composer 쪽 AI 보강을 사용한다.
- 앱 클라이언트 컴포넌트가 `@cx/agent` 루트를 import할 수 있으므로, 루트 export에는 `node:*`, `fs`, `async_hooks`, Agent SDK 같은 Node 전용 의존성이 흘러들지 않게 한다.

## 완료 기준

- `npm test -- --run packages/agent`
- `npx tsc --noEmit --incremental false`
- `npx biome check packages/agent`
- 기능이나 계약이 바뀌면 이 README와 루트 `AGENTS_HISTORY.md`를 함께 갱신한다.
