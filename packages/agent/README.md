# @cx/agent

`@cx/agent`는 AI 실행 전후의 deterministic 처리와 Agent SDK 실행 adapter를 담는 패키지다.

이 패키지는 화면을 직접 렌더링하지 않는다. 렌더 가능한 JSON 계약과 validation은 `@cx/renderer`가 소유하고, `@cx/agent`는 AI import NodeTree, read model, 생성/검수 runner가 사용할 중간 처리만 담당한다.

## 공개 import

패키지 루트에서는 브라우저 번들에서도 안전한 deterministic 기능만 import할 수 있다.

```ts
import {
	composeAssetContents,
	decorateRegisteredAssets,
	materializeDecoratedAssetsToDatabaseTables,
	registerAssets,
	registerAssetsToTables,
} from "@cx/agent";
```

Agent SDK처럼 Node.js 런타임 전용 의존성을 가진 기능은 반드시 서버/API 코드에서 subpath로 import한다. 패키지 루트에서 export하지 않는다.

```ts
import { createCxTextAgent } from "@cx/agent/agent-sdk-runtime";
import { generateAssetsWithLocalClaude } from "@cx/agent/claude-asset-generator";
import { composeAssetContents } from "@cx/agent/compose-assets";
import { decorateRegisteredAssets } from "@cx/agent/decorate-assets";
import { materializeDecoratedAssetsToDatabaseTables } from "@cx/agent/register-assets-to-database-tables";
import { registerAssets } from "@cx/agent/register-assets";
import { registerAssetsToTables } from "@cx/agent/register-assets-to-tables";
import type { GeneratedNodeTree } from "@cx/agent/types";
```

## 현재 기능

| 경로 | 책임 |
|---|---|
| `src/runtime/agent-sdk-runtime.ts` | `@openai/agents` 기반 text agent 생성/실행 adapter |
| `src/register/claude-asset-generator.ts` | Claude Agent SDK local session 기반 `GeneratedNodeTree` 생성. screen case는 개별 screen으로 materialize하고 화면 설명은 `screen.description`에 둠 |
| `src/register/register-assets.ts` | **Register** — `GeneratedNodeTree`를 `RegisteredNodeTree`로 정렬/정규화하고 raw를 보존 |
| `src/register/register-assets-to-tables.ts` | legacy/simple table row 변환 helper. 신규 AI import materialize는 `database/register-assets-to-database-tables.ts`를 우선 사용 |
| `src/compose/compose-assets.ts` | **Composer** — `RegisteredNodeTree`를 flat `ComposedNodeTree`로 풀고 `component.raw`를 `props`/`hooks`로 승격. `raw`와 pending placeholder는 산출물에 남기지 않음 |
| `src/compose/compose-assets-ai.ts` | Composer의 빈 props/gap을 Agent SDK/Claude로 보강하는 서버 전용 단계 |
| `src/decorate/decorate-assets.ts` | **Decorator** — `ComposedNodeTree`에 콘텐츠/OGN layout pattern 메타를 붙여 `DecoratedNodeTree`를 만든다. screen shell은 deterministic code가 담당함 |
| `src/pattern/pattern-schema.ts` | pattern-store JSON schema와 layout preset 타입 |
| `src/pattern/pattern-store.ts` | `database/pattern-store` reference catalog loader |
| `src/pattern/pattern-resolver.ts` | pattern catalog에서 children layout preset을 고르는 resolver |
| `src/database/register-assets-to-database-tables.ts` | **DB transformer** — `DecoratedNodeTree`를 `MaterializedDatabaseNodeTables` row shape로 materialize한다. screen region shell은 코드 계약으로 생성 |
| `src/types.ts` | agent NodeTree, pattern, hook, table row 타입 |
| `src/index.ts` | 패키지 공개 export 집약 |
| `src/__tests__/` | 패키지 단위 동작 검증 |

## 기본 흐름

파이프라인은 책임이 분리된 4단계로 구성한다. 각 단계의 한 줄 정의:

- **Register**: Parse user input into canonical `RegisteredNodeTree`. (구조 추출)
- **Composer**: Place props, hooks and data binding candidates into `ComposedNodeTree`. (콘텐츠 채움)
- **Decorator**: Match content layout patterns from pattern-store into `DecoratedNodeTree`. (콘텐츠/OGN 배치)
- **DB transformer**: Materialize decorator decisions and content into `database/tables` row shape.

```text
md (client-imports) 또는 read model
-> Register  : generateAssetsWithLocalClaude + registerAssets
               GeneratedNodeTree 생성, raw 셀 보존, 골격 정규화
-> Composer  : composeAssetContents
               RegisteredNodeTree → ComposedNodeTree, routes/variants/screens flat children 구조화,
               component.raw → component.props/hooks
-> Decorator : decorateRegisteredAssets
               ComposedNodeTree → DecoratedNodeTree, pattern-store 조회 후 layout pattern 메타 부착
-> DB        : materializeDecoratedAssetsToDatabaseTables
               DecoratedNodeTree → MaterializedDatabaseNodeTables, screen shell과 database/tables row 생성
```

**단계 내부는 두 패스로 구성**: (1) deterministic 매핑 → (2) Agent SDK AI 검수. (1)이 비용 0의 안전한 기본값을 만들고, (2)가 빈 곳/의심 케이스를 보강한다. Decorator의 (2)는 marketplace(Vendor↔Consumer) 협상으로 진행할 예정 (설계 진행 중).

**외부 의존 경계**: markdown 파싱은 오직 Register에서만. Composer/Decorator/DB는 이전 단계 산출물, `component-catalog`, pattern-store 카탈로그만 참조한다.

Claude 생성은 로컬 Claude 실행 파일을 우선 사용한다. 각 생성 요청은 기본적으로 새 세션에서 실행하며, 이전 대화를 이어야 하는 명시적 검수/재시도 흐름에서만 `continueSession: true`를 전달한다.

```text
uploaded markdown files
-> generateAssetsWithLocalClaude
-> GeneratedNodeTree
-> registerAssets
-> RegisteredNodeTree
-> composeAssetContents
-> ComposedNodeTree
-> decorateRegisteredAssets
-> DecoratedNodeTree
-> materializeDecoratedAssetsToDatabaseTables
-> MaterializedDatabaseNodeTables
```

`generateAssetsWithLocalClaude(input, { debug: true })`를 사용하면 서버 콘솔에 입력 파일 요약, prompt 길이, Claude SDK message 타입, 경과 시간, message count, 파싱 결과 카운트가 출력된다. 원문 markdown과 전체 raw result는 기본 로그에 출력하지 않는다.

OpenAI Agent SDK 실행은 별도 흐름이다.

```text
createCxTextAgent
-> runCxTextAgent
-> finalOutput 검사
-> deterministic validation 또는 table conversion
```

## 아직 없는 것

- Claude 생성 agent의 role-specific instructions
- Codex 검수 agent의 output schema와 guardrail
- local-first Claude/Codex runner
- 원격 API fallback 정책
- Supabase persistence adapter

위 기능은 `agent-sdk-runtime` 위에 별도 파일로 추가한다.
