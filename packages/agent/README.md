# @cx/agent

`@cx/agent`는 AI 실행 전후의 deterministic 처리와 Agent SDK 실행 adapter를 담는 패키지다.

이 패키지는 화면을 직접 렌더링하지 않는다. 렌더 가능한 JSON 계약과 validation은 `@cx/renderer`가 소유하고, `@cx/agent`는 AI import bundle, read model, 생성/검수 runner가 사용할 중간 처리만 담당한다.

## 공개 import

패키지 루트에서 주요 기능을 모두 import할 수 있다.

```ts
import {
	generateAssetsWithLocalClaude,
	createCxTextAgent,
	decorateRegisteredAssets,
	registerAssets,
	registerAssetsToTables,
	runCxTextAgent,
} from "@cx/agent";
```

기능별 subpath import도 열려 있다.

```ts
import { createCxTextAgent } from "@cx/agent/agent-sdk-runtime";
import { generateAssetsWithLocalClaude } from "@cx/agent/claude-asset-generator";
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
| `src/register-assets.ts` | route, variant, screen, organism, component 입력 정규화와 누락 참조 warning 생성 |
| `src/decorate-assets.ts` | 등록된 asset에 pattern id와 reason 장식 |
| `src/register-assets-to-tables.ts` | AI import bundle을 `database/tables` 계약에 가까운 row set으로 변환 |
| `src/types.ts` | agent asset, decoration, table row 타입 |
| `src/index.ts` | 패키지 공개 export 집약 |
| `src/__tests__/` | 패키지 단위 동작 검증 |

## 기본 흐름

```text
AI import bundle 또는 read model
-> registerAssets
-> decorateRegisteredAssets
-> registerAssetsToTables
-> database/tables 또는 후속 persistence adapter
```

Claude 생성은 local session을 우선 사용한다.

```text
uploaded markdown files
-> generateAssetsWithLocalClaude
-> RegisterAssetsInput
-> registerAssets
```

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
