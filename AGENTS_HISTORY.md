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
