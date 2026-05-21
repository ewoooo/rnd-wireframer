# @cx/agent 작업 지침

## 패키지 책임

`packages/agent`는 AI가 만든 결과를 바로 신뢰하지 않고, 코드가 정규화하고 검증 가능한 구조로 넘기는 중간 계층이다.

담당 범위:

- AI import bundle 등록과 정렬
- route / variant / screen / organism / component 참조 해소
- 누락 참조 warning 생성
- pattern decoration
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
    agent-sdk-runtime.ts
    decorate-assets.ts
    index.ts
    register-assets.ts
    register-assets-to-tables.ts
    types.ts
```

## 파일별 기준

| 파일 | 기준 |
|---|---|
| `agent-sdk-runtime.ts` | Agent SDK 의존성을 감싸는 최소 runtime adapter만 둔다. 역할별 prompt와 output schema는 별도 파일로 분리한다. |
| `register-assets.ts` | 입력을 mutate하지 않고 order 정규화와 참조 warning만 수행한다. |
| `decorate-assets.ts` | pattern 추론은 교체 가능한 resolver로 유지한다. |
| `register-assets-to-tables.ts` | persistence를 수행하지 않고 row object만 반환한다. |
| `types.ts` | 외부 패키지가 import하는 계약 타입을 둔다. |
| `index.ts` | 외부 공개 surface만 모은다. |

## 변경 원칙

- 수급 원본 JSON, mock 입력 JSON, `database/tables` 파일을 이 패키지 함수 안에서 직접 수정하지 않는다.
- 새 기능은 가능하면 순수 함수로 시작하고, side effect는 adapter 파일로 격리한다.
- AI가 만든 결과는 항상 deterministic 함수와 renderer validation을 통과하는 후속 흐름을 전제로 한다.
- `useMemo`와 `useCallback`은 이 패키지에서 사용할 일이 없다. React 의존성을 추가하지 않는다.
- Agent SDK의 모델명, 세션 재개, fallback 정책은 하드코딩을 피하고 후속 runner 옵션으로 분리한다.

## 완료 기준

- `npm test -- --run packages/agent`
- `npx tsc --noEmit --incremental false`
- `npx biome check packages/agent`
- 기능이나 계약이 바뀌면 이 README와 루트 `AGENTS_HISTORY.md`를 함께 갱신한다.
