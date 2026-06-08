# Contract Branch Audit - 2026-06-05

## 목적

옆 세션의 pipeline 정리에서 확인된 원인인 "스키마/계약 부족으로 인한 명령형 분기 과다"가 다른 패키지에도 남아 있는지 점검했다.

이번 감사는 구현 변경이 아니라 코드 청크 단위 위험 분류다. 기준은 `AGENTS.md`의 "문자열 literal 기반 hardcoded switch/if-chain 매핑 금지" 원칙과 `@cx/schema`, `@cx/components/catalog`, `@cx/layout-pattern-store/catalog` SSOT 경계다.

## 범위

- 포함: `packages/*/src`, `apps/web/src` 운영 소스
- 제외: generated JS, 테스트 fixture 중심 코드, 단순 타입 가드와 입출력 에러 처리
- 검사 패턴: `switch`, `case`, `if/else if`가 `type`, `kind`, `variant`, `role`, `status`, `state`, `layout`, `slot`, `scope` 같은 도메인 키를 직접 분기하는 구간

결과적으로 운영 TypeScript 소스에서 `switch`/`case` 기반 도메인 분기는 발견되지 않았다. 위험은 대부분 짧은 `if` 체인 또는 로컬 `Record` 테이블이 이미 존재하지만 SSOT 위치가 애매한 형태다.

## 2차 강도 높은 검사

추가로 TypeScript AST 기반 스캐너를 돌려 `if`, 삼항 조건, `switch`, 계약 테이블 조회 후보를 원본 운영 소스 전체에서 추출했다.

- 스캔 파일: 439개
- 후보 행: 349개
- 도메인별 후보: `type` 81, `kind` 41, `status` 33, `layout` 16, `runtime-policy` 9, `slot` 6, `stage-step` 4, `role` 3, `state` 2, 기타 가드/조회 154
- 상위 파일: `packages/figma-screen-sync/code.js` 67, `packages/validation/src/public/validators.ts` 25, `packages/figma-screen-sync/generator-core.js` 23, `apps/web/src/lib/workbench-puck/puck-scope.ts` 14, `apps/web/src/lib/screen-inference-run.ts` 11, `packages/pipeline/src/pipelines/screen-generation/screen-generation-pipeline.ts` 10

2차 검사에서 새로 확인한 점:

- `packages/figma-screen-sync`는 이전 감사에서 빠진 최대 분기 덩어리다.
- `packages/types/src/node-types.ts`는 현행 `@cx/schema` RenderTree node type 상수와 병렬 vocabulary를 소유한다.
- `packages/renderer/src/tree/coerce.ts`, `packages/adapters/src/markdown/markdown.ts`, `scripts/push-render-db.ts`, `scripts/render-tree-to-figma.mjs`에는 작은 hardcoded mapping이 남아 있다.
- `packages/pipeline`은 후보 수는 있지만 대부분 `descriptor`/`Record`/union runtime 처리로 이미 정리된 상태다.

## 선언적 데이터 구조 취약성 검사

추가로 상수 테이블, registry, catalog, matcher, fallback, rule table 후보를 AST로 추출해 다음 기준으로 봤다.

- 닫힌 키 도메인에 `satisfies Record<...>` 또는 equivalent coverage type이 있는가
- `as const` 또는 readonly 구조로 literal이 보존되는가
- runtime 구현 파일 내부 local policy가 아니라 public catalog/schema/contract 위치에 있는가
- fallback/heuristic/matcher가 rule id와 diagnostic을 남길 수 있는 구조인가
- 같은 vocabulary를 여러 패키지가 병렬 소유하지 않는가

스캔 결과 선언적 후보는 86개였다. 이 중 즉시 문제가 아니라 정본 상수라 허용 가능한 것도 많지만, 취약한 구조는 아래 묶음으로 분류된다.

### A. 선언적 구조가 local policy로 숨어 있음

위치:

- `packages/inference-nodes/src/screen-generation/planning/design-skills.ts:68`
- `packages/inference-nodes/src/screen-generation/planning/pattern-layer-candidates.ts:262`
- `packages/inference-nodes/src/screen-generation/planning/pattern-layer-candidates.ts:273`
- `packages/renderer/src/adapters/build-component-props.ts:85`
- `packages/renderer/src/tree/bindings.ts:6`
- `apps/web/src/lib/figma-export/build-code.ts:52`
- `scripts/render-tree-to-figma.mjs:27`

판정:

- `DESIGN_SKILL_MATCHERS`는 design skill 선택 정책인데 code-local keyword table이다. skill catalog나 agent docs와 연결은 있지만 matcher 자체는 schema/candidate id coverage가 약하다.
- `AREA_LAYOUT_ID_BY_SLOT`, `AREA_LAYOUT_MATCHERS`, `AREA_LAYOUT_FALLBACK`은 layout-pattern-store catalog 밖에 있는 hidden pattern selection policy다.
- `CATALOG_TEXT_PROP_SOURCE_KEYS`는 component prop alias/normalization 정책인데 renderer 내부에 있다. `@cx/components/catalog` prop contract의 alias metadata로 가는 편이 맞다.
- `EVENT_PREFIX = "event."`는 binding namespace 계약인데 renderer local string이다. RenderTree binding schema에 namespace로 명시해야 한다.
- `REGISTRY`/`VARIANT_MAP`은 Figma component mapping 계약인데 Web/script 안에 각각 있다.

권장:

- keyword matcher는 `id`, `terms`, `targetContract`, `diagnosticReason`을 가진 public rule table로 승격한다.
- text prop source alias는 component catalog prop contract에 `aliases` 또는 `sourceKeys`로 넣고 renderer는 일반 helper로 소비한다.
- binding namespace는 `@cx/schema`의 `SchemaPropBinding` 근처에 `BINDING_NAMESPACE`/`EVENT_BINDING_PREFIX`로 둔다.
- Figma mapping은 `FigmaComponentMapping` catalog 하나로 합치고 Web/script/Figma plugin이 같은 mapping을 소비한다.

### B. 닫힌 도메인인데 coverage type이 약함

위치:

- `packages/schema/src/versions.ts:1`
- `packages/schema/src/render-tree.ts:3`
- `packages/schema/src/render-tree.ts:39`
- `packages/schema/src/json-schema-registry.ts:13`
- `packages/layout/src/types.ts:30`
- `packages/layout/src/chrome/ScreenRegion.tsx:18`
- `packages/layout/src/chrome/ScreenRegion.tsx:22`
- `packages/validation/src/public/validators.ts:52`

판정:

- `SCHEMA_VERSION`, `RENDER_TREE_NODE_TYPE`, `RENDER_TREE_NODE_TYPE_GROUPS`는 정본이라 local policy 문제는 아니다. 다만 object 자체가 `satisfies`로 닫혀 있지 않아 새 artifact/version/node group 추가 시 일부 파생 테이블 누락을 강제하지 못한다.
- `JSON_SCHEMA_BY_ARTIFACT_KIND`는 최종 `as Record<GenerationArtifactKind, JsonSchemaDocument>` cast라 coverage를 보장하는 것처럼 보이지만, `Object.fromEntries` + override라 누락/중복을 더 명확히 잡으려면 builder helper가 필요하다.
- `LAYOUT_PROP_CONTRACTS`는 public contract지만 `satisfies Record<LayoutPropContractType, LayoutPropContract>`로 닫혀 있지 않다.
- `ScreenRegion.tsx`는 `LAYOUT_NODE_TYPES.screenRegion[0|1|2]` index에 의존한다. region order가 바뀌면 type 의미가 바뀐다.
- `COMPONENT_PROP_TYPE_CHECKS`는 좋은 table이고 `ComponentPropType` coverage는 이미 `satisfies`로 잡는다. 이건 낮은 위험이다.

권장:

- schema 정본 상수는 의도적으로 key union을 먼저 만들고 `satisfies Record<Key, Value>`로 닫는다.
- `JSON_SCHEMA_BY_ARTIFACT_KIND`는 `defineSchemaRegistry(SCHEMA_VERSION_BY_ARTIFACT_KIND, overrides)` 같은 helper로 missing/unknown override를 테스트한다.
- `LAYOUT_PROP_CONTRACTS`는 `satisfies Record<LayoutPropContractType, LayoutPropContract>`로 명시한다.
- `ScreenRegion`은 index 접근 대신 `RENDER_TREE_NODE_TYPE.screenHeader` 같은 named key를 소비한다.

### C. 같은 vocabulary가 여러 선언 구조에 병렬 존재

위치:

- `packages/schema/src/render-tree.ts:3`
- `packages/types/src/node-types.ts:1`
- `packages/layout/src/types.ts:7`
- `packages/adapters/src/table/render-tree-to-table.ts:27`
- `packages/adapters/src/table/table-to-render-tree.ts:41`
- `apps/web/src/lib/screen-inference-run-store.ts:18`
- `packages/pipeline/src/pipelines/screen-generation/descriptor.ts:60`

판정:

- RenderTree node type vocabulary는 `@cx/schema`가 정본인데 `@cx/types`도 `NODE_TYPES`를 소유한다.
- region node type/slot/layout mapping은 schema, adapters, inference-nodes, renderer/layout에 나뉘어 있다.
- Web `SCREEN_GENERATION_STAGES` Set은 pipeline descriptor stage list를 수동 복제한다. pipeline descriptor SSOT 정리 방향과 충돌한다.

권장:

- `@cx/types` node type helper는 schema re-export/deprecated wrapper로 바꾼다.
- region vocabulary는 `SCREEN_REGION_CONTRACTS`에서 파생한다.
- Web run-store는 `SCREEN_GENERATION_STAGE_DESCRIPTORS` 또는 public stage list export를 직접 소비한다.

### D. 선언 구조가 JSON/문서 catalog인데 runtime validation이 약함

위치:

- `packages/layout-pattern-store/src/catalog/*.json`
- `packages/agent/docs/design-skills/*.md`
- `packages/agent/docs/design-context/*.md`
- `packages/figma-screen-sync/manifest.json`
- `scripts/sample-target-spec.json`

판정:

- layout-pattern-store JSON은 `zod` schema와 tests가 있어 상대적으로 강하다.
- agent docs/design-skills는 사람이 읽는 reference이며, skill id/list와 matcher table의 coverage 연결은 약하다.
- Figma sync manifest/sample spec은 별도 schemaVersion/runtime schema 검증이 약하다.

권장:

- design skill markdown 파일 목록과 `DESIGN_SKILL_REFS`/`DESIGN_SKILL_MATCHERS` coverage test를 둔다.
- `component-spec-v1` JSON schema를 만들고 Figma sync sample/spec 생성 전에 검증한다.
- JSON catalog는 로딩 시 schema validation뿐 아니라 public API contract test에서 id uniqueness, target coverage, referenced layout/component existence를 확인한다.

## 즉시 스키마화 필요

### 1. `@cx/renderer` render node type -> renderer 연결

위치:

- `packages/renderer/src/adapters/render-primitive.tsx:20`
- `packages/renderer/src/adapters/resolve-area.tsx:16`
- `packages/renderer/src/adapters/resolve-component.tsx:40`

청크:

- `node.type === "Layout.Flex"` / `"Layout.Grid"`로 primitive renderer를 직접 선택한다.
- `node.type === "area.static"` / `"area.dynamic"`로 area renderer를 직접 선택한다.
- `COMPONENT_RENDERERS`가 `Accordion`, `SectionMessage`, `ListCell`, `Checkbox`, `RadioText`, `HeaderBase`, `SectionHeader`의 composite fallback 렌더링을 renderer 내부에서 소유한다.

판정:

`@cx/components/catalog`에는 `source: "layout-primitive" | "renderer-composite" | "react-component"`와 alias 정보가 이미 있다. 그런데 실제 renderer 선택은 catalog의 `source`나 renderer kind 계약이 아니라 renderer 내부 if/table에 남아 있다. 새 node type 또는 alias가 추가될 때 catalog와 renderer를 함께 수정해야 하는 구조다.

권장:

- `componentCatalogEntry.source`를 렌더 전략 결정에 직접 사용하거나, `componentRendererKinds` 같은 계약 테이블을 `@cx/components/catalog` 또는 renderer public adapter contract로 승격한다.
- `Layout.Flex/Grid`, `area.static/dynamic`도 `RENDER_TREE_NODE_TYPE_GROUPS` 기반 registry 조회로 통일한다.
- renderer 내부 fallback table은 구현 함수 registry만 소유하고, "어떤 type이 어떤 renderer를 쓰는지"는 계약 테이블에서 읽게 한다.

### 2. `packages/figma-screen-sync` plugin/spec interpreter 분기

위치:

- `packages/figma-screen-sync/code.js:301`
- `packages/figma-screen-sync/code.js:386`
- `packages/figma-screen-sync/code.js:468`
- `packages/figma-screen-sync/code.js:1192`
- `packages/figma-screen-sync/generator-core.js:540`
- `packages/figma-screen-sync/generator-core.js:801`
- `packages/figma-screen-sync/generator-core.js:932`
- `packages/figma-screen-sync/generator-core.js:1085`

청크:

- `msg.type` 값으로 plugin command를 `extract-auto`, `extract-selection`, `extract-page`, `build-from-code`, `wash`, `close` if-chain으로 dispatch한다.
- Figma `node.type` 값으로 `COMPONENT_SET`, `COMPONENT`, `INSTANCE`, `FRAME`, `TEXT`, `GROUP` extraction/build 처리를 직접 분기한다.
- component spec `child.kind` 값으로 `text`, `ref`, `group` build/expose 처리를 직접 분기한다.
- `category === "page"`와 `{ atom, mol, ogn, sb }` page map이 generator core 내부에 있다.
- wash rule은 `inferredCat === "ogn"`, `inferredCat === "page"`, `primaryCategory === "text" | "surface" | "border"` 등 design policy를 코드 if-chain으로 소유한다.

판정:

이 패키지는 현재 활성 generation pipeline의 SSOT라기보다 Figma plugin/sync 도구지만, 분기 밀도는 가장 높다. 특히 component spec schema가 `$schema: "component-spec-v1"` 문자열로만 존재하고, `child.kind`, `msg.type`, category/page mapping, wash rule category가 public schema/contract로 분리되어 있지 않다. Figma sync를 계속 운영할 계획이면 여기서도 pipeline과 같은 문제가 재발할 가능성이 높다.

권장:

- `component-spec-v1` schema를 `@cx/schema` 또는 Figma plugin 전용 schema 문서로 승격한다.
- `PLUGIN_MESSAGE_HANDLERS: Record<MessageType, Handler>`로 command dispatch를 table화하고 unknown command diagnostic을 남긴다.
- `FIGMA_NODE_EXTRACTORS: Partial<Record<FigmaNodeType, Extractor>>`, `SPEC_CHILD_BUILDERS: Record<SpecChildKind, Builder>`로 node/spec kind 분기를 coverage guard와 함께 정리한다.
- wash rule은 코드 주석이 아니라 `WASH_RULES` catalog로 분리해 rule id, match, action, dry-run report shape를 갖게 한다.

### 3. `@cx/inference-nodes` decoration role -> repeated item 생성

위치:

- `packages/inference-nodes/src/screen-generation/planning/decoration-plan.ts:119`
- `packages/inference-nodes/src/screen-generation/planning/decoration-plan.ts:133`
- `packages/inference-nodes/src/screen-generation/planning/decoration-contracts.ts:19`

청크:

- `contractArea.role === "content-list"`이면 약관/list term을 `ListText` propsHint로 만든다.
- `contractArea.role === "agreement-controls"`이면 checkbox label/required propsHint를 만든다.
- `DECORATION_CONTRACTS`는 role split 기준만 담고, role별 repeated item 생성 정책은 코드 if-chain에 있다.

판정:

현재는 계약 테이블이 반쯤만 존재한다. `DecorationContractArea`가 `role`, `componentTypes`, `layoutIntent`는 소유하지만, role별 `repeatedItems` 추출 정책과 `propsHint` shape는 코드가 소유한다. 새 role이 추가되면 schema와 contract는 통과해도 repeated item 생성 누락이 런타임에서만 드러날 수 있다.

권장:

- `DecorationContractArea`에 `repeatedItemPolicy` 또는 `itemProjection` id를 추가한다.
- projection id -> extractor 함수 registry는 `@cx/inference-nodes` 내부에 두되, coverage guard로 모든 policy id가 구현됐는지 검증한다.
- `propsHint` shape가 컴포넌트 catalog prop 계약과 맞는지 `@cx/validation`에서 검사한다.

### 4. RenderTree <-> table/read model area type 매핑 중복

위치:

- `packages/adapters/src/table/table-to-render-tree.ts:41`
- `packages/adapters/src/table/table-to-render-tree.ts:47`
- `apps/web/src/lib/screen-inference-apply.ts:281`
- `scripts/push-render-db.ts:514`

청크:

- DB row type `area_dynamic` / `area_static`을 RenderTree `area.dynamic` / `area.static`으로 변환한다.
- Web apply 쪽은 반대로 RenderTree type을 DB row type으로 변환한다.
- script 쪽에도 `area.dynamic` -> `area_dynamic` 변환이 별도 구현되어 있다.
- `@cx/schema`에는 RenderTree area type 상수만 있고 DB row area type vocabulary는 없다.

판정:

매핑이 짧고 현재는 일치하지만, DB read model vocabulary가 `@cx/schema` 바깥에 있어 양방향 변환이 패키지별로 흩어진다. area type 추가나 rename 때 누락 위험이 높다.

권장:

- `@cx/schema` 또는 `@cx/adapters/table` public contract에 `AREA_ROW_TYPE_BY_RENDER_TREE_TYPE` / inverse를 둔다.
- `apps/web`은 자체 `normalizeAreaType`을 제거하고 adapter contract를 소비한다.
- `scripts/push-render-db.ts`도 같은 adapter helper를 소비하게 한다.

## 계약 테이블 위치 결정 필요

### 5. Region slot/type/layout fallback 매핑의 다중 소유

위치:

- `packages/schema/src/render-tree.ts:50`
- `packages/adapters/src/table/render-tree-to-table.ts:27`
- `packages/adapters/src/table/render-tree-to-table.ts:105`
- `packages/inference-nodes/src/screen-generation/planning/pattern-layer-candidates.ts:236`
- `packages/inference-nodes/src/screen-generation/shared/layout-id.ts:18`
- `packages/adapters/src/puck/index.ts:15`

청크:

- `SCREEN_REGION_TYPE_BY_NODE_TYPE`는 `@cx/schema`에 있다.
- table projection은 별도 `REGION_KEY_BY_TYPE`와 `defaultRegionLayout()`을 갖는다.
- pattern candidates는 `REGION_TYPE_BY_SLOT`, `REGION_LAYOUT_FALLBACK_BY_TYPE`를 갖는다.
- layout-id helper도 region type -> canonical layout id를 갖는다.
- Puck adapter도 region zone/slot 이름을 별도 테이블로 갖는다.

판정:

이 영역은 이미 대부분 `Record` 테이블이라 명령형 분기는 적다. 문제는 SSOT가 여러 개라는 점이다. region이 Header/Contents/Bottom으로 고정된 계약이라면 `@cx/schema`가 node type <-> slot <-> canonical layout id vocabulary를 함께 제공하거나, `@cx/adapters/table`/`@cx/inference-nodes`가 같은 public helper를 소비해야 한다.

권장:

- `@cx/schema`에 `SCREEN_REGION_CONTRACTS`를 추가해 `nodeType`, `slot`, `defaultLayoutId`, `puckSlotName` 중 공통 vocabulary를 파생한다.
- package-specific 값인 Puck zone id는 `@cx/adapters/puck`에 남겨도 되지만, key source는 schema slot을 사용한다.

### 6. `@cx/types` node type family가 `@cx/schema`와 병렬 SSOT

위치:

- `packages/types/src/node-types.ts:1`
- `packages/schema/src/render-tree.ts:3`
- `packages/layout/src/types.ts:1`

청크:

- `packages/types/src/node-types.ts`는 `NODE_TYPES`에 `Screen`, `Screen.Header`, `Layout.Flex`, `PageStack`, `area.static` 등 built-in node vocabulary를 다시 선언한다.
- `packages/schema/src/render-tree.ts`도 `RENDER_TREE_NODE_TYPE`과 `RENDER_TREE_NODE_TYPE_GROUPS`를 선언한다.
- `packages/layout/src/types.ts`는 이미 `@cx/schema`의 `RENDER_TREE_NODE_TYPE_GROUPS`를 소비하므로 더 최신 방향이다.

판정:

`packages/types`가 legacy/shared type 패키지로 남아 있으며, 현재 AGENTS 기준으로 RenderTree DTO/schema SSOT는 `@cx/schema`다. 두 패키지가 같은 node vocabulary를 병렬 소유하면 renderer/validation/layout은 schema를 따르는데 legacy helper 소비자는 types를 따르는 분기가 생긴다.

권장:

- `packages/types/src/node-types.ts`를 `@cx/schema` 재노출 또는 deprecated wrapper로 바꾼다.
- 새 코드는 `@cx/types/node-types`를 쓰지 못하게 import scan/test를 추가한다.
- `NODE_TYPES.area[0]` 같은 index 기반 소비는 named constant/guard로 대체한다.

### 7. Pattern selection fallback/keyword matcher

위치:

- `packages/inference-nodes/src/screen-generation/planning/pattern-layer-candidates.ts:252`
- `packages/inference-nodes/src/screen-generation/planning/pattern-layer-candidates.ts:261`
- `packages/inference-nodes/src/screen-generation/planning/pattern-layer-candidates.ts:273`
- `packages/pattern-store/src/resolver.ts:111`
- `packages/layout-pattern-store/src/public/resolver.ts:101`

청크:

- decoration pattern role -> area layout id 매핑은 코드 테이블이다.
- region slot `bottom/header`는 area layout을 강제로 pin한다.
- contents/unknown area는 keyword matcher로 layout을 고른다.
- pattern-store와 layout-pattern-store가 screen layout props에서 contents region pattern을 찾는 비슷한 resolver를 각각 갖는다.

판정:

`AREA_LAYOUT_MATCHERS`는 if-chain보다 낫지만 여전히 pattern catalog 밖의 hidden policy다. 특히 `pattern-store`와 `layout-pattern-store`의 resolver는 거의 동일한 로직이 중복된다. `packages/pattern-store`가 legacy reference store라면 제거/동결 방향을 정해야 한다.

권장:

- area layout matcher를 `@cx/layout-pattern-store/catalog`의 pattern resolution metadata로 이동한다.
- `packages/pattern-store`와 `packages/layout-pattern-store` 중 활성 SSOT를 하나로 정하고 resolver 중복을 제거한다.
- keyword 기반 fallback은 임시 정책으로 문서화하고, 새 pattern 추가 시 JSON catalog에 signal을 추가하게 한다.

### 8. Puck edit scope별 변환 정책

위치:

- `apps/web/src/lib/workbench-puck/puck-scope.ts:20`
- `apps/web/src/lib/workbench-puck/puck-scope.ts:31`
- `apps/web/src/lib/workbench-puck/puck-scope.ts:45`
- `apps/web/src/lib/workbench-puck/puck-scope.ts:79`
- `apps/web/src/model/workbench/use-puck-editing.ts:92`

청크:

- `EditScope["kind"]` -> `ItemKind`, catalog prefix는 테이블로 있다.
- scope별 `buildPuckDataForScope`, `applyPuckChangeToScope`, `resolveCatalogItemsForScope`, `readEditableNodes`는 if-chain이다.

판정:

이 분기는 app-local UI adapter 정책이라 pipeline schema 부족과 같은 급은 아니다. 다만 scope가 추가될 때 4개 함수가 동시에 수정되어야 한다. 이미 `itemKindByScope`가 있으므로 scope handler table로 묶으면 누락 가능성을 줄일 수 있다.

권장:

- `Record<EditScope["kind"], ScopeAdapter>` 형태로 build/apply/catalog/readEditableNodes를 한 테이블에 모은다.
- `component` scope의 catalog prefix 부재 같은 특수성을 handler 내부 값으로 명시한다.

### 9. Markdown/source kind path 추론

위치:

- `packages/adapters/src/markdown/markdown.ts:153`

청크:

- source file kind가 없으면 path substring `screen`, `/area/`, `ogn-`, `/component/`로 `screen | area | component | unknown`을 추론한다.

판정:

이건 input normalization의 fallback이지만, path convention이 schema가 아니라 코드 heuristic이다. source ingest가 늘어나면 같은 path 추론이 pipeline/script/web에서 반복될 가능성이 있다.

권장:

- `SourceFileKindDetectionRule` table을 `@cx/adapters/markdown` public contract로 두고, rule id와 match reason을 parse diagnostics에 남긴다.
- 가능하면 caller가 `kind`를 명시하도록 pipeline input contract를 강화한다.

### 10. Renderer prop coercion enum fallback

위치:

- `packages/renderer/src/tree/coerce.ts:12`
- `packages/renderer/src/tree/coerce.ts:19`
- `packages/renderer/src/tree/coerce.ts:26`

청크:

- button size, button variant, divider type 허용값이 renderer helper에 직접 배열/분기로 들어 있다.

판정:

`@cx/components/catalog`에 `ActionButton.size`, `ActionButton.variant`, PageStack/Divider 계열 enum 계약이 이미 있다. renderer helper가 별도 enum 값을 소유하면 catalog와 coercion이 어긋날 수 있다.

권장:

- enum coercion은 component catalog `contract.values/defaultValue`를 소비하는 일반 helper로 통합한다.
- component-specific coercion helper는 제거하거나 catalog fallback의 얇은 wrapper로 제한한다.

### 11. RenderTree -> Figma variant map

위치:

- `scripts/render-tree-to-figma.mjs:78`
- `apps/web/src/lib/figma-export/build-code.ts:52`

청크:

- leaf component -> Figma component spec 변환에서 `VARIANT_MAP[type]`을 조회한다.
- Web Figma export에도 `REGISTRY`가 별도로 있어 aliases, figmaName, prop/text mapping을 소유한다.

판정:

조회 자체는 table 기반이라 괜찮지만, Figma component mapping은 `@cx/components/catalog`와 별개 script/Web-local 계약으로 보인다. Figma sync를 계속 운영한다면 component catalog의 figma mapping metadata 또는 별도 Figma adapter catalog가 필요하다.

권장:

- `FigmaComponentMapping` catalog를 만들고 component type, figma component name, variant mapper, text node mapper를 선언한다.
- script-local `VARIANT_MAP`과 Web-local `REGISTRY`는 catalog 소비자로 낮춘다.

### 12. Web screen generation stage set 수동 복제

위치:

- `apps/web/src/lib/screen-inference-run-store.ts:18`
- `packages/pipeline/src/pipelines/screen-generation/descriptor.ts:60`

청크:

- Web run-store가 screen generation stage id Set을 수동으로 들고 있다.

판정:

pipeline descriptor가 이미 stage order/id/layer의 SSOT인데 Web이 stage id list를 다시 소유한다. stage 추가/rename 시 progress event filtering이 조용히 어긋날 수 있다.

권장:

- `@cx/pipeline` public export에 stage id set/list helper를 추가하고 Web이 이를 소비한다.
- Web-local Set이 필요하면 descriptor에서 파생한 값만 import한다.

## 허용 가능한 분기

아래는 이번 문제의 핵심인 "도메인 계약 누락"과는 거리가 있어 즉시 조치 대상에서 제외한다.

- `packages/validation/src/public/validators.ts`: schema/catalog/layout 계약을 적용하는 검증 로직이다. 단, `getExpectedLayoutTargetForNodeType()`의 `nodeType.startsWith("area.")`는 area type group helper를 쓰는 편이 더 일관적이다.
- `packages/pipeline/src/pipelines/screen-generation/descriptor.ts`, `screen-generation-pipeline.ts`: stage/layer/skipPolicy/runtime registry가 이미 descriptor와 `Record` coverage guard로 정리되어 있다.
- `apps/web/src/components/workbench/canvas/*`, `apps/web/src/lib/screen-inference-run.ts`: UI 상태 badge, save 상태, progress layer 표시용 분기다. 상태별 style/label table로 개선 가능하지만 schema 부족 이슈와는 별개다.
- `packages/agent/src/*`: session resume/new 선택은 runtime policy로 충분히 작고 명시적이다.
- `packages/component/src/*`: component prop/variant 계약은 catalog entry에 집중되어 있다. 실제 React 컴포넌트 내부의 visual branch는 컴포넌트 구현 책임으로 본다.
- `packages/component-pattern-store/src/store.ts`: `registered/proposed` status 분기는 짧지만, 후보/등록 store shape 자체가 public contract라 큰 위험은 낮다.
- `packages/pipeline/src/definition/step-input-resolver.ts`, `packages/pipeline/src/runtime/run-step-pipeline.ts`: `StepInputRef.kind`, `usesAI` union 실행은 runtime discriminated union 처리다. pipeline descriptor 정리 이후 중복 stage 분기는 크지 않다.

## 권장 처리 순서

1. `@cx/renderer` renderer kind contract 정리
   - 효과: 생성된 RenderTree type, component catalog, renderer runtime의 삼각 중복을 줄인다.

2. `packages/figma-screen-sync`를 계속 운영할지 결정
   - 효과: 운영 대상이면 schema/handler registry 정리가 필요하고, 폐기 대상이면 생성 파이프라인 감사 범위에서 명시적으로 제외한다.

3. `@cx/schema` region contract 확장
   - 효과: table adapter, Puck adapter, inference candidate builder가 같은 region vocabulary를 사용한다.

4. `@cx/adapters/table` area row type mapping public helper 추가
   - 효과: Web apply/save와 table materializer의 양방향 변환 중복을 제거한다.

5. `@cx/types/node-types` legacy vocabulary 정리
   - 효과: RenderTree node vocabulary가 `@cx/schema` 하나로 모인다.

6. `DecorationContractArea` repeated item policy 스키마화
   - 효과: 약관 특화 split 이후 다른 source role이 추가될 때 if-chain이 늘어나는 것을 막는다.

7. `@cx/layout-pattern-store` pattern resolution metadata로 area matcher 이동
   - 효과: pattern 선택 정책을 코드가 아니라 catalog 값으로 감사할 수 있다.

8. Markdown source kind rule table화
   - 효과: source ingest fallback 추론이 감사 가능한 diagnostic을 남긴다.

9. Renderer prop coercion을 catalog enum 기반으로 통합
   - 효과: component catalog와 runtime fallback enum이 어긋나는 일을 막는다.

10. Web Puck scope handler table화
   - 효과: scope 추가/변경 시 누락 위험을 낮춘다. 우선순위는 낮다.

11. Declarative coverage hardening
   - `SCHEMA_VERSION`, `RENDER_TREE_NODE_TYPE`, `LAYOUT_PROP_CONTRACTS`, design skill refs/matchers, Web stage sets에 coverage tests 또는 `satisfies` type을 추가한다.

## 검사 명령

```sh
rg -n 'switch\s*\(' packages/*/src apps/web/src -g '*.{ts,tsx}' -g '!**/__tests__/**'
rg -n 'else if|if\s*\([^\n]*(\.type|\.kind|\.variant|\.role|\.mode|\.status|\.state|type ===|kind ===|variant ===|role ===|mode ===|status ===|state ===|layout ===|target ===|source ===|regionKey ===|scope\.kind|ref\.kind)' packages/*/src apps/web/src -g '*.{ts,tsx}' -g '!**/__tests__/**'
rg -n 'Record<|satisfies Record|as const|catalog|registry|schema|zod|jsonSchema|discriminatedUnion|enum|Map<' packages apps scripts -g '*.{ts,tsx,js,jsx,mjs,cjs}'
```

AST 2차 검사는 TypeScript compiler API로 `if`, 삼항 조건, `switch`, table lookup을 수집했다. 이 스캐너는 임시 분석용으로 실행했고 저장소 파일로 추가하지 않았다.

선언적 구조 검사는 AST로 `MAP`, `BY_`, `REGISTRY`, `CATALOG`, `CONTRACT`, `RULE`, `MATCHER`, `FALLBACK`, `LOOKUP`, `TYPE`, `KIND`, `STATUS`, `LAYER`, `STAGE`, `POLICY` 계열 상수를 수집했다. 이 스캐너도 임시 분석용으로 실행했고 저장소 파일로 추가하지 않았다.
