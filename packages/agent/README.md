# @cx/agent

`@cx/agent`는 AI 실행 전후의 deterministic 처리와 Agent SDK 실행 adapter를 담는 패키지다.

이 패키지는 화면을 직접 렌더링하지 않는다. 렌더 가능한 JSON 계약과 validation은 `@cx/renderer`가 소유하고, `@cx/agent`는 AI import NodeTree, read model, 생성/검수 runner가 사용할 중간 처리만 담당한다.

## 공개 import

패키지 루트에서는 MVP active path에 필요한 deterministic 기능만 import할 수 있다.

```ts
import {
	createQualityReport,
	promoteDatabaseTablesCandidate,
	registerPrddScreen,
	runDraftTablesPipeline,
} from "@cx/agent";
```

고도화/실험/legacy 파이프라인은 반드시 subpath로 import한다. 패키지 루트에서 export하지 않는다.

```ts
import { createCxTextAgent } from "@cx/agent/agent-sdk-runtime";
import { generateAssetsWithLocalClaude } from "@cx/agent/claude-asset-generator";
import { composeAssetContents } from "@cx/agent/compose-assets";
import { decorateRegisteredAssets } from "@cx/agent/decorate-assets";
import { applyDesignReview, reviewDesignTree } from "@cx/agent/design-review";
import { materializeDecoratedAssetsToNodeTree } from "@cx/agent/register-assets-to-database-tables";
import { registerAssets } from "@cx/agent/register-assets";
import type { GeneratedNodeTree } from "@cx/agent/types";
```

## 현재 기능

| 경로 | 책임 |
|---|---|
| `src/pipeline/draft-tables-pipeline.ts` | **Active pipeline** — PRDD/source를 register한 뒤 `database/tables` shape draft와 optional quality report를 생성 |
| `src/validate/quality-report.ts` | detailed validation issue를 MVP quality category로 접는 report adapter |
| `src/runtime/agent-sdk-runtime.ts` | `@openai/agents` 기반 text agent 생성/실행 adapter |
| `src/register/claude-asset-generator.ts` | Claude Agent SDK local session 기반 `GeneratedNodeTree` 생성. screen case는 개별 screen으로 materialize하고 화면 설명은 `screen.description`에 둠 |
| `src/register/register-assets.ts` | **Register** — `GeneratedNodeTree`를 `RegisteredNodeTree`로 정렬/정규화하고 raw를 보존 |
| `src/compose/compose-assets.ts` | **Composer** — `RegisteredNodeTree`를 flat `ComposedNodeTree`로 풀고 `component.raw`를 `props`/`hooks`로 승격. `raw`와 pending placeholder는 산출물에 남기지 않음 |
| `src/compose/compose-assets-ai.ts` | Composer의 빈 props/gap을 Agent SDK/Claude로 보강하는 서버 전용 단계 |
| `src/decorate/decorate-assets.ts` | **Decorator** — `ComposedNodeTree`에 콘텐츠/OGN layout pattern 메타를 붙여 `DecoratedNodeTree`를 만든다. screen shell은 deterministic code가 담당함 |
| `src/design-review/design-review-contracts.ts` | **Design Review contracts** — deterministic review rule, synthetic region area, stage/version/reference path 같은 판단 테이블 |
| `src/design-review/design-review-schema.ts` | **Design Review schema** — 디자인 품질 검수 patch와 `moveComponent`, `updatePattern`, `createNewPattern`, `createComponent`, `createComposite`, `setDisplay`, `updateComponentProps` operation 계약 |
| `src/design-review/review-design-tree.ts` | **Design Review reviewer** — `docs/design/` 근거를 참조해 CTA 승격 같은 보수적 deterministic 디자인 검수 proposal 생성 |
| `src/design-review/apply-design-review.ts` | **Design Review apply** — schema를 통과한 patch만 `DecoratedNodeTree`에 적용해 reviewed tree를 생성 |
| `src/pattern/pattern-schema.ts` | `@cx/types` pattern schema 호환 re-export |
| `src/pattern/pattern-store.ts` | `@cx/pattern-store` 호환 re-export |
| `src/pattern/pattern-resolver.ts` | `@cx/pattern-store` catalog에서 children layout preset을 고르는 agent 전용 resolver |
| `src/database/register-assets-to-database-tables.ts` | **DB transformer** — reviewed `DecoratedNodeTree`를 `MaterializedNodeTree` row shape로 materialize한다. screen region shell은 코드 계약으로 생성 |
| `src/types.ts` | agent NodeTree, pattern, hook, table row 타입 |
| `src/index.ts` | 패키지 공개 export 집약 |
| `src/__tests__/` | 패키지 단위 동작 검증 |

## 기본 흐름

파이프라인은 책임이 분리된 5단계로 구성한다. 각 단계의 한 줄 정의:

- **Register**: Parse user input into canonical `RegisteredNodeTree`. (구조 추출)
- **Composer**: Place props, hooks and data binding candidates into `ComposedNodeTree`. (콘텐츠 채움)
- **Decorator**: Match content layout patterns from pattern-store into `DecoratedNodeTree`. (콘텐츠/OGN 배치)
- **Design Review**: Review decorated tree with `docs/design/` references and apply limited patch operations. (디자인 품질 보정)
- **DB transformer**: Materialize reviewed decorator decisions and content into `database/tables` row shape.

```text
md (client-imports) 또는 read model
-> Register  : generateAssetsWithLocalClaude + registerAssets
               GeneratedNodeTree 생성, raw 셀 보존, 골격 정규화
-> Composer  : composeAssetContents
               RegisteredNodeTree → ComposedNodeTree, routes/variants/screens flat children 구조화,
               component.raw → component.props/hooks
-> Decorator : decorateRegisteredAssets
               ComposedNodeTree → DecoratedNodeTree, pattern-store 조회 후 layout pattern 메타 부착
-> DesignReview
               reviewDesignTree 또는 AI review patch → applyDesignReview,
               docs/design 근거가 있는 제한 operation만 적용
-> DB        : materializeDecoratedAssetsToNodeTree
               ReviewedDecoratedNodeTree → MaterializedNodeTree, screen shell과 database/tables row 생성
```

**단계 내부는 두 패스로 구성**: (1) deterministic 매핑 → (2) Agent SDK AI 검수. (1)이 비용 0의 안전한 기본값을 만들고, (2)가 빈 곳/의심 케이스를 보강한다. Decorator의 (2)는 marketplace(Vendor↔Consumer) 협상으로 진행할 예정 (설계 진행 중).

**외부 의존 경계**: markdown 파싱은 오직 Register에서만. Composer/Decorator/Design Review/DB는 이전 단계 산출물, `component-catalog`, `@cx/component-pattern-store`, `@cx/pattern-store` 카탈로그, `docs/design/` 근거 문서만 참조한다. `deck/*` 산출물은 LLM prompt packaging과 감사/재현 snapshot이며, validator의 기본 기준은 SSOT를 직접 조회하는 `ValidatorContext`다. Design Review의 판단값은 `design-review-contracts.ts`와 `@cx/pattern-store`가 소유하고, reviewer/apply 함수 안에 component id, CTA label, region area pattern 같은 값을 직접 박지 않는다.

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
-> reviewDesignTree/applyDesignReview
-> ReviewedDecoratedNodeTree
-> materializeDecoratedAssetsToNodeTree
-> MaterializedNodeTree
```

`database/ai-imports`의 Claude/AI 보정 흐름은 `agent-assets.json`, `agent-assets.registered.json`, `agent-assets.composed.json`, `agent-assets.decorated.json`, `agent-assets.design-review.json`, `agent-assets.reviewed.json`, `agent-assets.materialized.json`을 남긴다. `agent-assets.design-review.json`은 patch/report이고, `agent-assets.reviewed.json`은 patch가 적용된 materialize 직전 tree다.

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
- Codex 검수 agent의 local-first runner와 guardrail 확장
- local-first Claude/Codex runner
- 원격 API fallback 정책
- Persistence adapter for the future operational DB/storage layer

위 기능은 `agent-sdk-runtime` 위에 별도 파일로 추가한다.
