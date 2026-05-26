# Component State Variant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Figma 수준의 화면 완성도를 위해 컴포넌트 상태(default/empty/loading/error/disabled/readonly) 축을 contract에 자리잡고, Composer가 prop 신호로부터 상태를 자동 추론하도록 한다.

**Architecture:** State variant를 `@cx/types`의 ComponentPropContract 어휘에 1급 시민으로 도입. Composer가 deterministic 규칙(prop disabled/loading/readonly + bindings null/empty)으로 state를 결정하고, contract.supportedStates 안에서만 결정. 결정된 state는 ComposedComponentNode.state 필드로 흘러 Decorator/Materialize는 pass-through. 하드코딩 switch 금지 — 모든 결정은 contract 테이블에서 읽음.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces. 4단계 파이프라인 원칙(Register=parse, Composer=props/bindings, Decorator=patterns, DB=materialize) 유지.

**Pilot Scope:** `ogn-mbr-term-agree` family — Checkbox(small/medium), section-message(negative), action-area(strong) 3개 컴포넌트. Catalog 자리는 전 컴포넌트에 만들되 실제 supportedStates 값 채우기는 이 3개만.

---

## 파일 구조

**신규 변경 파일 (변경 없는 신규 파일은 없음):**
- `packages/types/src/tokens.ts` — `ComponentState` 타입 + 헬퍼 추가
- `packages/types/src/component-catalog.ts` — `ComponentPropContract.supportedStates`, `.stateTokens` 추가
- `packages/types/src/index.ts` — 새 export
- `packages/agent/src/types.ts` — `ComposedComponentNode.state`, `.stateReason` 추가
- `packages/agent/src/compose/compose-assets.ts` — `composeComponent`에 state 추론 호출
- `packages/agent/src/compose/infer-component-state.ts` (신규) — state 추론 규칙 분리 (DRY, 단일 책임)
- `packages/agent/src/__tests__/infer-component-state.test.ts` (신규)
- `packages/agent/src/__tests__/compose-assets.test.ts` — state pass-through 케이스 추가
- `packages/component/src/Checkbox/catalog.ts` — supportedStates 채우기 (term-agree pilot)
- `packages/component/src/<section-message catalog>` — supportedStates 채우기
- `packages/component/src/<action-area catalog>` — supportedStates 채우기

**책임 분리 이유:** state 추론 규칙은 compose-assets.ts에서 분리한다. compose-assets.ts는 이미 220+ 라인이고, state 규칙은 단위 테스트가 많이 필요하며 독립적으로 진화할 가능성이 높다.

---

## Task 1: ComponentState 어휘 + 헬퍼 추가

**Files:**
- Modify: `packages/types/src/tokens.ts`
- Modify: `packages/types/src/index.ts`
- Test: `packages/types/src/__tests__/component-state.test.ts` (신규)

- [ ] **Step 1: Write the failing test**

`packages/types/src/__tests__/component-state.test.ts` 생성. (디렉토리 없으면 같이 생성)

```ts
import { describe, expect, it } from "vitest";
import { COMPONENT_STATES, isComponentState, type ComponentState } from "../tokens";

describe("ComponentState", () => {
  it("exposes the canonical state vocabulary", () => {
    expect(COMPONENT_STATES).toEqual([
      "default",
      "empty",
      "loading",
      "error",
      "disabled",
      "readonly",
    ]);
  });

  it("isComponentState guards arbitrary strings", () => {
    expect(isComponentState("disabled")).toBe(true);
    expect(isComponentState("DEFAULT")).toBe(false);
    expect(isComponentState("partial")).toBe(false);
  });

  it("ComponentState union matches COMPONENT_STATES", () => {
    const states: ComponentState[] = [...COMPONENT_STATES];
    expect(states.length).toBe(COMPONENT_STATES.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cx/types test -- component-state`
Expected: FAIL — `COMPONENT_STATES`, `isComponentState`, `ComponentState` not exported

- [ ] **Step 3: Add the vocabulary**

`packages/types/src/tokens.ts` 끝에 추가:

```ts
/**
 * 컴포넌트 상태 어휘. Composer가 prop 신호로부터 추론하고,
 * ComponentPropContract.supportedStates가 어떤 상태를 표현 가능한지 선언한다.
 * 새 상태 추가 시 isComponentState/타입/COMPONENT_STATES 세 곳 모두 동기화.
 */
export const COMPONENT_STATES = [
  "default",
  "empty",
  "loading",
  "error",
  "disabled",
  "readonly",
] as const;

export type ComponentState = (typeof COMPONENT_STATES)[number];

export const COMPONENT_STATE_SET: ReadonlySet<string> = new Set(COMPONENT_STATES);

export function isComponentState(value: string): value is ComponentState {
  return COMPONENT_STATE_SET.has(value);
}
```

- [ ] **Step 4: Export from index**

`packages/types/src/index.ts`에서 tokens 모듈 export 라인 옆에 `ComponentState`, `COMPONENT_STATES`, `isComponentState`가 노출되는지 확인. 기존 `export * from "./tokens"` 형태라면 자동 노출됨. 명시적 re-export 패턴이면 추가:

```ts
export { COMPONENT_STATES, COMPONENT_STATE_SET, isComponentState, type ComponentState } from "./tokens";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @cx/types test -- component-state`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add packages/types/src/tokens.ts packages/types/src/index.ts packages/types/src/__tests__/component-state.test.ts
git commit -m "feat(types): add ComponentState vocabulary"
```

---

## Task 2: ComponentPropContract에 supportedStates/stateTokens 추가

**Files:**
- Modify: `packages/types/src/component-catalog.ts:55-75`
- Test: `packages/types/src/__tests__/component-catalog-state.test.ts` (신규)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import type { ComponentCatalogEntry, ComponentPropContract } from "../component-catalog";
import type { ComponentState } from "../tokens";

describe("ComponentPropContract supportedStates", () => {
  it("accepts a catalog entry that declares supported states", () => {
    const entry: ComponentCatalogEntry = {
      type: "checkbox",
      source: "react-component",
      version: "1.0.0",
      props: {
        checked: { type: "boolean", role: "value" },
      },
      supportedStates: ["default", "disabled", "error"],
      stateTokens: {
        disabled: { visualTokens: ["color.text.muted"] },
        error: { visualTokens: ["color.text.error"] },
      },
    };

    expect(entry.supportedStates).toContain("disabled");
    expect(entry.stateTokens?.error?.visualTokens).toEqual(["color.text.error"]);
  });

  it("permits omitting state declarations entirely", () => {
    const entry: ComponentCatalogEntry = {
      type: "divider",
      source: "react-component",
      version: "1.0.0",
      props: {},
    };
    expect(entry.supportedStates).toBeUndefined();
    expect(entry.stateTokens).toBeUndefined();
  });

  it("treats supportedStates as a structural ComponentState[]", () => {
    const states: ComponentState[] = ["default", "loading"];
    expect(states).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cx/types test -- component-catalog-state`
Expected: FAIL — `supportedStates`/`stateTokens` not on `ComponentCatalogEntry`

- [ ] **Step 3: Extend the contract**

`packages/types/src/component-catalog.ts`에서 import 라인을 갱신:

```ts
import type { ComponentState, TokenRole, TokenSlot } from "./tokens";
```

그리고 `ComponentCatalogEntry` 인터페이스에 supportedStates / stateTokens 필드 추가 (interface 끝 `tokens?: ...` 아래):

```ts
	/**
	 * 이 컴포넌트가 표현 가능한 상태 집합.
	 * Composer가 추론한 state가 이 집합 밖이면 무시되고 design-review warning.
	 * 미선언이면 default 만 지원으로 간주.
	 */
	supportedStates?: readonly ComponentState[];
	/**
	 * 상태별 시각 토큰 / 슬롯 오버라이드 선언.
	 * Decorator/Renderer가 state에 따라 적용. 하드코딩 분기 대신 이 테이블에서 읽음.
	 */
	stateTokens?: Partial<Record<ComponentState, {
		visualTokens?: readonly TokenRole[];
		slotOverrides?: Record<string, { hidden?: boolean; placeholder?: string }>;
	}>>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cx/types test`
Expected: PASS — 새 테스트 3개 통과, 기존 component-catalog 테스트 회귀 없음

- [ ] **Step 5: Commit**

```bash
git add packages/types/src/component-catalog.ts packages/types/src/__tests__/component-catalog-state.test.ts
git commit -m "feat(types): add supportedStates and stateTokens to ComponentCatalogEntry"
```

---

## Task 3: ComposedComponentNode에 state / stateReason 필드 추가

**Files:**
- Modify: `packages/agent/src/types.ts:94-106`

- [ ] **Step 1: Write the failing test**

`packages/agent/src/__tests__/composed-component-state.test.ts` 신규:

```ts
import { describe, expect, it } from "vitest";
import type { ComposedComponentNode } from "../types";

describe("ComposedComponentNode.state", () => {
  it("accepts a node that records inferred state and reason", () => {
    const node: ComposedComponentNode = {
      id: "c1",
      order: 0,
      type: "checkbox",
      props: { disabled: true },
      state: "disabled",
      stateReason: "props.disabled === true",
    };
    expect(node.state).toBe("disabled");
    expect(node.stateReason).toContain("disabled");
  });

  it("treats state as optional (default omitted)", () => {
    const node: ComposedComponentNode = {
      id: "c2",
      order: 1,
      type: "checkbox",
      props: {},
    };
    expect(node.state).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cx/agent test -- composed-component-state`
Expected: FAIL — `state`/`stateReason` 프로퍼티 없음 → TS 에러

- [ ] **Step 3: Extend ComposedComponentNode**

`packages/agent/src/types.ts:1`에 `ComponentState` import 추가:

```ts
import type { ComponentState, NodeDisplay, NodeHook, ScreenSurfaceType } from "@cx/types";
```

`ComposedComponentNode` 인터페이스 (현재 94~106 라인) 의 `synthesized?` 위에 추가:

```ts
	/**
	 * Composer가 props/bindings 신호로부터 추론한 컴포넌트 상태.
	 * "default"는 표기하지 않는다 (omit). Decorator/Materialize는 pass-through.
	 */
	state?: ComponentState;
	/**
	 * state 결정 근거. 디버깅·design-review용. Materialize에서는 제거.
	 */
	stateReason?: string;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cx/agent test -- composed-component-state`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/agent/src/types.ts packages/agent/src/__tests__/composed-component-state.test.ts
git commit -m "feat(agent): add state and stateReason to ComposedComponentNode"
```

---

## Task 4: state 추론 규칙 (inferComponentState)

**Files:**
- Create: `packages/agent/src/compose/infer-component-state.ts`
- Test: `packages/agent/src/__tests__/infer-component-state.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { inferComponentState } from "../compose/infer-component-state";

const catalog = {
  checkbox: { supportedStates: ["default", "disabled", "error"] as const },
  "section-message": { supportedStates: ["default", "error"] as const },
  divider: {},
} as const;

function lookup(type: string) {
  return (catalog as Record<string, { supportedStates?: readonly string[] }>)[type] ?? null;
}

describe("inferComponentState", () => {
  it("returns disabled when props.disabled === true and supported", () => {
    const result = inferComponentState({ type: "checkbox", props: { disabled: true } }, lookup);
    expect(result).toEqual({ state: "disabled", reason: "props.disabled === true" });
  });

  it("returns loading when props.loading === true and supported", () => {
    const result = inferComponentState(
      { type: "checkbox", props: { loading: true } },
      (t) => ({ supportedStates: ["default", "loading"] as const }),
    );
    expect(result?.state).toBe("loading");
  });

  it("returns readonly when props.readonly === true and supported", () => {
    const result = inferComponentState(
      { type: "checkbox", props: { readonly: true } },
      (t) => ({ supportedStates: ["default", "readonly"] as const }),
    );
    expect(result?.state).toBe("readonly");
  });

  it("returns empty when a data prop binding is explicitly null/empty array", () => {
    const result = inferComponentState(
      { type: "checkbox", props: { items: [] } },
      (t) => ({ supportedStates: ["default", "empty"] as const }),
    );
    expect(result?.state).toBe("empty");
    expect(result?.reason).toContain("items");
  });

  it("returns undefined when no signal present", () => {
    const result = inferComponentState({ type: "checkbox", props: { label: "동의" } }, lookup);
    expect(result).toBeUndefined();
  });

  it("returns undefined when signal exists but state not supported", () => {
    const result = inferComponentState({ type: "section-message", props: { disabled: true } }, lookup);
    expect(result).toBeUndefined();
  });

  it("returns undefined when component has no supportedStates declared", () => {
    const result = inferComponentState({ type: "divider", props: { disabled: true } }, lookup);
    expect(result).toBeUndefined();
  });

  it("priority order: disabled > loading > readonly > empty (most decisive first)", () => {
    const result = inferComponentState(
      { type: "checkbox", props: { disabled: true, loading: true, readonly: true, items: [] } },
      (t) => ({ supportedStates: ["default", "disabled", "loading", "readonly", "empty"] as const }),
    );
    expect(result?.state).toBe("disabled");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cx/agent test -- infer-component-state`
Expected: FAIL — module not found

- [ ] **Step 3: Implement inferComponentState**

`packages/agent/src/compose/infer-component-state.ts` 생성:

```ts
import type { ComponentState } from "@cx/types";

/**
 * 컴포넌트 contract lookup. catalog에 등록된 supportedStates 만 반환.
 * 미등록 / 미선언이면 supportedStates 없음 또는 null.
 */
export type ComponentStateContractLookup = (type: string) => {
  supportedStates?: readonly ComponentState[];
} | null | undefined;

export interface InferComponentStateInput {
  type: string;
  props?: Record<string, unknown>;
}

export interface InferredComponentState {
  state: ComponentState;
  reason: string;
}

/**
 * Composer 단계 deterministic state 추론.
 * - 신호: props.disabled / props.loading / props.readonly (boolean true)
 *         + 데이터형 prop이 빈 배열 → empty
 * - 우선순위: disabled > loading > readonly > empty
 * - contract.supportedStates 안에서만 결정. 밖이면 무시(undefined 반환).
 * - "default"는 표기하지 않는다 (omit).
 */
export function inferComponentState(
  input: InferComponentStateInput,
  lookup: ComponentStateContractLookup,
): InferredComponentState | undefined {
  const contract = lookup(input.type);
  const supported = contract?.supportedStates;
  if (!supported || supported.length === 0) return undefined;

  const props = input.props ?? {};
  const tryState = (state: ComponentState, reason: string): InferredComponentState | undefined =>
    supported.includes(state) ? { state, reason } : undefined;

  if (props.disabled === true) {
    const hit = tryState("disabled", "props.disabled === true");
    if (hit) return hit;
  }
  if (props.loading === true) {
    const hit = tryState("loading", "props.loading === true");
    if (hit) return hit;
  }
  if (props.readonly === true) {
    const hit = tryState("readonly", "props.readonly === true");
    if (hit) return hit;
  }

  for (const [key, value] of Object.entries(props)) {
    if (Array.isArray(value) && value.length === 0) {
      const hit = tryState("empty", `props.${key} is empty array`);
      if (hit) return hit;
    }
  }

  return undefined;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cx/agent test -- infer-component-state`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/agent/src/compose/infer-component-state.ts packages/agent/src/__tests__/infer-component-state.test.ts
git commit -m "feat(agent): add inferComponentState deterministic rules"
```

---

## Task 5: composeComponent에서 state 추론 호출

**Files:**
- Modify: `packages/agent/src/compose/compose-assets.ts:107-147`
- Test: `packages/agent/src/__tests__/compose-assets.test.ts` (기존 파일에 케이스 추가)

- [ ] **Step 1: Write the failing test**

`packages/agent/src/__tests__/compose-assets.test.ts` 에 새 `describe("composeComponent state inference", ...)` 블록을 파일 끝에 추가. 기존 파일 import 패턴을 따른다:

```ts
describe("composeAssetContents — component state inference", () => {
  it("annotates Checkbox with disabled state when props.disabled is true", () => {
    const tree: RegisteredNodeTree = {
      routes: [],
      areas: [],
      components: [
        {
          id: "c-disabled",
          order: 0,
          level: "component",
          name: "checkbox-x",
          type: "checkbox",
          props: { disabled: true, label: "x" },
        },
      ],
      warnings: [],
    };
    const result = composeAssetContents(tree);
    const node = result.composed.components?.find((c) => c.id === "c-disabled");
    expect(node?.state).toBe("disabled");
    expect(node?.stateReason).toContain("disabled");
  });

  it("omits state field when no signal present", () => {
    const tree: RegisteredNodeTree = {
      routes: [],
      areas: [],
      components: [
        {
          id: "c-default",
          order: 0,
          level: "component",
          name: "checkbox-y",
          type: "checkbox",
          props: { label: "y" },
        },
      ],
      warnings: [],
    };
    const result = composeAssetContents(tree);
    const node = result.composed.components?.find((c) => c.id === "c-default");
    expect(node?.state).toBeUndefined();
    expect(node?.stateReason).toBeUndefined();
  });
});
```

(이 테스트는 Task 6에서 Checkbox catalog에 `supportedStates: ["default", "disabled", ...]`가 등록되어야 통과한다. 순서상 Task 5 → 6 사이에 catalog 등록을 Task 6에서 한다. 따라서 Task 5 step 4의 테스트 실행은 FAIL이 예상되며, Task 6 step 4에서 모두 통과한다. 이 순서는 의도적이다 — compose-assets 변경과 catalog 채우기를 분리해 commit 단위를 작게 유지한다.)

대안: 이 테스트를 Task 6 commit에 포함시키는 것도 가능. 본 plan은 의도를 명확히 하기 위해 Task 5에서 코드만 도입하고 Task 6에서 catalog + 이 테스트 통과를 같이 가져간다.

수정된 Task 5 step 1: 위 테스트를 *작성만* 하되 실행은 Task 6에서. Step 2 생략. Step 3에서 코드 변경.

- [ ] **Step 2: Modify composeComponent**

`packages/agent/src/compose/compose-assets.ts:1` import 추가:

```ts
import { getComponentCatalogEntry } from "@cx/components/catalog";
import { inferComponentState } from "./infer-component-state";
```

`composeComponent` 함수의 `return` 블록(현재 137~146 라인) 직전에 추론 호출 추가:

```ts
	const inferred = inferComponentState(
		{ type, props: { ...existing, ...synthesized } },
		(componentType) => {
			const entry = getComponentCatalogEntry(componentType);
			return entry ? { supportedStates: entry.supportedStates } : null;
		},
	);
```

그리고 return 객체에 state 필드 spread 추가:

```ts
	return {
		id: component.id,
		name: component.name,
		order: component.order,
		...(component.description ? { description: component.description } : {}),
		type,
		...(component.policyID ? { policyID: component.policyID } : {}),
		props: { ...existing, ...synthesized },
		...(hooks.length > 0 ? { hooks } : {}),
		...(inferred ? { state: inferred.state, stateReason: inferred.reason } : {}),
	};
```

- [ ] **Step 3: Run typecheck to make sure code compiles**

Run: `pnpm --filter @cx/agent typecheck` (또는 `pnpm -r typecheck`)
Expected: PASS — `getComponentCatalogEntry` 시그니처와 supportedStates 필드 정합. catalog entry에 아직 supportedStates 안 채워져 있어도 optional이라 OK.

- [ ] **Step 4: Verify existing compose tests still pass**

Run: `pnpm --filter @cx/agent test -- compose-assets`
Expected: PASS — 기존 케이스 회귀 없음. 신규 케이스는 아직 FAIL (catalog 미충전).

- [ ] **Step 5: Commit**

```bash
git add packages/agent/src/compose/compose-assets.ts packages/agent/src/__tests__/compose-assets.test.ts
git commit -m "feat(agent): wire inferComponentState into composeComponent"
```

---

## Task 6: Pilot catalog에 supportedStates 채우기 (Checkbox / section-message / action-area)

**Files:**
- Modify: `packages/component/src/Checkbox/catalog.ts` (또는 카탈로그 등록 위치)
- Modify: section-message catalog 등록 위치
- Modify: action-area catalog 등록 위치

먼저 catalog 등록 위치를 확인한다.

- [ ] **Step 1: Locate the catalog entries**

Run:
```bash
grep -rn "type: \"checkbox\"" packages/component/src packages/components 2>/dev/null
grep -rn "type: \"section-message\"" packages/component/src packages/components 2>/dev/null
grep -rn "type: \"action-area\"" packages/component/src packages/components 2>/dev/null
```

각 파일 경로 메모.

- [ ] **Step 2: Add supportedStates to Checkbox**

Checkbox catalog entry에 추가:

```ts
supportedStates: ["default", "disabled", "error"] as const,
stateTokens: {
  disabled: { visualTokens: ["color.text.muted"] },
  error: { visualTokens: ["color.text.error", "color.border.strong"] },
},
```

근거: term-agree md에서 checkbox는 medium/small variant + onChange. 필수 약관 미동의 시 error 상태로 묶임 (케이스 분기 테이블 참조).

- [ ] **Step 3: Add supportedStates to section-message**

```ts
supportedStates: ["default", "error"] as const,
stateTokens: {
  error: { visualTokens: ["color.text.error", "color.surface.muted"] },
},
```

근거: term-agree의 section-message-required-error 가 negative variant. 본질적으로 error 표시용 컴포넌트.

- [ ] **Step 4: Add supportedStates to action-area**

```ts
supportedStates: ["default", "disabled"] as const,
stateTokens: {
  disabled: { visualTokens: ["color.text.muted"] },
},
```

근거: 다음 버튼 영역. 필수 약관 미동의 시 disabled로 전환되는 패턴 흔함.

- [ ] **Step 5: Run all related tests**

Run: `pnpm --filter @cx/agent test -- compose-assets`
Expected: PASS — Task 5에서 작성한 신규 케이스 2개 포함 모두 통과.

```bash
pnpm -r typecheck
```
Expected: PASS — Checkbox/section-message/action-area 컴포넌트의 prop 타입과 supportedStates 정합.

- [ ] **Step 6: Commit**

```bash
git add packages/component/
git commit -m "feat(components): declare supportedStates for Checkbox, section-message, action-area"
```

---

## Task 7: term-agree 실제 데이터 회귀 검증

**Files:**
- Test: `packages/agent/src/__tests__/term-agree-pilot.test.ts` (신규)

- [ ] **Step 1: Write integration test**

```ts
import { describe, expect, it } from "vitest";
import { composeAssetContents } from "../compose/compose-assets";
import type { RegisteredNodeTree } from "../types";

/**
 * ogn-mbr-term-agree pilot 회귀 케이스.
 * Composer가 prop 신호 없이 default를 유지하는지(=실수로 over-infer 하지 않는지) 확인.
 * 실제 client-import md는 disabled/error를 prop으로 표현하지 않으므로 state 미부여가 정상.
 */
describe("ogn-mbr-term-agree pilot", () => {
  const baseTree: RegisteredNodeTree = {
    routes: [],
    areas: [
      {
        level: "area" as const,
        id: "ogn-mbr-term-agree",
        order: 0,
        name: "약관 동의",
        layout: "vertical",
        children: [
          { componentId: "checkbox-all-agree", order: 0 },
          { componentId: "checkbox-term-required", order: 1 },
          { componentId: "checkbox-term-optional", order: 2 },
          { componentId: "section-message-required-error", order: 3 },
          { componentId: "action-area-next", order: 4 },
        ],
      },
    ],
    components: [
      { id: "checkbox-all-agree", order: 0, level: "component", name: "전체 동의", type: "checkbox", props: { variant: "medium", label: "전체 동의" } },
      { id: "checkbox-term-required", order: 1, level: "component", name: "필수 약관", type: "checkbox", props: { variant: "medium", label: "필수" } },
      { id: "checkbox-term-optional", order: 2, level: "component", name: "선택 약관", type: "checkbox", props: { variant: "small", label: "선택" } },
      { id: "section-message-required-error", order: 3, level: "component", name: "오류 안내", type: "section-message", props: { variant: "negative" } },
      { id: "action-area-next", order: 4, level: "component", name: "다음", type: "action-area", props: { variant: "strong" } },
    ],
    warnings: [],
  };

  it("does not assign state when props carry no signal", () => {
    const result = composeAssetContents(baseTree);
    const statesById = Object.fromEntries(
      (result.composed.components ?? []).map((c) => [c.id, c.state]),
    );
    expect(statesById["checkbox-all-agree"]).toBeUndefined();
    expect(statesById["checkbox-term-required"]).toBeUndefined();
    expect(statesById["section-message-required-error"]).toBeUndefined();
    expect(statesById["action-area-next"]).toBeUndefined();
  });

  it("assigns disabled to action-area when next button is gated", () => {
    const gatedTree: RegisteredNodeTree = {
      ...baseTree,
      components: baseTree.components.map((c) =>
        c.id === "action-area-next"
          ? { ...c, props: { ...c.props, disabled: true } }
          : c,
      ),
    };
    const result = composeAssetContents(gatedTree);
    const next = result.composed.components?.find((c) => c.id === "action-area-next");
    expect(next?.state).toBe("disabled");
    expect(next?.stateReason).toContain("disabled");
  });

  it("ignores disabled signal on components that do not support it", () => {
    const wrongTree: RegisteredNodeTree = {
      ...baseTree,
      components: baseTree.components.map((c) =>
        c.id === "section-message-required-error"
          ? { ...c, props: { ...c.props, disabled: true } }
          : c,
      ),
    };
    const result = composeAssetContents(wrongTree);
    const msg = result.composed.components?.find((c) => c.id === "section-message-required-error");
    expect(msg?.state).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test**

Run: `pnpm --filter @cx/agent test -- term-agree-pilot`
Expected: PASS (3 tests)

- [ ] **Step 3: Sanity check — full test suite**

Run: `pnpm -r test`
Expected: PASS — 전체 회귀 없음.

- [ ] **Step 4: Commit**

```bash
git add packages/agent/src/__tests__/term-agree-pilot.test.ts
git commit -m "test(agent): term-agree pilot regression for state inference"
```

---

## Task 8: agent-assets 재생성 + diff 검증

**Files:**
- 영향: `database/ai-imports/agent-assets.composed.json` (및 후속 단계 산출물)

- [ ] **Step 1: 현재 work-in-progress 변경 보존**

```bash
git status
```
Expected: 기존 modified 파일들은 별도 commit 또는 stash로 분리되어 있음 (본 plan 변경분과 섞이지 않게).

만약 섞여 있다면:
```bash
git stash push -m "wip-before-state-variant" -- database/ai-imports/
```

- [ ] **Step 2: agent-assets 재생성 명령 확인**

Run:
```bash
grep -rn "agent-assets" apps/web/src/server/agent/ scripts/ package.json 2>/dev/null | head -10
```

재생성 진입점을 찾아 명령어 메모 (예: `pnpm gen:assets` 같은 형태).

- [ ] **Step 3: 재생성 실행**

찾은 명령으로 재생성. 출력 파일이 갱신됨.

- [ ] **Step 4: diff 검토**

```bash
git diff database/ai-imports/agent-assets.composed.json | head -80
```

기대: 변경은 term-agree 관련 컴포넌트에 한정. 다른 area의 컴포넌트는 state 필드가 새로 추가되지 않아야 함 (supportedStates 미선언이므로).

term-agree pilot 컴포넌트는 client md에 disabled/loading 시그널이 없으므로 산출물에도 state 필드 변화가 없어야 함 (Task 7 첫 번째 케이스와 일치).

- [ ] **Step 5: Commit if expected**

산출물 변화가 위 기대와 일치하면:

```bash
git add database/ai-imports/
git commit -m "chore: regenerate agent-assets after state variant introduction"
```

산출물에 예상 외 변화가 있으면 commit 하지 말고 plan-eng-review로 회귀 원인 분석.

---

## Self-Review 결과

**Spec coverage:**
- State variant 어휘 도입 ✓ (Task 1)
- ComponentPropContract 확장 ✓ (Task 2)
- ComposedComponentNode 확장 ✓ (Task 3)
- Composer 자동 추론 (binding/children) ✓ (Task 4, 5) — 신호: disabled/loading/readonly/빈 배열
- Pilot: ogn-mbr-term-agree 전체 ✓ (Task 6 catalog + Task 7 회귀)
- agent-assets 재생성 ✓ (Task 8)

**알려진 한계 (의도적 out-of-scope):**
- Register가 area.md "케이스 분기" 테이블의 error 상태를 추출해서 section-message에 state="error"를 주입하는 path는 본 plan에서 다루지 않음 (Composer는 prop 신호에만 의존). 향후 Task로 분리.
- Decorator가 state별 pattern을 적용하는 로직은 다루지 않음. design-review-contracts에 새 시그널 추가도 별도 plan.
- bindings null 추론은 항목 형태(빈 배열) 만 처리. nullable 단일 값 binding은 향후.

**Placeholder 스캔:** 없음. 모든 step에 실제 코드/명령 포함.

**Type 정합성:** `ComponentState` 어휘는 Task 1에서 도입, Task 2/3/4 에서 일관되게 import. `supportedStates: readonly ComponentState[]` 타입은 contract↔inferer↔composer 전 구간 일치.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-26-component-state-variant.md`.**

두 가지 실행 옵션이 있습니다:

1. **Subagent-Driven (recommended)** — 각 Task마다 fresh subagent 디스패치 + Task 사이 리뷰. 빠른 반복.
2. **Inline Execution** — 현재 세션에서 executing-plans로 배치 실행 + 체크포인트 리뷰.

어느 방식으로 진행할까요?
