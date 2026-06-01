# @cx/schema

`@cx/schema`는 generation pipeline 전반의 DTO와 JSON artifact 계약을 정의하는 SSOT 패키지다.

## 책임

- schemaVersion 상수 관리
- pipeline artifact kind 정의
- SourceSpec, GenerationContext, AgentRequest, AgentResult, DraftCandidate, QualityInspection, TableGenerationResult, RenderTree, ValidationReport, Preview, ApplyResult 타입 정의
- JSON Schema registry 제공
- artifact kind와 schemaVersion 매핑 제공

## 두지 않는 책임

- 파일 읽기/쓰기
- Claude 실행
- validation rule 판정
- orchestration decision
- React render
- catalog 값 소유

## Public Access

외부 패키지는 root export만 사용한다. schema 계약의 원천은 이 패키지 하나이며, 파일별 subpath나 `src/*` 직접 import는 공개 소비 표면으로 보지 않는다.

```ts
import { SCHEMA_VERSION, getJsonSchema } from "@cx/schema";
import type { SourceSpec, RenderTreeContract } from "@cx/schema";
```

아래처럼 내부 파일을 직접 import하거나 정적 JSON schema 파일을 기대하지 않는다.

```ts
import type { SourceSpec } from "@cx/schema/src/source-spec";
import schema from "@cx/schema/src/json-schema/source-spec.schema.json";
```

필요한 계약은 `src/index.ts`와 `package.json`의 root export에 공개한다.
JSON Schema의 정본은 `getJsonSchema()`가 반환하는 registry 값이다.

공개 표면:

| export | 책임 |
|---|---|
| `@cx/schema` | 전체 계약 barrel |

## Final RenderTree Contract

- screen generation의 최종 결과물은 `final-result.json`에 저장되는 `RenderTreeContract` 자체다.
- top-level은 `version`, `minRendererVersion`, `metadata`, `theme`, `children`를 갖는다.
- `children` 아래에는 `Screen` root가 있고, 그 아래에 `Screen.Header`, `Screen.Contents`, `Screen.Bottom` region을 둔다.
- region 아래에는 필요에 따라 `area.static` 또는 `area.dynamic` wrapper를 두고, 그 아래에 renderer/catalog가 해석 가능한 component node를 둔다.
- 테이블 반영은 이 RenderTree를 screen, area, composite/component 레이어로 분해해 등록하는 후속 apply 단계다.

## TableGenerationResult Contract

- `TableGenerationResult`는 현재 MVP에서 table-shaped 중간 산출물과 검증 보조 기록으로만 사용한다.
- 장기 기준에서 table apply는 최종 RenderTree를 레이어별로 분해해 수행한다.
- `screen.layout`, `screen.screen.regions.*.layout`, `areas[].layout`, `components[].layout`은 모두 `layout.<target>.<PatternName>` 형태를 사용한다.
- layout id가 실제 store component registry에 존재하는지와 target에 맞는지는 `@cx/validation`이 `@cx/layout-pattern-store`를 조회해 확인한다.
- component record의 layout은 layout-pattern-store의 `composite` target을 참조한다.

## RenderTree Contract

- RenderTree top-level `metadata`는 `id`만 필수로 소유하고 `title`은 갖지 않는다.
- `RenderTreeNode.metadata`는 `id`와 `title`을 필수로 소유한다.
- `getJsonSchema("render-tree")`는 `version`, `metadata`, `children`, node `componentVersion` 같은 구조 계약을 반환한다.
- `RenderTreeNode.layout`은 layout pattern component 선택에 사용하며 `layout.<target>.<PatternName>` 형태를 사용한다.
- 컴포넌트별 `props` 세부 계약은 `@cx/components/catalog`를 소비하는 `@cx/validation`에서 확인한다.

## SourceSpec Contract

- SourceSpec은 원문 Markdown이 말하는 구조를 `screen.regions[].children[]` outline으로 보존한다.
- 각 region의 `children`에는 `area` node만 둔다. header, contents, bottom 모두 같은 구조를 사용한다.
- area node는 이름을 갖지 않고 `sourceAreaId`와 component children만 갖는다.
- PRDD area id `0`은 header, `1~998`은 contents, `999`는 bottom region으로 해석한다.
- `1-1`, `1-2`, `2-1` 같은 계층형 area id는 문자열 그대로 보존한다.

## Version Naming

schemaVersion에는 generation flow 이름을 넣지 않는다. 버전은 artifact 자체의 계약 버전으로 표현한다.

```ts
source-spec.v0.1
render-tree.v0.1
agent-result.v0.1
component-proposal.v0.1
```

design-context bundle은 ref(`DesignContextBundleRef`)와 본문(`DesignContextBundleContent`)을 모두 계약으로 소유한다. `component-proposal`은 카탈로그 밖 후보를 제시하는 비파괴 아티팩트 계약이고, `quality-inspection`은 hierarchy/separation/fidelity/actionClarity/densityFit/patternFit 점수(`scores`)와 finding 원인 레이어(`understand`/`compose`/`revise`)를 선택 필드로 가진다.
