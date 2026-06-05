# @cx/validation

`@cx/validation`은 생성 과정에서 필요한 순수 검증을 담당하는 패키지다.

현재 단계에서는 생성물이 계약상 렌더 가능한지와 component catalog 계약을 지키는지만 기계적으로 검증한다.
디자인 품질, SKT 패턴 적합성, 문구/UX 품질 평가는 이 패키지의 책임이 아니다.

## 책임

- 입력 DTO와 생성 후보를 순수 함수로 검증한다.
- `@cx/schema`의 JSON Schema를 AJV로 검증한다.
- component catalog, layout pattern, token reference의 참조 오류를 issue로 반환한다.
- 검증 결과를 `ValidationReport` 형태로 돌려준다.
- pipeline이나 orchestration이 다음 행동을 결정할 수 있도록 판정 결과만 제공한다.

## 두지 않는 책임

- 파일 읽기/쓰기
- Claude Agent SDK 실행
- retry/fallback 정책
- stage transition 결정
- React render
- catalog 값 생성 또는 수정

## Public Subpaths

| Subpath | 책임 |
|---|---|
| `@cx/validation` | 패키지 루트 public API |
| `@cx/validation/contract` | 순수 validation boundary contract |
| `@cx/validation/types` | issue/report public type surface |

`src/internal/*`가 추가되더라도 외부에서는 직접 import하지 않는다.

## Public API

```ts
import {
	validateAgentResult,
	validateComponentUsage,
	validateLayoutProps,
	validateRenderTree,
	validateSchemaArtifact,
} from "@cx/validation";

const schemaReport = validateSchemaArtifact("render-tree", renderTree);
const report = validateRenderTree(renderTree, {
	componentCatalog,
});
```

모든 검증 함수는 공통 `ValidationReport`를 반환한다.

```ts
type ValidationReport = {
	ok: boolean;
	target: "agent-result" | "component-usage" | "layout-props" | "render-tree" | "schema-artifact";
	issues: ValidationIssue[];
	summary: {
		errorCount: number;
		warningCount: number;
	};
};
```

## Validation Scope

- `validateSchemaArtifact`: `@cx/schema`의 JSON Schema를 AJV로 강제해 version, required field, additionalProperties 같은 구조 계약을 확인한다.
- `validateAgentResult`: JSON 결과 shape와 자유 HTML/CSS/React 코드 포함 여부를 확인한다.
- `validateComponentUsage`: 주입받은 `ComponentCatalog` 기준으로 component type, required prop, prop type, enum 값, unknown prop, `aiWritable: false` 직접 작성을 확인한다.
- `validateRenderTree`: RenderTree version, Screen/Header/Contents/Bottom 구조, 처리 가능한 node type, children 배열, display/binding/default 안전성을 확인한다.
- `validateLayoutProps`: `Layout.Flex`, `Layout.Grid`, Screen region props의 enum과 숫자/문자/boolean 타입을 확인한다.
- `validateComponentProposal`: 비파괴 `component-proposal` 아티팩트가 bounded인지(근거 ⊆ allowedRefs, nearestCatalogMatch ∈ 카탈로그 type, 개수 상한) 확인한다.

필요한 catalog나 contract는 인자로 받는다. 이 패키지는 `@cx/schema`, `@cx/components`, `@cx/layout`, `@cx/layout-pattern-store`의 public API만 소비한다.
