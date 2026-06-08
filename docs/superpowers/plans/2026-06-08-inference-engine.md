# Inference Engine: Claude Adapter + screen-generation@v1 Pipeline Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `@cx/inference`'s claude engine from a stub into a thin adapter that delegates to `@cx/agent`, and expand the inline 1-step `screen-generation@v1` pipeline into a declarative 5-step definition owned by the package.

**Architecture:** `run-step` passes the step's `prompt` ref through unchanged; the claude engine adapter maps `prompt.id` → `AgentTaskKind`, bundles resolved inputs/references/schema as context, and calls `runAgentTask`. `@cx/agent` owns prompt composition, task resolution, Claude execution, and the local-first/fallback policy. The pipeline definition lives in `packages/inference/src/pipelines/` as pure declaration; `apps/web` is a thin composition root that injects the real `createClaudeRunner`.

**Tech Stack:** TypeScript, pnpm monorepo (no build step — `main`/`types` → `src/index.ts`), Vitest (globals via root `vitest.config.ts`), Biome lint, `@cx/agent` (Claude Agent SDK runner), `@cx/schema` (output contracts + JSON schemas), `@cx/validation` (ajv).

Design doc: `docs/superpowers/specs/2026-06-08-inference-engine-design.md`

---

## File Structure

- `packages/inference/src/contracts/engine.ts` — MODIFY: `EngineRequest.prompt` becomes `PromptTemplateRef`; remove `PromptPayload`.
- `packages/inference/src/contracts/worker.ts` — MODIFY: `StepExecution.prompt` becomes `PromptTemplateRef`; fix import.
- `packages/inference/src/pipeline/run-step.ts` — MODIFY: pass `step.prompt` through; drop the messages JSON-dump.
- `packages/inference/src/engine/claude-engine.ts` — MODIFY: stub → adapter taking `AgentRuntime`.
- `packages/inference/src/worker/create-inference-runtime.ts` — MODIFY: add `claudeRunner`; wire claude engine; accept `pipelines: PipelineDefinition[]`.
- `packages/inference/src/pipelines/screen-generation-v1.ts` — CREATE: declarative 5-step definition.
- `packages/inference/package.json` — MODIFY: add `./pipelines/screen-generation-v1` subpath export.
- `apps/web/src/server/inference-runtime.ts` — MODIFY: import the pipeline def, inject `createClaudeRunner`, pass `pipelines: [...]`.
- `scripts/check-inference-boundaries.mjs` — CREATE: lightweight import guard for `pipelines/**`.
- `package.json` (root) — MODIFY: append the guard to the `lint` script.

Tests (all under `packages/inference/src/__tests__/`):
- `run-step.test.ts` — extend.
- `claude-engine.test.ts` — create.
- `screen-generation-v1.test.ts` — create.
- `create-inference-runtime.test.ts` — extend/adjust.
- `screen-generation-e2e.test.ts` — create.

**Build stays green after every task.** Test command throughout: `pnpm vitest run <path>` (from repo root).

---

## Task 1: Pass the prompt ref through to the engine

The claude adapter needs the step's `prompt.id` (the taskKind). Today `run-step.ts` discards it and builds a `{messages}` payload. Change `EngineRequest.prompt` and `StepExecution.prompt` to the ref type and pass it through.

**Files:**
- Modify: `packages/inference/src/contracts/engine.ts`
- Modify: `packages/inference/src/contracts/worker.ts:1`, `packages/inference/src/contracts/worker.ts:43`
- Modify: `packages/inference/src/pipeline/run-step.ts:11-19`
- Test: `packages/inference/src/__tests__/run-step.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test to `packages/inference/src/__tests__/run-step.test.ts` (keep existing tests):

```ts
it("passes the step.prompt ref through to the engine unchanged", async () => {
	let captured: unknown;
	const step = {
		id: "02-screen-intent",
		engine: "claude" as const,
		inputs: { sourceSpec: { kind: "context" as const, key: "source-spec" } },
		prompt: { id: "screen-intent" },
		output: { contractRef: { source: "output-contract" as const, id: "screen-intent" } },
	};
	const context = {
		resolveInput: async () => ({ a: 1 }),
		resolveReference: async () => ({}) as never,
		resolveOutputContract: async () => resolveOutputContractForInference("screen-intent"),
		engines: {
			claude: {
				async execute(request: { prompt?: unknown }) {
					captured = request.prompt;
					return {
						raw: {
							schemaVersion: SCHEMA_VERSION.screenIntent,
							screenPurpose: "x",
							contentPriority: [],
							sourceInterpretation: { defer: [], preserve: [], summarize: [] },
						},
					};
				},
			},
			function: { async execute() { return { raw: {} }; } },
		},
	};
	const result = await runStep(step, context as never);
	expect(captured).toEqual({ id: "screen-intent" });
	expect(result.status).toBe("succeeded");
});
```

Ensure the file's imports include (add any missing):

```ts
import { resolveOutputContractForInference, SCHEMA_VERSION } from "@cx/schema";
import { runStep } from "../pipeline/run-step";
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/run-step.test.ts`
Expected: FAIL — `captured` equals `{ messages: [...] }`, not `{ id: "screen-intent" }`.

- [ ] **Step 3: Change the contract types**

In `packages/inference/src/contracts/engine.ts`, replace the whole file body with:

```ts
import type { FunctionRef, KnowledgeValue, OutputContractValue, PromptTemplateRef } from "./step";

export type EngineRequest = {
	prompt?: PromptTemplateRef;
	run?: FunctionRef;
	inputs: Record<string, unknown>;
	references: Record<string, KnowledgeValue | KnowledgeValue[]>;
	outputContract: OutputContractValue;
};

export type EngineResult = { raw: unknown };

export interface Engine {
	execute(request: EngineRequest): Promise<EngineResult>;
}

export type EngineRegistry = Record<"claude" | "function", Engine>;
```

(`PromptPayload` is removed — it was only used here and in `worker.ts`.)

In `packages/inference/src/contracts/worker.ts`, change the first import line from:

```ts
import type { EngineRegistry, PromptPayload } from "./engine";
```
to:
```ts
import type { EngineRegistry } from "./engine";
```

Add `PromptTemplateRef` to the import from `./step` (line ~2-8), so it reads:

```ts
import type {
	KnowledgeRef,
	KnowledgeValue,
	OutputContractRef,
	PromptTemplateRef,
	StepInputRef,
} from "./step";
```

Then change the `StepExecution.prompt` field:

```ts
	prompt?: PromptTemplateRef;
```

- [ ] **Step 4: Change run-step to pass the ref through**

In `packages/inference/src/pipeline/run-step.ts`, replace:

```ts
	const prompt = step.prompt
		? { messages: [{ role: "user", content: JSON.stringify({ inputs, references }) }] }
		: undefined;
```
with:
```ts
	const prompt = step.prompt;
```

Leave the rest of the function unchanged (`engine.execute({ prompt, run: step.run, ... })` and the two `StepExecution` returns already include `prompt`).

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/run-step.test.ts`
Expected: PASS. If a pre-existing test asserted `prompt: { messages: [...] }` on the returned `StepExecution`, update that assertion to `prompt: { id: ... }` (or remove the prompt assertion) to match the new shape.

- [ ] **Step 6: Typecheck the package**

Run: `pnpm vitest run packages/inference/src/__tests__/` (runs the whole package suite; surfaces any remaining `.messages` references)
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/inference/src/contracts/engine.ts packages/inference/src/contracts/worker.ts packages/inference/src/pipeline/run-step.ts packages/inference/src/__tests__/run-step.test.ts
git commit -m "refactor(inference): pass step.prompt ref to engine instead of messages payload"
```

---

## Task 2: Claude engine adapter + runtime wiring

Replace the throwing stub with an adapter that delegates to `@cx/agent`, and wire it into `createInferenceRuntime` via an injected `claudeRunner`.

**Files:**
- Modify: `packages/inference/src/engine/claude-engine.ts`
- Modify: `packages/inference/src/worker/create-inference-runtime.ts`
- Test: `packages/inference/src/__tests__/claude-engine.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/inference/src/__tests__/claude-engine.test.ts`:

```ts
import { createAgentRuntime, type AgentRunRequest } from "@cx/agent";
import { resolveOutputContractForInference } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { createClaudeEngine } from "../engine/claude-engine";

describe("createClaudeEngine", () => {
	it("maps prompt.id to taskKind and returns payload as raw", async () => {
		let captured: AgentRunRequest | undefined;
		const runtime = createAgentRuntime({
			runner: async (request) => {
				captured = request;
				return { taskKind: request.taskKind, session: { mode: "new" }, payload: { hello: "world" } };
			},
		});
		const engine = createClaudeEngine(runtime);

		const result = await engine.execute({
			prompt: { id: "screen-intent" },
			inputs: { sourceSpec: { a: 1 } },
			references: {},
			outputContract: resolveOutputContractForInference("screen-intent"),
		});

		expect(captured?.taskKind).toBe("screen-intent");
		expect(result.raw).toEqual({ hello: "world" });
	});

	it("throws when prompt.id is missing", async () => {
		const engine = createClaudeEngine(
			createAgentRuntime({ runner: async () => { throw new Error("should not run"); } }),
		);
		await expect(
			engine.execute({
				inputs: {},
				references: {},
				outputContract: resolveOutputContractForInference("screen-intent"),
			}),
		).rejects.toThrow(/prompt\.id/);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/claude-engine.test.ts`
Expected: FAIL — current `createClaudeEngine()` takes no args and throws "claude engine not implemented yet".

- [ ] **Step 3: Implement the adapter**

Replace the entire contents of `packages/inference/src/engine/claude-engine.ts` with:

```ts
import { type AgentRuntime, type AgentTaskKind, runAgentTask } from "@cx/agent";
import type { Engine } from "../contracts";

/** Thin adapter: delegates a claude step to @cx/agent. Owns no domain mapping. */
export function createClaudeEngine(agentRuntime: AgentRuntime): Engine {
	return {
		async execute({ prompt, inputs, references, outputContract }) {
			if (!prompt?.id) {
				throw new Error("claude engine requires step.prompt.id (AgentTaskKind)");
			}
			const result = await runAgentTask(agentRuntime, {
				taskKind: prompt.id as AgentTaskKind,
				input: {
					query: `Produce ${outputContract.data.dtoName} (${outputContract.id}) from the provided context.`,
					context: { inputs, references, jsonSchema: outputContract.data.jsonSchema },
				},
			});
			return { raw: result.payload };
		},
	};
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/claude-engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire the adapter into the runtime**

In `packages/inference/src/worker/create-inference-runtime.ts`:

Change the import block to add `@cx/agent` and the runner type:

```ts
import { type AgentRunner, createAgentRuntime } from "@cx/agent";
import type { InferenceRuntime, KnowledgeBase, PipelineRegistry } from "../contracts";
```

Add `claudeRunner?: AgentRunner;` to the `config` object type (alongside `functions`, `knowledgeBase`, etc.).

Before the `return`, build the agent runtime:

```ts
	const agentRuntime = createAgentRuntime({ runner: config.claudeRunner });
```

Change the `engines.claude` wiring from `createClaudeEngine()` to:

```ts
		engines: {
			function: createFunctionEngine(config.functions ?? {}),
			claude: createClaudeEngine(agentRuntime),
		},
```

(With no `claudeRunner`, `@cx/agent`'s default runner throws `AgentRunnerNotConfiguredError` only when a claude step actually runs — function-only pipelines still construct and run.)

- [ ] **Step 6: Run the package suite**

Run: `pnpm vitest run packages/inference/src/__tests__/`
Expected: PASS (existing `create-inference-runtime.test.ts` uses only the function engine, so it stays green).

- [ ] **Step 7: Commit**

```bash
git add packages/inference/src/engine/claude-engine.ts packages/inference/src/worker/create-inference-runtime.ts packages/inference/src/__tests__/claude-engine.test.ts
git commit -m "feat(inference): claude engine adapter delegating to @cx/agent"
```

---

## Task 3: Declarative screen-generation@v1 pipeline definition

Create the 5-step pipeline as pure declaration in the package, and export it via a dedicated subpath (keeps the generic root index domain-free).

**Files:**
- Create: `packages/inference/src/pipelines/screen-generation-v1.ts`
- Modify: `packages/inference/package.json`
- Test: `packages/inference/src/__tests__/screen-generation-v1.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/inference/src/__tests__/screen-generation-v1.test.ts`:

```ts
import { resolveOutputContractForInference } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { screenGenerationPipelineV1 } from "../pipelines/screen-generation-v1";

describe("screenGenerationPipelineV1", () => {
	it("declares 5 ordered steps with the right engines", () => {
		expect(screenGenerationPipelineV1.id).toBe("screen-generation");
		expect(screenGenerationPipelineV1.version).toBe("v1");
		expect(screenGenerationPipelineV1.steps.map((s) => [s.id, s.engine])).toEqual([
			["01-source-spec", "function"],
			["02-screen-intent", "claude"],
			["03-composition", "claude"],
			["04-render-tree", "claude"],
			["05-quality", "claude"],
		]);
	});

	it("uses prompt.id as the taskKind for every claude step", () => {
		const claudeSteps = screenGenerationPipelineV1.steps.filter((s) => s.engine === "claude");
		expect(claudeSteps.map((s) => s.prompt?.id)).toEqual([
			"screen-intent",
			"composition-planning",
			"screen-generation",
			"quality-review",
		]);
		for (const step of claudeSteps) {
			expect(step.references ?? {}).toEqual({});
		}
	});

	it("every step output contract resolves", () => {
		for (const step of screenGenerationPipelineV1.steps) {
			expect(() => resolveOutputContractForInference(step.output.contractRef.id)).not.toThrow();
		}
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/screen-generation-v1.test.ts`
Expected: FAIL — cannot resolve `../pipelines/screen-generation-v1`.

- [ ] **Step 3: Create the pipeline definition**

Create `packages/inference/src/pipelines/screen-generation-v1.ts`:

```ts
import { context, definePipeline, defineStep, jobInput, outputContractRef } from "../pipeline";

/**
 * screen-generation@v1 — declarative only.
 * prompt.id is the @cx/agent AgentTaskKind; output.contractRef is the @cx/schema id.
 * claude steps carry no references: @cx/agent's task definitions own prompts/skills.
 */
export const screenGenerationPipelineV1 = definePipeline({
	id: "screen-generation",
	version: "v1",
	steps: [
		defineStep({
			id: "01-source-spec",
			engine: "function",
			inputs: { job: jobInput() },
			run: { id: "source-spec-mvp" },
			output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
		}),
		defineStep({
			id: "02-screen-intent",
			engine: "claude",
			inputs: { sourceSpec: context("source-spec") },
			prompt: { id: "screen-intent" },
			output: { contractRef: outputContractRef("screen-intent"), writeToContext: "screen-intent" },
		}),
		defineStep({
			id: "03-composition",
			engine: "claude",
			inputs: { sourceSpec: context("source-spec"), screenIntent: context("screen-intent") },
			prompt: { id: "composition-planning" },
			output: { contractRef: outputContractRef("composition-plan"), writeToContext: "composition-plan" },
		}),
		defineStep({
			id: "04-render-tree",
			engine: "claude",
			inputs: { compositionPlan: context("composition-plan"), screenIntent: context("screen-intent") },
			prompt: { id: "screen-generation" },
			output: { contractRef: outputContractRef("render-tree"), writeToContext: "render-tree" },
		}),
		defineStep({
			id: "05-quality",
			engine: "claude",
			inputs: { renderTree: context("render-tree"), compositionPlan: context("composition-plan") },
			prompt: { id: "quality-review" },
			output: { contractRef: outputContractRef("quality-inspection"), writeToContext: "quality-inspection" },
		}),
	],
});
```

- [ ] **Step 4: Add the subpath export**

In `packages/inference/package.json`, change the `exports` block to:

```json
	"exports": {
		".": "./src/index.ts",
		"./testing": "./src/testing/index.ts",
		"./pipelines/screen-generation-v1": "./src/pipelines/screen-generation-v1.ts"
	},
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/screen-generation-v1.test.ts`
Expected: PASS (all 3 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/inference/src/pipelines/screen-generation-v1.ts packages/inference/package.json packages/inference/src/__tests__/screen-generation-v1.test.ts
git commit -m "feat(inference): declarative screen-generation@v1 pipeline (5 steps)"
```

---

## Task 4: createInferenceRuntime accepts pipelines[]; wire apps/web composition root

Change `createInferenceRuntime` to accept an array of pipeline definitions (build the registry internally), then move `apps/web` to inject the pipeline def + the real `createClaudeRunner`. These move together so the contract change and its callers stay consistent.

**Files:**
- Modify: `packages/inference/src/worker/create-inference-runtime.ts`
- Modify: `packages/inference/src/__tests__/create-inference-runtime.test.ts`
- Modify: `apps/web/src/server/inference-runtime.ts`

- [ ] **Step 1: Update the existing runtime test to pass an array (failing)**

This test exercises the `pipelines[]` array wiring with a function-only pipeline (the full 5-step pipeline gets its own end-to-end test in Task 5, since its claude steps need a runner). Rewrite the test body in `packages/inference/src/__tests__/create-inference-runtime.test.ts` so the imports and runtime construction read:

```ts
import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
	createInferenceRuntime,
	definePipeline,
	defineStep,
	jobInput,
	outputContractRef,
	runInferenceJob,
} from "@cx/inference";
import { SCHEMA_VERSION } from "@cx/schema";
import { describe, expect, it } from "vitest";

describe("createInferenceRuntime", () => {
	it("builds a registry from pipelines[] and runs a function-engine step end-to-end", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-rt-"));
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines: [
				definePipeline({
					id: "src-only",
					version: "v1",
					steps: [
						defineStep({
							id: "01-source-spec",
							engine: "function",
							inputs: { job: jobInput() },
							run: { id: "source-spec-mvp" },
							output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
						}),
					],
				}),
			],
			functions: { "source-spec-mvp": () => ({ schemaVersion: SCHEMA_VERSION.sourceSpec }) },
		});

		const job = await runtime.jobStore.createJob({
			pipelineId: "src-only",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(runtime, job.jobId);

		const jobJson = JSON.parse(
			await readFile(path.join(dataRoot, "inference-jobs", job.jobId, "job.json"), "utf8"),
		);
		expect(jobJson.status).toBe("succeeded");
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/create-inference-runtime.test.ts`
Expected: FAIL — `createInferenceRuntime` still types `pipelines` as a `PipelineRegistry`, so passing an array is a type/runtime error (`config.pipelines.register` is not a function during registry use).

- [ ] **Step 3: Change createInferenceRuntime to accept an array**

In `packages/inference/src/worker/create-inference-runtime.ts`:

Update the import to add `PipelineDefinition` and drop `PipelineRegistry` if now unused as a config type:

```ts
import type { InferenceRuntime, KnowledgeBase, PipelineDefinition } from "../contracts";
```

Change the config field from `pipelines?: PipelineRegistry;` to:

```ts
	pipelines?: PipelineDefinition[];
```

Build the registry internally (the file already imports `createPipelineRegistry`):

```ts
	const pipelineRegistry = createPipelineRegistry();
	for (const definition of config.pipelines ?? []) {
		pipelineRegistry.register(definition);
	}
```

Change the returned `pipelines:` field from `config.pipelines ?? createPipelineRegistry()` to:

```ts
		pipelines: pipelineRegistry,
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/create-inference-runtime.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire apps/web composition root**

Replace the contents of `apps/web/src/server/inference-runtime.ts` with:

```ts
import path from "node:path";
import { createClaudeRunner } from "@cx/agent/claude";
import { createInferenceRuntime, type EngineRequest, type InferenceRuntime, runInferenceJob } from "@cx/inference";
import { screenGenerationPipelineV1 } from "@cx/inference/pipelines/screen-generation-v1";

const cwd = process.cwd();
const dataRoot = cwd.endsWith(`${path.sep}apps${path.sep}web`)
	? path.resolve(cwd, "../..", ".data")
	: path.resolve(cwd, ".data");

function buildSourceSpec(request: EngineRequest) {
	const jobInputValue =
		request.inputs.job && typeof request.inputs.job === "object"
			? (request.inputs.job as Record<string, unknown>)
			: {};
	const screenCode = typeof jobInputValue.screenCode === "string" ? jobInputValue.screenCode : "MVP-SCREEN";
	return {
		schemaVersion: "source-spec.v0.1",
		sourceImport: {
			files: [],
			importId: String(jobInputValue.importId ?? "api-inference-mvp"),
			receivedAt: new Date().toISOString(),
			sourceKind: "prdd-markdown-bundle",
		},
		sourceShape: {
			screen: {
				name: String(jobInputValue.name ?? screenCode),
				regions: [],
				route: String(jobInputValue.route ?? `/${screenCode.toLowerCase()}`),
				screenCode,
			},
		},
	};
}

export const inferenceRuntime: InferenceRuntime = createInferenceRuntime({
	dataRoot,
	pipelines: [screenGenerationPipelineV1],
	functions: { "source-spec-mvp": buildSourceSpec },
	claudeRunner: createClaudeRunner({ localFirst: true }),
});

export async function createInferenceJob(input: unknown) {
	const job = await inferenceRuntime.jobStore.createJob({
		pipelineId: "screen-generation",
		pipelineVersion: "v1",
		input,
	});
	void runInferenceJob(inferenceRuntime, job.jobId).catch((error) => {
		console.error(`runInferenceJob failed for job ${job.jobId}`, error);
	});
	return job;
}
```

- [ ] **Step 6: Verify the web app typechecks and the package suite passes**

Run: `pnpm vitest run packages/inference/src/__tests__/`
Expected: PASS.

Then typecheck the web app using the repo's existing script. Check `apps/web/package.json` for a `typecheck`/`build` script and run it (commonly `pnpm --filter <web-package-name> typecheck`). If none exists, run `pnpm exec tsc --noEmit -p apps/web/tsconfig.json`.
Expected: no errors in `apps/web/src/server/inference-runtime.ts`.

- [ ] **Step 7: Commit**

```bash
git add packages/inference/src/worker/create-inference-runtime.ts packages/inference/src/__tests__/create-inference-runtime.test.ts apps/web/src/server/inference-runtime.ts
git commit -m "feat(inference): createInferenceRuntime takes pipelines[]; wire web composition root"
```

---

## Task 5: End-to-end test — 5 steps green with a fake runner

Prove the full pipeline runs and every output validates, using a fake `AgentRunner` that returns minimal contract-valid payloads keyed by taskKind. No real Claude.

**Files:**
- Test: `packages/inference/src/__tests__/screen-generation-e2e.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/inference/src/__tests__/screen-generation-e2e.test.ts`:

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AgentRunner } from "@cx/agent";
import { SCHEMA_VERSION } from "@cx/schema";
import { createInferenceRuntime, runInferenceJob } from "@cx/inference";
import { screenGenerationPipelineV1 } from "@cx/inference/pipelines/screen-generation-v1";
import { describe, expect, it } from "vitest";

// Minimal payloads — required fields only, just enough to pass each JSON schema.
const payloadByTaskKind: Record<string, unknown> = {
	"screen-intent": {
		schemaVersion: SCHEMA_VERSION.screenIntent,
		screenPurpose: "x",
		contentPriority: [],
		sourceInterpretation: { defer: [], preserve: [], summarize: [] },
	},
	"composition-planning": {
		schemaVersion: SCHEMA_VERSION.compositionPlan,
		screenLayout: "layout.screen.Default",
		layoutStrategy: "x",
		sections: [{ targetRegion: "contents", role: "content", priority: 1, sourceRefs: ["a"], strategy: "x" }],
		visualHierarchy: "x",
		primaryUserAction: "x",
		sectionRhythm: "x",
		density: "medium",
		patternRationale: "x",
		rejectedPatterns: [],
	},
	"screen-generation": {
		version: SCHEMA_VERSION.renderTree,
		metadata: { id: "x" },
		children: [],
	},
	"quality-review": {
		schemaVersion: SCHEMA_VERSION.qualityInspection,
		inspection: { compositionAligned: true, sourceFaithful: true, visualHierarchyClear: true },
		findings: [],
		summary: { errorCount: 0, warningCount: 0 },
	},
};

const fakeRunner: AgentRunner = async (request) => ({
	taskKind: request.taskKind,
	session: { mode: "new" },
	payload: payloadByTaskKind[request.taskKind],
});

describe("screen-generation@v1 end-to-end", () => {
	it("runs all 5 steps to succeeded with a fake runner", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-e2e-"));
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines: [screenGenerationPipelineV1],
			functions: { "source-spec-mvp": () => ({ schemaVersion: SCHEMA_VERSION.sourceSpec }) },
			claudeRunner: fakeRunner,
		});

		const job = await runtime.jobStore.createJob({
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(runtime, job.jobId);

		await expect(runtime.jobStore.getJob(job.jobId)).resolves.toMatchObject({ status: "succeeded" });
		await expect(
			runtime.artifactStore.readJson(job.jobId, "context/quality-inspection.json"),
		).resolves.toMatchObject({ summary: { errorCount: 0, warningCount: 0 } });
	});
});
```

- [ ] **Step 2: Run the test to verify it fails (then drives implementation gaps)**

Run: `pnpm vitest run packages/inference/src/__tests__/screen-generation-e2e.test.ts`
Expected: This test should PASS if Tasks 1-4 are correct. If it FAILS, the failure pinpoints a real gap — e.g. a payload missing a required field (fix the fixture), or `artifactStore.readJson` path differs (confirm the context artifact path against `context-store.ts`). Do not weaken assertions to make it pass; fix the underlying cause.

- [ ] **Step 3: Confirm it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/screen-generation-e2e.test.ts`
Expected: PASS.

- [ ] **Step 4: Run the full package suite**

Run: `pnpm vitest run packages/inference/src/__tests__/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/inference/src/__tests__/screen-generation-e2e.test.ts
git commit -m "test(inference): screen-generation@v1 end-to-end green with fake runner"
```

---

## Task 6: Lightweight boundary guard for pipelines/**

Enforce that declarative pipeline definitions stay pure: no filesystem, no app imports, no deprecated packages. This is a focused regex guard, NOT the full AST import-graph checker described in the architecture doc (§970), which remains a separate effort.

**Files:**
- Create: `scripts/check-inference-boundaries.mjs`
- Modify: `package.json` (root) — `lint` script

- [ ] **Step 1: Create the guard script**

Create `scripts/check-inference-boundaries.mjs`:

```js
#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "packages/inference/src/pipelines";
const FORBIDDEN = [
	{ pattern: /@cx\/pipeline\b/, why: "@cx/pipeline (deprecated screen-generation internals)" },
	{ pattern: /@cx\/inference-nodes\b/, why: "@cx/inference-nodes (deprecated)" },
	{ pattern: /from\s+["']apps\//, why: "apps/* (pipelines must not import app code)" },
	{ pattern: /from\s+["']node:fs["']/, why: "node:fs (pipelines must be pure declarations)" },
];

function walk(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...walk(full));
		else if (full.endsWith(".ts")) out.push(full);
	}
	return out;
}

let failed = false;
let files = [];
try {
	files = walk(ROOT);
} catch {
	// Directory may not exist yet; nothing to check.
	process.exit(0);
}

for (const file of files) {
	const source = readFileSync(file, "utf8");
	for (const { pattern, why } of FORBIDDEN) {
		if (pattern.test(source)) {
			console.error(`[inference-boundaries] ${file}: forbidden import — ${why}`);
			failed = true;
		}
	}
}

if (failed) {
	console.error("\nPipeline definitions under packages/inference/src/pipelines must be pure declarations.");
	process.exit(1);
}
console.log(`[inference-boundaries] ok (${files.length} file(s) checked)`);
```

- [ ] **Step 2: Run it against the current tree (should pass)**

Run: `node scripts/check-inference-boundaries.mjs`
Expected: `[inference-boundaries] ok (1 file(s) checked)` and exit 0.

- [ ] **Step 3: Verify it catches a violation**

Temporarily add `import { readFileSync } from "node:fs";` to the top of `packages/inference/src/pipelines/screen-generation-v1.ts`, then:

Run: `node scripts/check-inference-boundaries.mjs`
Expected: exit 1 with `forbidden import — node:fs`.
Then remove the temporary line and re-run to confirm exit 0.

- [ ] **Step 4: Wire into lint**

In the root `package.json`, change the `lint` script from:

```json
"lint": "biome lint . && node scripts/check-react-hooks-policy.mjs apps packages",
```
to:
```json
"lint": "biome lint . && node scripts/check-react-hooks-policy.mjs apps packages && node scripts/check-inference-boundaries.mjs",
```

- [ ] **Step 5: Run lint**

Run: `pnpm lint`
Expected: PASS (biome + hooks policy + inference boundaries all green).

- [ ] **Step 6: Commit**

```bash
git add scripts/check-inference-boundaries.mjs package.json
git commit -m "chore(inference): guard pipelines/** against impure imports in lint"
```

---

## Final Verification

- [ ] **Run the whole inference suite + lint**

Run: `pnpm vitest run packages/inference/src/__tests__/ && pnpm lint`
Expected: all PASS.

- [ ] **Sanity-check the responsibility split**

Confirm by reading: `packages/inference/src/engine/claude-engine.ts` imports only `@cx/agent` + `../contracts` (no `@cx/schema` domain types beyond what `outputContract` carries), and `packages/inference/src/pipelines/screen-generation-v1.ts` imports only `../pipeline` (no runner, no fs, no apps).

---

## Out of Scope (future branches)

- Real prompt/skill knowledge docs for `screen-intent` / `composition-planning` in `@cx/agent`.
- Round-tripping the fully composed Claude prompt into step artifacts.
- The full AST import-graph boundary checker (architecture doc §970): cycles + cross-layer import rules. This plan ships only the focused `pipelines/**` regex guard.
- `pattern-selection` / `screen-revision` stages.
