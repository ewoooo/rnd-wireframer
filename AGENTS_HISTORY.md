# RND Screen Generator 에이전트 히스토리

## 1. 문서 책임

이 문서는 변경 이력만 기록한다.

제품, 아키텍처, 데이터, 에이전트 역할의 최신 기준은 각 책임 문서를 참조한다.

`MASTER_PLAN.md`, `AGENTS.md`, `AGENTS_HISTORY.md`는 루트 전역 문서로 유지한다. 세부 설계 문서는 `docs/` 아래에 둔다.

| 주제 | 기준 문서 |
|---|---|
| 제품 계획 | [MASTER_PLAN.md](./MASTER_PLAN.md) |
| 개발 아키텍처 | [docs/development/DEVELOPMENT_ARCHITECTURE.md](./docs/development/DEVELOPMENT_ARCHITECTURE.md) |
| 데이터 설계 | [docs/development/DATA_MAP.md](./docs/development/DATA_MAP.md) |
| 에이전트 운영 | [AGENTS.md](./AGENTS.md) |

## 2. 기록 형식

```markdown
## YYYY-MM-DD - Agent

- 변경:
- 이유:
- 검증:
- 후속:
```

새 엔트리는 가장 최근 월의 `docs/agents-history/YYYY-MM.md`에 추가한다. 월이 바뀌면 새 월 파일을 만들고 아래 인덱스에 링크를 추가한다.

## 3. 월별 인덱스

- [2026-05](./docs/agents-history/2026-05.md)

## 4. 최근 엔트리

가장 최근 1건만 inline 유지. 그 외는 위 월별 파일 참조.

## 2026-05-26 - Generation Surface Cleanup

- 변경: 존재하지 않는 `register/client-import-parser` public export와 legacy `register-assets-to-tables` helper/export/test/docs 참조를 제거함
- 변경: 현재 코드에서 import하지 않는 Puck/Supabase/React Query/Form/Sonner 의존성을 root dependency에서 제거하고 npm/bun lockfile을 갱신함
- 이유: 생성 파이프라인과 직접 연결되지 않는 오래된 public surface와 선설치 의존성이 남아 있으면 실제 생성 경계와 후속 구현 우선순위가 흐려지기 때문
- 검증: `pnpm vitest run packages/agent/src/__tests__/agent.test.ts packages/agent/src/__tests__/build-decks.test.ts packages/agent/src/__tests__/validate-composition.test.ts packages/agent/src/__tests__/validate-decorated.test.ts`, `pnpm exec tsc --noEmit --pretty false`

## 2026-05-26 - Design Foundation Deck Inclusion

- 변경: `DESIGN_FOUNDATION.md`를 `DesignDocumentId`와 design deck whitelist에 추가해 Compose/Decorate가 토큰·컬러·타이포그래피·radius·spacing 근거로 참조할 수 있게 함
- 이유: `LAYOUT_SPACING_CONTRACT.md`와 `COMPOSITION_LAYERS.md`가 `DESIGN_FOUNDATION.md`를 정식 token/foundation 원천으로 참조하므로 deck에서 제외하면 designRef 근거가 우회되기 때문
- 검증: `pnpm vitest run packages/agent/src/__tests__/build-decks.test.ts`, `pnpm build:decks`, `pnpm exec tsc --noEmit --pretty false`

## 2026-05-26 - Composition Validator Traceability Hardening

- 변경: Compose validator가 `sourceRefs[]` 내부의 screen/area/component 참조를 PRDD Screen Record와 대조하도록 보강함
- 변경: Decorate validator가 변경된 layoutPattern verification의 `originalDraft`가 Compose 원 draft와 동일한지, 변경 근거 `designRefs`가 design deck에 존재하는지 검증하도록 보강함
- 이유: source/design traceability가 필드 존재만으로 통과하면 LLM 산출물이 PRDD 근거와 Compose draft를 이름만 보존하고 실제로는 드리프트할 수 있기 때문
- 검증: `pnpm vitest run packages/agent/src/__tests__/validate-composition.test.ts`, `pnpm exec tsc --noEmit --pretty false`

## 2026-05-26 - Composition Validator Strictness Clarification

- 변경: `database/AI-COMPOSITION-SPEC.md`에서 decision-level `designRefs[]`를 항상 필수로 두지 않고, high emphasis·재구성/합성 근거·decision-level layoutPatternDraft·모호 판단인 경우에만 hard requirement로 좁힘
- 변경: Decorate의 draft 보존 규칙은 layoutPatternDraft 변경 자체가 아니라 변경 사유/근거 누락이 hard error임을 명시함
- 이유: 모든 decision에 design reference를 요구하면 출력 크기와 재시도 비용이 커지고, draft 보정 가능성과 Validator 위반 조건이 모호해지기 때문
- 검증: `designRefs`, `design reference`, `draft 보존`, `draft 덮어쓰기` 관련 문서 검색으로 strictness 문구 확인

## 2026-05-26 - Composition Creative Freedom

- 변경: `database/AI-COMPOSITION-SPEC.md`의 Schema B에 `screen.strategy`, area `compositionAction`, `sourceRefs[]`, `visualIntent`, decision `emphasis`, synthetic area 추적 필드를 추가함
- 변경: Compose가 PRDD source area를 merge/split하거나 supporting area를 합성할 수 있도록 하되, 모든 재구성은 sourceRefs/designRefs/synthetic reason으로 추적하도록 Validator #1 규칙을 추가함
- 이유: AI가 PRDD row를 단순 배열하지 않고 화면 품질을 위해 섹션을 재구성하려면 자유도가 필요하지만, 원본 근거 추적성을 잃으면 검증과 리뷰가 불가능하기 때문
- 검증: Schema B 필드와 Validator #1 규칙에서 strategy/compositionAction/sourceRefs/visualIntent/emphasis/synthetic 참조 확인

## 2026-05-26 - Compose Owns Layout Draft

- 변경: `database/AI-COMPOSITION-SPEC.md`에서 Compose가 `docs/design/` 기반 design deck과 layoutPatternStore deck을 입력받아 componentPattern뿐 아니라 layoutPattern 1차안까지 작성하도록 책임을 확장함
- 변경: Schema B에 `designDeckVersion`, `layoutPatternStoreDeckVersion`, `designRefs`, 필수 `layoutPatternDraft`를 추가하고, Validator #1이 screen/area layoutPattern draft와 design reference를 hard gate로 검증하도록 정리함
- 변경: Decorate는 layoutPattern 생성 주체가 아니라 Compose draft의 검증·보정 단계로 낮추고, Design Review도 검증·개선 patch 역할로 명확히 함
- 이유: 화면 품질을 Compose에서 1차로 끌어올리고, 후단 단계가 새 화면을 창작하지 않게 해야 PRDD 의도와 design 문서 근거가 초반 골격에 반영되기 때문
- 검증: `layoutPattern hint`, `Decorate.*결정`, `docs/design`, `layoutPatternDraft` 관련 문서 검색으로 책임 표현 확인

## 2026-05-26 - AI Composition Remaining Decisions

- 변경: `database/AI-COMPOSITION-SPEC.md`의 남은 결정 사항을 순차 확정함
- 변경: 자연어 필드는 raw 보존 + deterministic hint 병행, componentPattern dedupe는 `compositionDigest` + normalized intent로 시작, proposed→proposed componentPattern 참조는 v1 금지로 정리함
- 변경: catalog deck 위치를 `database/catalog/generated/`로 확정하고, `report-gap` 완전성 검증을 hard error로 승격함
- 변경: propose-pattern 승격, gap-report 큐 위치, LLM 호출 단위, 재시도 한도, area role enum 확장 기준을 운영 결정 사항으로 고정하고 다음 단계 순서를 타입/스키마 → deck → Validator → LLM 구현으로 재정렬함
- 이유: 남은 정책이 미정이면 Validator와 Agent runner 구현에서 같은 산출물을 서로 다르게 해석할 수 있기 때문
- 검증: `결정 필요`, catalog deck 위치, gap-report 완전성, 다음 단계 순서 관련 문서 검색으로 잔여 모호성 확인

## 2026-05-26 - AI Composition Pattern Terminology

- 변경: `database/AI-COMPOSITION-SPEC.md`에서 Compose가 다루는 재사용 UI 조합을 `componentPattern`, Decorate가 다루는 배치 recipe를 `layoutPattern`/`layoutPatternStore`로 분리함
- 변경: Schema C 타입과 catalog deck 필드를 `ComponentPattern*`/`componentPatterns`로 갱신하고, Schema B decision 참조도 `componentPatternId`, `proposedComponentPatternId`, `layoutPatternHint`로 정리함
- 이유: component 조합 패턴과 layout pattern-store의 배치 패턴이 모두 `pattern`으로 불리면 Validator와 materializer 구현에서 서로 다른 책임을 같은 필드로 오해할 수 있기 때문
- 검증: 문서 내 `Pattern*`, `catalog.patterns`, `proposedPatterns`, `patternId`, `layoutHint` 잔여 참조 검색 후 의도된 mode 문자열/파일 경로만 남는지 확인

## 2026-05-26 - AI Composition Decision Schema

- 변경: `database/AI-COMPOSITION-SPEC.md`에 LLM #1 Compose의 주 산출물인 Schema B `CompositionOutput`/`CompositionDecision` 계약을 추가함
- 변경: 기존 Pattern Object와 Gap Report를 Schema C/D로 이동하고, Validator #1 규칙과 다음 단계의 Schema 참조를 A/B/C/D 기준으로 갱신함
- 이유: `composed.json`의 실제 shape가 비어 있으면 Validator와 후속 구현이 mode별 source/target/props/binding/gap 참조를 각자 해석하게 되기 때문
- 검증: 문서 내 Schema 번호, section 번호, `composed.json`, Validator #1, 다음 단계 참조 일치 확인

## 2026-05-26 - AI Composition Spec Register Boundary

- 변경: `database/AI-COMPOSITION-SPEC.md`에서 LLM #1의 `Extract+Compose` 표현을 제거하고, deterministic Register가 Schema A(Extended Registered)를 만든 뒤 LLM #1 Compose가 semantic composition decision만 수행하도록 경계를 정리함
- 이유: PRDD 원문 보존과 파싱 책임을 LLM에 맡기면 같은 입력에서도 추출 결과가 흔들리고, 현재 파이프라인의 정보 손실 병목을 다시 만들 수 있기 때문
- 검증: 문서 내 파이프라인 다이어그램, 경계 규율, 다음 단계 항목의 책임 표현 일치 확인

## 2026-05-26 - Compose Placement Review

- 변경: Compose AI가 prop 보정뿐 아니라 잘못된 screen region 배치 후보를 `placements`로 제안하고, bottom에 들어온 비-system area를 contents로 재배치할 수 있도록 확장함
- 변경: deterministic Design Review의 bottom CTA 승격 조건에서 광범위한 `동의` label과 `apiCall` hook 단독 매칭을 제거함
- 이유: `법정대리인 동의 결과 확인` 같은 결과/상태 확인 area와 inline API 액션이 하단 CTA 영역으로 승격되면 화면 의미가 깨지기 때문
- 검증: `npm test -- --run packages/agent/src/__tests__/compose-assets-ai.test.ts packages/agent/src/__tests__/design-review-stage.test.ts`, `npx tsc --noEmit --incremental false`

## 2026-05-26 - Agent Artifact Cleanup

- 변경: 생성 파이프라인의 `client-import.parsed.json`, `client-import.validation.json`, `client-import.materialized.json` 출력을 제거하고 `agent-assets.*.json`만 AI import 산출물로 남기도록 정리함
- 변경: `database/ai-imports` 문서에서 deterministic parser 산출물 규칙을 제거함
- 이유: 현재 생성/검수/promotion 흐름의 실질 산출물은 `agent-assets.*.json`이며, `client-import.*.json`은 중복 staging 파일로 혼선을 만들기 때문
- 검증: `npx tsc --noEmit --incremental false`

## 2026-05-26 - Composition Materializer Area Preservation

- 변경: `materializeComposition`이 header/contents/bottom 모든 slot의 Compose area를 `DatabaseAreaRow`로 보존하고, screen region children은 component 직접 참조 대신 area 참조로 일관화함
- 변경: selection mode별 component type 추출을 switch 대신 `SELECTION_TYPE_READERS` 계약 테이블로 정리함
- 이유: Decorate가 검증한 area-level `finalLayoutPattern`이 materialized 화면 입력에서 사라지지 않게 하고, Compose/Decorate traceability를 화면 생성 단계까지 유지하기 위함
- 검증: `pnpm vitest run packages/agent/src/__tests__/materialize-composition.test.ts packages/agent/src/__tests__/register-prdd-screen.test.ts packages/agent/src/__tests__/prdd-record-builder.test.ts packages/agent/src/__tests__/compose-screen.test.ts packages/agent/src/__tests__/decorate-screen.test.ts packages/agent/src/__tests__/validate-composition.test.ts packages/agent/src/__tests__/validate-decorated.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check packages/agent/src/database/materialize-composition.ts packages/agent/src/__tests__/materialize-composition.test.ts packages/agent/src/pipeline/run-pipeline.ts packages/agent/src/pipeline/index.ts scripts/pipeline-smoke.ts`

## 2026-05-26 - Decorator Vocabulary Retry Hints

- 변경: layoutPattern validator가 unknown/incompatible ID를 발견하면 node kind에 맞는 `suggestions[]` 후보를 issue data와 retry hint에 포함하도록 보강함
- 변경: Decorate retry prompt에 Layout Pattern Store와 Compose 원본 `layoutPatternDraft` 요약을 다시 주입해, 재시도 시 등록 ID 선택과 `originalDraft` 보존을 명확히 함
- 이유: Decorator가 `component-app-bar`, `app-bar-header`, `top-app-bar`처럼 계층이 다른 어휘나 미등록 ID를 오가던 문제를 validator feedback으로 수리 가능하게 만들기 위함
- 검증: `pnpm vitest run packages/agent/src/__tests__/build-decks.test.ts packages/agent/src/__tests__/compose-screen.test.ts packages/agent/src/__tests__/decorate-screen.test.ts packages/agent/src/__tests__/validate-composition.test.ts packages/agent/src/__tests__/validate-decorated.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check packages/agent/src/validate/rules/shared/deck-lookup.ts packages/agent/src/validate/rules/decorate/layout-pattern.ts packages/agent/src/validate/rules/compose/layout-draft.ts packages/agent/src/validate/retry-hint.ts packages/agent/src/decorate-screen/build-prompt.ts packages/agent/src/decorate-screen/decorate-screen.ts packages/agent/src/__tests__/validate-decorated.test.ts packages/agent/src/__tests__/decorate-screen.test.ts`

## 2026-05-26 - Pipeline Preview Renderability

- 변경: Composition materializer가 preview 산출 시 `component-fallback`, `screen-region-default`, 구식 `patternId/patternVariant` 없이 pattern-store의 구체 pattern ref와 `minRendererVersion`을 쓰도록 정리함
- 변경: preview script가 stale materialized 결과 대신 `PrddScreenRecord + CompositionOutput + DecoratedOutput`을 다시 materialize하고 smoke용 sample data를 props template에 주입하도록 보강함
- 변경: workbench pattern-store loader가 `variants[]`를 읽도록 하고, `Badge`를 renderer kind 계약에 추가해 preview render tree fallback을 0으로 만듦
- 이유: smoke 화면이 거의 비어 보이던 원인이 생성 의도 부족뿐 아니라 materialized table/renderer 계약 불일치였기 때문
- 검증: `pnpm build:decks`, `pnpm tsx scripts/preview-pipeline-output.ts --overwrite`, `pnpm vitest run packages/agent/src/__tests__/materialize-composition.test.ts packages/renderer/src/__tests__/render-tree-projection.test.ts packages/renderer/src/__tests__/renderer.test.tsx packages/renderer/src/__tests__/component-catalog.test.ts`, `pnpm exec tsc --noEmit --pretty false`

## 2026-05-26 - Archetype Scaffold Contract

- 변경: Compose 앞단에 deterministic `Archetype Scaffold`를 추가해 PRDD 어휘 기반으로 `commerce-detail`, `form-entry`, `agreement-flow`, `confirmation`, `list-browse`, `support`, `generic-detail` 원형과 required/optional block 골격을 산출하도록 함
- 변경: Schema B `screen`에 `archetype`과 `completeness`를 추가하고, Compose prompt가 scaffold를 화면 골격 계약으로 받아 present/synthetic/missing/omitted block을 기록하도록 보강함
- 변경: Validator #1이 scaffold archetype 불일치, required block 미설명, 허용 범위 밖 synthetic block을 hard error로 검증하도록 추가함
- 이유: 화면별 수동 체크리스트 없이 다양한 화면의 최소 완성도를 끌어올리되, Compose가 모든 화면 장르 판단과 골격 생성을 혼자 떠안지 않게 하기 위함
- 검증: `pnpm vitest run packages/agent/src/__tests__/compose-screen.test.ts packages/agent/src/__tests__/validate-composition.test.ts packages/agent/src/__tests__/decorate-screen.test.ts packages/agent/src/__tests__/validate-decorated.test.ts packages/agent/src/__tests__/materialize-composition.test.ts`, `pnpm exec tsc --noEmit --pretty false`, `pnpm exec biome check packages/types/src/composition-output.ts packages/types/src/validation.ts packages/agent/src/compose-screen/build-prompt.ts packages/agent/src/compose-screen/compose-screen.ts packages/agent/src/compose-screen/index.ts packages/agent/src/compose-screen/scaffold.ts packages/agent/src/compose-screen/schema.ts packages/agent/src/validate/types.ts packages/agent/src/validate/validate-composition.ts packages/agent/src/validate/rules/compose/archetype-completeness.ts packages/agent/src/__tests__/validate-composition.test.ts packages/agent/src/__tests__/compose-screen.test.ts packages/agent/src/__tests__/decorate-screen.test.ts packages/agent/src/__tests__/validate-decorated.test.ts packages/agent/src/__tests__/materialize-composition.test.ts database/AI-COMPOSITION-SPEC.md`

## 2026-05-26 - Design Review Contract Tables

- 변경: Design Review의 CTA 판정, operation dispatch, placement 처리, synthetic action area 생성을 contract table과 pattern-store reference로 분리함
- 변경: `action-stack`, `bottom-action-area` area pattern을 추가하고, createComponent pattern fallback을 pattern-store 조회로 전환함
- 이유: 신규 Design Review 기능 안에 판단값이 하드코딩되면 스키마/패턴 변경 때 코드 수정으로 번지는 문제를 막기 위함
- 검증: `jq empty database/pattern-store/area-patterns.json`, `npm test -- packages/agent/src/__tests__/design-review-schema.test.ts packages/agent/src/__tests__/design-review-stage.test.ts`, `npx biome check packages/agent/src/design-review database/pattern-store/area-patterns.json`, `npx tsc --noEmit`
- 후속: Design Review AI runner가 같은 contract table을 prompt/context로 참조하도록 연결

## 2026-05-26 - Design Review Apply Expansion

- 변경: `createComposite`가 `Layout.Flex` composite wrapper로 적용되고 materialize/render projection까지 nested children을 전달하도록 확장함
- 변경: region pattern update, destination placement, component catalog 기반 AI-writable prop 검증을 Design Review apply 단계에 추가함
- 변경: Pattern schema의 `childWrap` 타입을 정리하고 Design Review pattern draft를 normalized `variants/defaultVariant/resolution` 계약에 맞춤
- 이유: Design Review patch 스키마가 표현하는 다양한 디자인/패턴 보정을 deterministic apply/materialize 단계에서도 구조적으로 받기 위함
- 검증: `npm test -- packages/agent/src/__tests__/design-review-schema.test.ts packages/agent/src/__tests__/design-review-stage.test.ts packages/agent/src/__tests__/pattern-schema.test.ts packages/renderer/src/__tests__/render-tree-projection.test.ts`, `npm run lint`, `npx tsc --noEmit`
- 후속: `createNewPattern` proposal을 pattern-store 승인/반영 workflow와 연결

## 2026-05-26 - Design Review Schema

- 변경: Design Review patch 스키마를 추가하고 `moveComponent`, `updatePattern`, `createNewPattern`, `createComponent`, `createComposite`, `setDisplay`, `updateComponentProps` operation을 정의함
- 변경: `agent-assets.design-review.json`과 patch 적용 결과 `agent-assets.reviewed.json` 생성 단계를 파이프라인에 추가함
- 변경: 모든 finding/operation이 `docs/design/*` 근거를 `designReferences`로 반드시 포함하도록 강제함
- 이유: CTA 승격, state display, 새 component/composite/pattern 제안을 자유 RenderTree 생성이 아니라 제한된 디자인 품질 patch로 다루기 위함
- 검증: `npm test -- packages/agent/src/__tests__/design-review-schema.test.ts packages/agent/src/__tests__/design-review-stage.test.ts`, `npx tsc --noEmit`
- 후속: Design Review AI reviewer runner 추가와 `createComposite` materialization 고도화

## 2026-05-26 - Node Type Taxonomy

- 변경: `@cx/types`에 node type taxonomy 계약을 추가해 `screen.*`, `Screen.*`, `area.*`, layout/wrapper/system type을 분리함
- 변경: `Accordion`/`accordion`은 structural type이 아니라 component catalog type/alias로만 해석되도록 renderer mapping을 정리함
- 이유: 화면 surface, area behavior, component 구현 타입이 같은 `type` 문자열 아래 섞여 생성/검증 책임이 흐려지는 것을 막기 위함
- 검증: `npx tsc --noEmit`, `npm test -- packages/renderer/src/__tests__/schema-runtime.test.ts packages/renderer/src/__tests__/render-tree-projection.test.ts`
- 후속: component catalog의 실제 Accordion 구현/props 계약이 늘어나면 `Accordion` entry를 확장

## 2026-05-26 - Data Agent

- 변경: `tablesToRenderTree`/`tablesToRenderTrees` projection을 `apps/web` adapter에서 `@cx/renderer`의 `render-tree-projection.ts`로 이동하고, renderer가 table shape -> RenderTree DTO -> React render 책임을 갖도록 조정함
- 이유: RenderTree DTO를 만드는 책임과 React node로 소비하는 책임이 모두 renderer 경계에 있어야 앱 workbench가 생성/렌더링 파이프라인 중간 책임을 갖지 않기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, 관련 파일 `npx biome check`

## 2026-05-26 - Data Agent

- 변경: `@cx/renderer`의 public 입력 타입/API를 `WireframeNode` 계열에서 `RenderTreeNode`/`RenderTree`/`RenderTree*Renderer` 계열로 변경하고, render tree를 DB로 되돌리는 `renderTreeToTables` 역변환 adapter를 제거함
- 이유: render tree는 렌더러 입력 DTO여야 하며, 역변환 adapter가 남아 있으면 render tree가 저장/편집 원본처럼 사용될 수 있기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, `npx biome check`, `jq empty database/ai-imports/*.json database/tables/*.json database/pattern-store/*.json`

## 2026-05-26 - Data Agent

- 변경: `pattern-store` layout preset의 `props`를 `layoutProps`로 좁히고, `WireframeNode`를 저장/편집 관리 모델이 아니라 `@cx/renderer` 입력용 render projection DTO로 문서화함
- 이유: pattern-store가 leaf props처럼 보이면 DB leaf의 텍스트/상태/hook 책임과 layout preset 책임이 섞이고, WireframeNode를 중간 관리 원본으로 보면 DB -> render projection -> React 흐름이 불필요하게 길어지기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, `jq empty database/ai-imports/*.json database/tables/*.json database/pattern-store/*.json`

## 2026-05-26 - Data Agent

- 변경: `components.json` row를 component render row로 정리하고, `composite`는 2개 이상의 `@cx/components`가 결합된 wrapper 의미로만 남기도록 계약/코드/문서를 갱신함
- 이유: 일반 component row를 composite라고 부르면 합성 컴포넌트와 단일 컴포넌트 참조의 경계가 다시 흐려지기 때문
- 검증: `npx tsc --noEmit --incremental false`, `npm test -- --run apps/web/src/adapters packages/agent packages/renderer`, 관련 파일 `npx biome check`
