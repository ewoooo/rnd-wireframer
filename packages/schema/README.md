# @cx/schema

`@cx/schema`는 generation pipeline 전반의 DTO와 JSON artifact 계약을 정의하는 SSOT 패키지다.

## 책임

- schemaVersion 상수 관리
- pipeline artifact kind 정의
- SourceSpec, GenerationContext, AgentRequest, AgentResult, DraftCandidate, QualityInspection, RenderTree, ValidationReport, Preview, ApplyResult 타입 정의
- JSON Schema skeleton 제공
- artifact kind와 schemaVersion 매핑 제공

## 두지 않는 책임

- 파일 읽기/쓰기
- Claude 실행
- validation rule 판정
- orchestration decision
- React render
- catalog 값 소유

## Public Access

외부 패키지는 반드시 root export만 사용한다.

```ts
import { SCHEMA_VERSION, getJsonSchema } from "@cx/schema";
import type { SourceSpec, RenderTreeContract } from "@cx/schema";
```

아래처럼 내부 파일이나 JSON schema 파일을 직접 import하지 않는다.

```ts
import type { SourceSpec } from "@cx/schema/source-spec";
import schema from "@cx/schema/src/json-schema/source-spec.schema.json";
```

필요한 계약은 `src/index.ts`에서 공개한다.

## Version Naming

schemaVersion에는 generation flow 이름을 넣지 않는다. 버전은 artifact 자체의 계약 버전으로 표현한다.

```ts
source-spec.v0.1
render-tree.v0.1
agent-result.v0.1
```
