# @cx/schema

`@cx/schema`는 generation pipeline 전반의 DTO와 JSON artifact 계약을 정의하는 SSOT 패키지다.

## 책임

- schemaVersion 상수 관리
- pipeline artifact kind 정의
- SourceSpec, GenerationContext, AgentRequest, AgentResult, DraftCandidate, QualityInspection, RenderTree, ValidationReport, Preview, ApplyResult 타입 정의
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

아래처럼 내부 파일이나 JSON schema 파일을 직접 import하지 않는다.

```ts
import type { SourceSpec } from "@cx/schema/src/source-spec";
import schema from "@cx/schema/src/json-schema/source-spec.schema.json";
```

필요한 계약은 `src/index.ts`와 `package.json`의 root export에 공개한다.

공개 표면:

| export | 책임 |
|---|---|
| `@cx/schema` | 전체 계약 barrel |

## RenderTree Contract

- RenderTree top-level `metadata`는 `id`만 필수로 소유하고 `title`은 갖지 않는다.
- `RenderTreeNode.metadata`는 `id`와 `title`을 필수로 소유한다.
- `getJsonSchema("render-tree")`는 `version`, `metadata`, `children`, node `componentVersion` 같은 구조 계약을 반환한다.
- 컴포넌트별 `props` 세부 계약은 `@cx/components/catalog`를 소비하는 `@cx/validation`에서 확인한다.

## Version Naming

schemaVersion에는 generation flow 이름을 넣지 않는다. 버전은 artifact 자체의 계약 버전으로 표현한다.

```ts
source-spec.v0.1
render-tree.v0.1
agent-result.v0.1
```
