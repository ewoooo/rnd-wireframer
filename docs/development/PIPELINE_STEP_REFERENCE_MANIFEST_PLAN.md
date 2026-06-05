# Pipeline Step Reference Manifest Plan

## 목적

`defineStep`만 읽어도 각 step이 무엇을 참고하고, 어떤 output contract를 내는지 파악할 수 있게 한다.

현재 `screen-generation` pipeline은 실제 참조 자료가 stage executor, agent input builder, design-context loader, skill catalog에 분산되어 있다. 실행은 가능하지만 `defineStep` 목록만 보고는 step별 판단 재료를 파악하기 어렵다.

목표는 실행 배선과 사람/디버거가 읽는 참조 manifest를 분리하는 것이다.

```text
inputs = runtime이 resolve하는 실행 배선
uses   = 사람이 읽는 참조 자료 manifest
output = step이 공개하는 named output contract
```

현재 구현 상태:

- 구현됨: `output.result` named output contract, `state.steps[step.id].outputs.result` 저장, `stepOutput(stepId, "result")`, `refInput(id)`, `contract(id)`.
- 구현됨: screen-generation AI step runner는 runtime이 resolve한 `inputs`를 받아 실행한다.
- 미구현/후속: `uses` manifest와 trace/debug 노출. 이 문서는 해당 후속 설계의 기준이다.

## 현재 문제

현재 step 정의는 외부 ref 종류만 보여준다.

```ts
defineStep({
  id: "generate-render-tree",
  inputs: {
    componentCatalogs: from("ref.componentCatalogs"),
    designContextBundles: from("ref.designContextBundles"),
    layoutCatalogs: from("ref.layoutCatalogs"),
    skillBundles: from("ref.skillBundles"),
  },
  execute: ...
});
```

이 정의만 봐서는 실제 판단 재료가 보이지 않는다.

실제 `generate-render-tree`는 다음을 참고한다.

- `parse-source` 결과
- `derive-screen-intent` 결과
- `plan-composition` 결과
- `derive-decoration-plan` 결과
- `select-pattern` 결과
- component catalog
- layout catalog
- design-context bundle refs/body
- screen-generation prompt/checklist/output-contract docs
- render-tree/table-generation-result schema

하지만 이 정보는 `agent-inputs.ts`, `design-context-catalog.ts`, `skill-catalog.ts`, stage executor에 흩어져 있다.

## 결정

### 1. `uses`는 참조 자료만 표현한다

`uses`에는 output contract를 넣지 않는다.

```text
uses   = step이 판단할 때 참고하는 자료
output = step이 반드시 내야 하는 결과 계약
```

### 2. `output`은 named output map이다

모든 step은 반드시 `output.result`를 가진다.

```ts
defineStep({
  id: "derive-screen-intent",
  usesAI: true,
  output: {
    result: contract("screen-intent"),
  },
});
```

복합 결과도 기본 참조점은 `result`로 유지한다.

```ts
defineStep({
  id: "generate-render-tree",
  usesAI: true,
  output: {
    result: contract("screen-generation-agent-result"),
  },
});
```

`generate-render-tree.result` 내부는 다음처럼 복합 payload를 가질 수 있다.

```ts
{
  renderTree,
  tableGenerationResult,
  agentResult,
}
```

필요한 경우에만 보조 output을 추가한다.

```ts
output: {
  result: contract("screen-generation-agent-result"),
  preview: contract("render-tree"),
  trace: contract("agent-trace"),
}
```

### 3. Step output 참조는 typed helper를 사용한다

문자열 하나로 `stepOutput("derive-screen-intent.result")`를 받지 않는다. 타입 안정성을 위해 step id와 output name을 분리한다.

```ts
stepOutput("derive-screen-intent", "result")
```

원칙:

- 기본 참조는 항상 `stepOutput(stepId, "result")`다.
- `result` 외 output은 명시적으로 추가된 경우에만 참조한다.
- `uses`에서 내부 payload path를 노출하지 않는다.

금지:

```ts
stepOutput("parse-source.sourceSpec")
stepOutput("derive-decoration-plan.decorationPlan")
stepOutput("validate-render-tree.report")
```

허용:

```ts
stepOutput("parse-source", "result")
stepOutput("derive-decoration-plan", "result")
stepOutput("validate-render-tree", "result")
```

## Target API

```ts
type StepUseRef =
  | { kind: "request"; id: string }
  | { kind: "step-output"; stepId: string; outputName: string }
  | { kind: "ref"; id: string }
  | { kind: "doc-set"; id: string }
  | { kind: "doc"; path: string }
  | { kind: "schema"; id: string };

type PipelineStepOutputDefinition = {
  result: OutputContract;
  [outputName: string]: OutputContract;
};

type PipelineStepDefinition = {
  id: string;
  inputs?: Record<string, StepInputRef>;
  output: PipelineStepOutputDefinition;
  uses?: StepUseRef[];
  usesAI: boolean;
};
```

Helper:

```ts
request("sourcePath");
stepOutput("parse-source", "result");
ref("componentCatalogs");
docSet("screen-generation");
doc("packages/agent/docs/screen-generation/checklist.md");
schema("render-tree");
contract("screen-intent");
```

## Example

```ts
defineStep({
  id: "generate-render-tree",
  usesAI: true,
  uses: [
    stepOutput("parse-source", "result"),
    stepOutput("derive-screen-intent", "result"),
    stepOutput("plan-composition", "result"),
    stepOutput("derive-decoration-plan", "result"),
    stepOutput("select-pattern", "result"),
    ref("componentCatalogs"),
    ref("layoutCatalogs"),
    ref("designContextBundles"),
    ref("skillBundles"),
    docSet("screen-generation"),
    docSet("design-context"),
    schema("render-tree"),
    schema("table-generation-result"),
  ],
  inputs: {
    componentCatalogs: from("ref.componentCatalogs"),
    designContextBundles: from("ref.designContextBundles"),
    layoutCatalogs: from("ref.layoutCatalogs"),
    skillBundles: from("ref.skillBundles"),
  },
  output: {
    result: contract("screen-generation-agent-result"),
  },
});
```

## Screen Generation Step Uses Draft

| Step | Uses | Output |
|---|---|---|
| `read-source` | `request("sourcePath")` | `result: contract("source-file")` |
| `parse-source` | `stepOutput("read-source", "result")` | `result: contract("source-spec-parse-result")` |
| `derive-screen-intent` | `stepOutput("parse-source", "result")`, `schema("screen-intent")` | `result: contract("screen-intent")` |
| `plan-composition` | `stepOutput("parse-source", "result")`, `stepOutput("derive-screen-intent", "result")`, `ref("layoutCatalogs")`, `docSet("design-skills")`, `schema("composition-plan")` | `result: contract("composition-plan-result")` |
| `derive-decoration-plan` | `stepOutput("parse-source", "result")`, `stepOutput("plan-composition", "result")`, `ref("layoutCatalogs")` | `result: contract("decoration-plan-result")` |
| `select-pattern` | `stepOutput("parse-source", "result")`, `stepOutput("plan-composition", "result")`, `stepOutput("derive-decoration-plan", "result")`, `ref("layoutCatalogs")`, `docSet("design-context.refs")`, `schema("pattern-selection")` | `result: contract("pattern-selection")` |
| `generate-render-tree` | parse/intent/composition/decoration/pattern result, component/layout/design/skill refs, `docSet("screen-generation")`, `docSet("design-context")`, render/table schemas | `result: contract("screen-generation-agent-result")` |
| `validate-render-tree` | `stepOutput("generate-render-tree", "result")`, `ref("componentCatalogs")`, `schema("validation-report")` | `result: contract("validation-report")` |
| `propose-components` | generation result, validation result, component/design refs, `docSet("component-proposal")` | `result: contract("component-proposal")` |
| `review-quality` | generation result, validation result, design refs, `docSet("quality-review")` | `result: contract("quality-inspection")` |
| `revise-render-tree-if-invalid` | generation result, validation result, quality result, component/design refs, `docSet("screen-revision")` | `result: contract("screen-generation-agent-result")` |
| `validate-render-tree-after-revision` | revision result, component refs, validation schema | `result: contract("validation-report")` |
| `write-artifacts` | all previous `*.result` outputs | `result: contract("pipeline-artifact-write-result")` |

## Rollout Plan

### Rollout 1 - Type-only manifest fields

- Add `uses?: StepUseRef[]` to `PipelineStep`.
- Change output definition target to named output map in types. 완료.
- Keep runtime behavior compatible while current callers migrate. 완료.

### Rollout 2 - Helpers

- Add `stepOutput(stepId, outputName)`. 완료.
- Add `refInput(id)` and `contract(id)` runtime helpers. 완료.
- Add `ref(id)`, `docSet(id)`, `doc(path)`, `schema(id)` manifest helpers. 후속.
- Keep existing `from(...)` runtime input helper unchanged.

### Rollout 3 - Screen-generation manifest

- Add named `output.result` to every screen-generation step definition. 완료.
- Add `uses` to every screen-generation step definition. 후속.
- Do not change stage execution.
- Do not change artifact shape yet.

### Rollout 4 - Runtime output registry alignment

- Normalize runtime stored outputs so each step has a named output map with `result`. 완료.
- Preserve compatibility reads during migration. 완료.
- Update tests to reference `stepId.result`. 완료.

### Rollout 5 - Trace/debug exposure

- Include step `uses` and `output` metadata in trace/debug output.
- Optional: show per-step references in Web run detail later.

## 검증 기준

- `defineStep` 목록만 봐도 step별 참고 자료와 output contract를 파악할 수 있다.
- 모든 step output definition은 `result`를 가진다.
- New helper usage is `stepOutput("step-id", "result")`, not string path parsing.
- `uses`에는 output contract가 들어가지 않는다.
- `inputs` runtime wiring and `uses` reference manifest are separate.
