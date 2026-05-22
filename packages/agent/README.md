# @cx/agent

`@cx/agent`는 AI 실행 전후의 deterministic 처리와 Agent SDK 실행 adapter를 담는 패키지다.

이 패키지는 화면을 직접 렌더링하지 않는다. 렌더 가능한 JSON 계약과 validation은 `@cx/renderer`가 소유하고, `@cx/agent`는 AI import bundle, read model, 생성/검수 runner가 사용할 중간 처리만 담당한다.

## 공개 import

패키지 루트에서는 브라우저 번들에서도 안전한 deterministic 기능만 import할 수 있다.

```ts
import {
	composeAssetContents,
	decorateRegisteredAssets,
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
import { registerAssets } from "@cx/agent/register-assets";
import { registerAssetsToTables } from "@cx/agent/register-assets-to-tables";
import type { RegisterAssetsInput } from "@cx/agent/types";
```

## 현재 기능

| 파일 | 책임 |
|---|---|
| `src/agent-sdk-runtime.ts` | `@openai/agents` 기반 text agent 생성/실행 adapter |
| `src/claude-asset-generator.ts` | Claude Agent SDK local session 기반 Phase 1 asset register 생성 |
| `src/register-assets.ts` | **Register** — Parse user input into canonical data structure. 정규화 + raw 보존 |
| `src/compose-assets.ts` | **Composer** — Place props, placeholders and data bindings. `component.raw` → `component.props` 매핑 (markdown 직접 안 읽음) |
| `src/decorate-assets.ts` | **Decorator** — Place layout patterns into each render node using pattern-store. patternId/chrome 결정 메타만 박음 |
| `src/register-assets-to-tables.ts` | AI import bundle을 `database/tables` 계약에 가까운 row set으로 변환 |
| `src/register-assets-to-database-tables.ts` | **DB transformer** — Materialize decorator decisions and content into `database/tables` row shape. chrome composite 합성, regions.children 펼침 |
| `src/types.ts` | agent asset, decoration, table row 타입 |
| `src/index.ts` | 패키지 공개 export 집약 |
| `src/__tests__/` | 패키지 단위 동작 검증 |

## 기본 흐름

파이프라인은 책임이 분리된 4단계로 구성한다. 각 단계의 한 줄 정의:

- **Register**: Parse user input into canonical data structure. (구조 추출)
- **Composer**: Place props, placeholders and data bindings. (콘텐츠 채움)
- **Decorator**: Place layout patterns into each render node using pattern-store. (스타일링)
- **DB transformer**: Materialize decorator decisions and content into `database/tables` row shape.

```text
md (client-imports) 또는 read model
-> Register  : generateAssetsWithLocalClaude + registerAssets
               markdown 파싱, raw 셀 보존, 골격 정규화
-> Composer  : composeAssetContents
               component.raw → component.props (label/title/message/variant/maxLength)
-> Decorator : decorateRegisteredAssets
               pattern-store 조회 후 patternId/chrome 결정 메타 박음
-> DB        : decoratedAssetsToDatabaseTables
               결정 메타 materialize, chrome composite 합성, database/tables row 생성
```

**단계 내부는 두 패스로 구성**: (1) deterministic 매핑 → (2) Agent SDK AI 검수. (1)이 비용 0의 안전한 기본값을 만들고, (2)가 빈 곳/의심 케이스를 보강한다. Decorator의 (2)는 marketplace(Vendor↔Consumer) 협상으로 진행할 예정 (설계 진행 중).

**외부 의존 경계**: markdown 파싱은 오직 Register에서만. Composer/Decorator/DB는 이전 단계 산출물 + pattern-store 카탈로그만 참조한다.

Claude 생성은 로컬 Claude 실행 파일을 우선 사용한다. 각 생성 요청은 기본적으로 새 세션에서 실행하며, 이전 대화를 이어야 하는 명시적 검수/재시도 흐름에서만 `continueSession: true`를 전달한다.

```text
uploaded markdown files
-> generateAssetsWithLocalClaude
-> RegisterAssetsInput
-> registerAssets
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
