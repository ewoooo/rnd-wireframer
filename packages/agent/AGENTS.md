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

기존 asset tree pipeline은 제거됐다. 신규 active path는 DraftTables 계약에만 붙인다.

**외부 의존 경계**: markdown 파싱은 오직 Register에서만 일어난다. DraftTables 이후에는 `database/tables` shape와 renderer validation/quality report 계약만 본다. 화면 렌더링과 RenderTree validation 소유권은 `@cx/renderer`에 있다.

세부 책임:

- source register와 invariant report 생성
- DraftTablesBundle 생성
- quality report 생성
- promote/import 후보 검증
- PRDD 내부 compose/decorate helper 유지

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
    compose/
      compose-prdd.ts
    database/
      prdd-to-database-tables.ts
      promote-database-tables.ts
    decorate/
      decorate-prdd.ts
    index.ts
    pattern/
      pattern-resolver.ts
    register/
      prdd-parser.ts
      prdd-record-builder.ts
      register-prdd-screen.ts
      register-prdd.ts
    types.ts
```

## 파일별 기준

| 경로 | 기준 |
|---|---|
| `pipeline/draft-tables-pipeline.ts` | **Active path.** source register, DraftTables 생성, optional QualityReport 생성을 오케스트레이션한다. compose/decorate/design-review를 import하지 않는다. |
| `pipeline/prdd-draft-tables.ts` | **Active-support.** PRDD register 결과를 deterministic DraftTablesBundle로 만든다. 향후 direct-to-tables LLM generator가 붙어도 같은 DraftTables 계약을 반환해야 한다. |
| `validate/quality-report.ts` | **Active path.** detailed validation issue를 사용자-facing quality category로 접는다. original code는 개발 로그/추적용으로만 유지한다. |
| `compose/compose-prdd.ts`, `decorate/decorate-prdd.ts` | **Active-support.** PRDD register 결과를 tables 생성 전 내부 구조로 정규화한다. |
| `database/prdd-to-database-tables.ts` | **Active-support.** decorated PRDD screen을 database table row로 변환한다. |
| `types.ts` | agent-local PRDD pipeline 타입을 둔다. 공유 active 계약은 `@cx/types`를 우선한다. |
| `index.ts` | active path 공개 surface만 모은다. local Claude, legacy/experimental pipeline은 루트에서 export하지 않는다. |

## 변경 원칙

- 수급 원본 JSON, mock 입력 JSON, `database/tables` 파일을 이 패키지 함수 안에서 직접 수정하지 않는다.
- 새 기능은 가능하면 순수 함수로 시작하고, side effect는 adapter 파일로 격리한다.
- AI가 만든 결과는 항상 deterministic 함수와 renderer validation을 통과하는 후속 흐름을 전제로 한다.
- `useMemo`와 `useCallback`은 이 패키지에서 사용할 일이 없다. React 의존성을 추가하지 않는다.
- AI runner의 모델명, 세션 재개, fallback 정책은 하드코딩을 피하고 후속 runner 옵션으로 분리한다.
- decorator/resolver는 variant 단위로 결정한다. 1 variant = 메인 화면 1 + 엣지 화면 N이고 엣지는 메인의 상태 변형이라 동일 layout pattern을 공유한다. screen마다 resolver를 다시 호출하면 동일한 결정을 N+1번 반복하게 되고, AI fallback이 붙으면 비용이 5배까지 늘어난다. 엣지가 메인과 다른 pattern을 써야 하는 케이스가 생기면 그 시점에 예외 정책을 추가한다.
- 단계 책임을 섞지 않는다. DraftTables는 데이터 후보 생성, QualityReport/Backlog는 검수와 보강 후보 정리, Preview/Promote는 승인 경계를 담당한다.
- 앱 클라이언트 컴포넌트가 `@cx/agent` 루트를 import할 수 있으므로, 루트 export에는 `node:*`, `fs`, `async_hooks` 같은 Node 전용 의존성이 흘러들지 않게 한다.

## 완료 기준

- `npm test -- --run packages/agent`
- `npx tsc --noEmit --incremental false`
- `npx biome check packages/agent`
- 기능이나 계약이 바뀌면 이 README와 루트 `AGENTS_HISTORY.md`를 함께 갱신한다.
