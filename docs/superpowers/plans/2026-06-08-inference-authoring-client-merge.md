# @cx/inference Authoring + Client Merge Plan (onto main)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring this session's distinctive work onto the **merged `main`** (which already has the SSOT output-contract, knowledge resolvers, engine registry/contract, and `validateJsonSchema` wiring): promote main's hand-rolled app composition into reusable package helpers (engine impls, pipeline authoring, `createInferenceRuntime`, `createFakeEngine`), harden the worker, extract `resolve-input`, and add the client/read slice (read routes, hooks, demo page) that main lacks entirely.

**Architecture:** Branch off `main`. Adapt every addition to main's current contracts (`OutputContract.contractRef`, `KnowledgeRef` 5-source union, `EngineRequest.outputContract`, `runInferenceJob(runtime, jobId)`). Keep main's `run-step.ts`, `knowledge-base.ts`, contracts, and `validateJsonSchema` as-is.

**Tech Stack:** TypeScript, pnpm workspace, Vitest (`globals: true`), Next.js App Router, React (`EventSource`). No `useMemo`/`useCallback` (enforced by `scripts/check-react-hooks-policy.mjs`).

---

## What main already has (do NOT re-add)

- `contracts/engine.ts`: `Engine`, `EngineRequest` (incl. `outputContract`), `EngineRegistry` (`claude`/`function`).
- `pipeline/run-step.ts`: resolves inputs/refs/output-contract, dispatches `context.engines[step.engine].execute(...)`, validates `result.raw` via `validateJsonSchema(outputContract.data.jsonSchema, raw)`, fails (no coerce) with code `output_contract_validation_failed`.
- `knowledge/knowledge-base.ts`: `createInferenceKnowledgeBase()` → `resolve` (component/layout/skill/prompt-catalog/token) + `resolveOutputContract`.
- `worker/run-inference-job.ts`: orchestrator, arg order `runInferenceJob(runtime, jobId)`, writes `output-contract.json`, inline `resolveInput`/`readPath`/`normalizeError`.
- App: `apps/web/src/server/inference-runtime.ts` composes a runtime BY HAND (one ad-hoc `sourceSpecEngine` aliased to both `claude` and `function`; a no-op `register(){}` + hardcoded `get()`; a literal pipeline). `POST /api/inference` (202 `{jobId}`) + SSE `GET /api/inference/[jobId]/events`.

## What this plan adds (the gaps)

1. Package engine impls: `engine/function-engine.ts` (real dispatch by `run.id`), `engine/claude-engine.ts` (stub), `engine/index.ts`.
2. Pipeline authoring helpers: `pipeline/{define-step,define-pipeline,registry,refs,index}.ts`.
3. Test engine: `testing/fake-engine.ts` + `testing/index.ts` export.
4. Worker: pre-loop error fix + extract `worker/resolve-input.ts`.
5. `worker/create-inference-runtime.ts` composition root, and refactor the app's `server/inference-runtime.ts` to use it (replacing the hand-rolled engines/registry/pipeline) — existing source-spec demo must still pass.
6. Public `index.ts` exports for the new helpers.
7. Client/read slice: read routes (`/:jobId`, `/steps`, `/artifacts/[...]`), `inference-read.ts`, `inference-client.ts`, `inference-events-reducer.ts`, `use-inference`, `use-inference-stream`, `InferenceDemo` page.

## Setup

- [ ] **Step 0: Branch off main**

```bash
git checkout main && git checkout -b feature/inference-authoring-client
```

---

### Task 1: Package engine implementations

**Files:**
- Create: `packages/inference/src/engine/function-engine.ts`
- Create: `packages/inference/src/engine/claude-engine.ts`
- Create: `packages/inference/src/engine/index.ts`
- Test: `packages/inference/src/__tests__/engine.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/inference/src/__tests__/engine.test.ts`:

```ts
import type { EngineRequest } from "@cx/inference";
import { describe, expect, it } from "vitest";
import { createClaudeEngine } from "../engine/claude-engine";
import { createFunctionEngine } from "../engine/function-engine";

const baseRequest: EngineRequest = {
	inputs: { a: 1 },
	references: {},
	outputContract: { id: "source-spec", version: "v1", data: { jsonSchema: {} } } as never,
};

describe("function engine", () => {
	it("dispatches a registered function by run.id with the full request", async () => {
		const engine = createFunctionEngine({ echo: (req) => ({ echoed: req.inputs }) });
		const result = await engine.execute({ ...baseRequest, run: { id: "echo" } });
		expect(result.raw).toEqual({ echoed: { a: 1 } });
	});

	it("throws on missing run or unknown function", async () => {
		const engine = createFunctionEngine({});
		await expect(engine.execute(baseRequest)).rejects.toThrow();
		await expect(engine.execute({ ...baseRequest, run: { id: "nope" } })).rejects.toThrow();
	});
});

describe("claude engine (stub)", () => {
	it("throws not-implemented", async () => {
		await expect(createClaudeEngine().execute(baseRequest)).rejects.toThrow(/not implemented/i);
	});
});
```

- [ ] **Step 2: Run → fail** (`pnpm vitest run packages/inference/src/__tests__/engine.test.ts`).

- [ ] **Step 3: Implement**

`packages/inference/src/engine/function-engine.ts`:

```ts
import type { Engine, EngineRequest } from "../contracts";

export type InferenceFunction = (request: EngineRequest) => unknown | Promise<unknown>;

export function createFunctionEngine(functions: Record<string, InferenceFunction>): Engine {
	return {
		async execute(request) {
			if (!request.run) throw new Error("function engine requires step.run");
			const fn = functions[request.run.id];
			if (!fn) throw new Error(`Unknown function: ${request.run.id}`);
			return { raw: await fn(request) };
		},
	};
}
```

`packages/inference/src/engine/claude-engine.ts`:

```ts
import type { Engine } from "../contracts";

/** Stub until the Claude Agent SDK execution path is wired. Throws so misuse is loud. */
export function createClaudeEngine(): Engine {
	return {
		async execute() {
			throw new Error("claude engine not implemented yet");
		},
	};
}
```

`packages/inference/src/engine/index.ts`:

```ts
export { createClaudeEngine } from "./claude-engine";
export { createFunctionEngine, type InferenceFunction } from "./function-engine";
```

- [ ] **Step 4: Run → pass.**

- [ ] **Step 5: Commit**

```bash
git add packages/inference/src/engine packages/inference/src/__tests__/engine.test.ts
git commit -m "feat(inference): package function + claude engine implementations"
```

---

### Task 2: Pipeline authoring helpers

**Files:**
- Create: `packages/inference/src/pipeline/define-step.ts`
- Create: `packages/inference/src/pipeline/define-pipeline.ts`
- Create: `packages/inference/src/pipeline/registry.ts`
- Create: `packages/inference/src/pipeline/refs.ts`
- Create: `packages/inference/src/pipeline/index.ts`
- Test: `packages/inference/src/__tests__/pipeline-authoring.test.ts`

> Note: main's `pipeline/` only has `run-step.ts`. Do NOT touch it. Add `index.ts` exporting the new helpers AND re-exporting `runStep` (so `../pipeline` stays the barrel).

- [ ] **Step 1: Write the failing test**

`packages/inference/src/__tests__/pipeline-authoring.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
	createPipelineRegistry,
	definePipeline,
	defineStep,
	jobInput,
	knowledge,
	outputContractRef,
} from "../pipeline";

const step = defineStep({
	id: "01-analyze",
	engine: "function",
	inputs: { job: jobInput() },
	references: { skill: knowledge("skill", "screen-generation") },
	run: { id: "source-spec-mvp" },
	output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
});

describe("pipeline authoring", () => {
	it("builds refs and step literals", () => {
		expect(step.inputs?.job).toEqual({ kind: "job-input", path: undefined });
		expect(step.references?.skill).toEqual({ source: "skill", id: "screen-generation", version: undefined });
		expect(step.output.contractRef).toEqual({ source: "output-contract", id: "source-spec", version: undefined });
	});

	it("registry resolves by id@version and throws on unknown", () => {
		const reg = createPipelineRegistry();
		reg.register(definePipeline({ id: "screen-generation", version: "v1", steps: [step] }));
		expect(reg.get("screen-generation", "v1").steps).toHaveLength(1);
		expect(() => reg.get("screen-generation", "v2")).toThrow();
	});
});
```

- [ ] **Step 2: Run → fail.**

- [ ] **Step 3: Implement**

`packages/inference/src/pipeline/define-step.ts`:

```ts
import type { InferenceStepDefinition } from "../contracts";

export function defineStep<const T extends InferenceStepDefinition>(step: T): T {
	return step;
}
```

`packages/inference/src/pipeline/define-pipeline.ts`:

```ts
import type { PipelineDefinition } from "../contracts";

export function definePipeline<const T extends PipelineDefinition>(pipeline: T): T {
	return pipeline;
}
```

`packages/inference/src/pipeline/registry.ts`:

```ts
import type { PipelineDefinition, PipelineRegistry } from "../contracts";

export function createPipelineRegistry(): PipelineRegistry {
	const map = new Map<string, PipelineDefinition>();
	const key = (id: string, version: string) => `${id}@${version}`;
	return {
		register(pipeline) {
			map.set(key(pipeline.id, pipeline.version), pipeline);
		},
		get(id, version) {
			const found = map.get(key(id, version));
			if (!found) throw new Error(`Unknown pipeline: ${key(id, version)}`);
			return found;
		},
	};
}
```

`packages/inference/src/pipeline/refs.ts`:

```ts
import type { KnowledgeRef, OutputContractRef, StepInputRef } from "../contracts";

export const jobInput = (path?: string): StepInputRef => ({ kind: "job-input", path });
export const stepOutput = (stepId: string, outputName?: string): StepInputRef => ({
	kind: "step-output",
	stepId,
	outputName,
});
export const context = (key: string): StepInputRef => ({ kind: "context", key });
export const artifact = (path: string): StepInputRef => ({ kind: "artifact", path });
export const value = (input: unknown): StepInputRef => ({ kind: "value", value: input });

export const knowledge = (source: KnowledgeRef["source"], id?: string, version?: string): KnowledgeRef => ({
	source,
	id,
	version,
});

export const outputContractRef = (id: string, version?: string): OutputContractRef => ({
	source: "output-contract",
	id,
	version,
});
```

`packages/inference/src/pipeline/index.ts`:

```ts
export { defineStep } from "./define-step";
export { definePipeline } from "./define-pipeline";
export { createPipelineRegistry } from "./registry";
export { artifact, context, jobInput, knowledge, outputContractRef, stepOutput, value } from "./refs";
export { runStep } from "./run-step";
```

- [ ] **Step 4: Run → pass.**

- [ ] **Step 5: Commit**

```bash
git add packages/inference/src/pipeline/define-step.ts packages/inference/src/pipeline/define-pipeline.ts packages/inference/src/pipeline/registry.ts packages/inference/src/pipeline/refs.ts packages/inference/src/pipeline/index.ts packages/inference/src/__tests__/pipeline-authoring.test.ts
git commit -m "feat(inference): pipeline authoring helpers (defineStep/definePipeline/registry/refs)"
```

---

### Task 3: Test fake engine

**Files:**
- Create: `packages/inference/src/testing/fake-engine.ts`
- Modify: `packages/inference/src/testing/index.ts` (add export)
- Test: `packages/inference/src/__tests__/fake-engine.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/inference/src/__tests__/fake-engine.test.ts`:

```ts
import type { EngineRequest } from "@cx/inference";
import { describe, expect, it } from "vitest";
import { createFakeEngine } from "../testing/fake-engine";

const req: EngineRequest = {
	inputs: { a: 1 },
	references: {},
	outputContract: { id: "x", version: "v1", data: { jsonSchema: {} } } as never,
};

describe("createFakeEngine", () => {
	it("records calls and returns the programmed raw", async () => {
		const engine = createFakeEngine((r) => ({ seen: r.inputs }));
		const result = await engine.execute(req);
		expect(result.raw).toEqual({ seen: { a: 1 } });
		expect(engine.calls).toHaveLength(1);
		expect(engine.calls[0]?.outputContract.id).toBe("x");
	});
});
```

- [ ] **Step 2: Run → fail.**

- [ ] **Step 3: Implement**

`packages/inference/src/testing/fake-engine.ts`:

```ts
import type { Engine, EngineRequest } from "../contracts";

export type FakeEngine = Engine & { calls: EngineRequest[] };

export function createFakeEngine(respond: (request: EngineRequest) => unknown): FakeEngine {
	const calls: EngineRequest[] = [];
	return {
		calls,
		async execute(request) {
			calls.push(request);
			return { raw: respond(request) };
		},
	};
}
```

Modify `packages/inference/src/testing/index.ts` to add (keep the existing `MemoryArtifactStore` export):

```ts
export { MemoryArtifactStore } from "./memory-artifact-store";
export { createFakeEngine, type FakeEngine } from "./fake-engine";
```

- [ ] **Step 4: Run → pass.**

- [ ] **Step 5: Commit**

```bash
git add packages/inference/src/testing/fake-engine.ts packages/inference/src/testing/index.ts packages/inference/src/__tests__/fake-engine.test.ts
git commit -m "feat(inference): createFakeEngine test double"
```

---

### Task 4: Worker pre-loop fix + extract resolve-input

**Files:**
- Create: `packages/inference/src/worker/resolve-input.ts`
- Modify: `packages/inference/src/worker/run-inference-job.ts`
- Test: `packages/inference/src/__tests__/worker-resilience.test.ts`

main's worker currently runs `getJob` / `pipelines.get` / `job_started` BEFORE its `try`, so an unknown `pipelineId` throws uncaught (no `job_failed`, SSE hangs). It also inlines `resolveInput`/`readPath`. Move resolution into a file and bring the pre-loop work inside `try`.

- [ ] **Step 1: Write the failing resilience test**

`packages/inference/src/__tests__/worker-resilience.test.ts`:

```ts
import { createInferenceKnowledgeBase, type InferenceRuntime, runInferenceJob } from "@cx/inference";
import { describe, expect, it } from "vitest";
import { createContextStore } from "../context/context-store";
import { createJobStore } from "../stores/job-store";
import { MemoryArtifactStore } from "../testing/memory-artifact-store";
import { createFakeEngine } from "../testing/fake-engine";

function runtimeWithNoPipelines(): InferenceRuntime {
	const artifactStore = new MemoryArtifactStore();
	const jobStore = createJobStore(artifactStore, { now: () => "t", newId: () => "job-1" });
	const engine = createFakeEngine(() => ({}));
	return {
		artifactStore,
		createContextStore: (jobId) => createContextStore(jobId, artifactStore),
		engines: { claude: engine, function: engine },
		jobStore,
		knowledgeBase: createInferenceKnowledgeBase(),
		now: () => "t",
		newId: () => "x",
		pipelines: {
			register() {},
			get() {
				throw new Error("Unknown pipeline");
			},
		},
	};
}

describe("runInferenceJob resilience", () => {
	it("marks the job failed (no throw) when the pipeline is unknown", async () => {
		const runtime = runtimeWithNoPipelines();
		const job = await runtime.jobStore.createJob({ pipelineId: "ghost", pipelineVersion: "v9", input: {} });
		await expect(runInferenceJob(runtime, job.jobId)).resolves.toBeUndefined();
		expect((await runtime.jobStore.getJob(job.jobId)).status).toBe("failed");
		const events = await runtime.jobStore.listEvents(job.jobId);
		expect(events.at(-1)?.type).toBe("job_failed");
	});
});
```

- [ ] **Step 2: Run → fail** (currently the unknown-pipeline throw escapes; the job stays `queued` and no `job_failed` is emitted).

- [ ] **Step 3: Create `worker/resolve-input.ts`** (lift main's inline resolver)

`packages/inference/src/worker/resolve-input.ts`:

```ts
import type { ContextStore, InferenceRuntime, StepInputRef } from "../contracts";

export async function resolveInput(
	jobId: string,
	jobInput: unknown,
	ref: StepInputRef,
	runtime: InferenceRuntime,
	contextStore: ContextStore,
): Promise<unknown> {
	switch (ref.kind) {
		case "job-input":
			return ref.path ? readPath(jobInput, ref.path) : jobInput;
		case "step-output":
			return runtime.artifactStore.readJson(jobId, `steps/${ref.stepId}/output.json`);
		case "context":
			return contextStore.readJson(ref.key);
		case "artifact":
			return runtime.artifactStore.readJson(jobId, ref.path);
		case "value":
			return ref.value;
	}
}

function readPath(value: unknown, path: string): unknown {
	return path.split(".").reduce<unknown>((current, key) => {
		if (current && typeof current === "object" && key in current) {
			return (current as Record<string, unknown>)[key];
		}
		return undefined;
	}, value);
}
```

- [ ] **Step 4: Rewrite `worker/run-inference-job.ts`** (full file — pre-loop work now inside `try`, inline resolver removed, import the extracted one)

```ts
import type { InferenceRuntime } from "../contracts";
import { runStep } from "../pipeline/run-step";
import { resolveInput } from "./resolve-input";

export async function runInferenceJob(runtime: InferenceRuntime, jobId: string): Promise<void> {
	try {
		const job = await runtime.jobStore.getJob(jobId);
		const pipeline = runtime.pipelines.get(job.pipelineId, job.pipelineVersion);
		const contextStore = runtime.createContextStore(jobId);

		await runtime.jobStore.updateJob(jobId, { status: "running" });
		await runtime.jobStore.appendEvent(jobId, { jobId, type: "job_started", timestamp: runtime.now() });

		for (const step of pipeline.steps) {
			await runtime.jobStore.createStep(jobId, step.id);
			await runtime.jobStore.updateJob(jobId, { currentStepId: step.id });
			await runtime.jobStore.updateStep(jobId, step.id, { status: "running", startedAt: runtime.now() });
			await runtime.jobStore.appendEvent(jobId, {
				jobId,
				stepId: step.id,
				type: "step_started",
				timestamp: runtime.now(),
			});

			const execution = await runStep(step, {
				engines: runtime.engines,
				resolveInput: (ref) => resolveInput(jobId, job.input, ref, runtime, contextStore),
				resolveReference: (ref) => runtime.knowledgeBase.resolve(ref),
				resolveOutputContract: (ref) => runtime.knowledgeBase.resolveOutputContract(ref),
			});

			const stepRoot = `steps/${step.id}`;
			await runtime.artifactStore.writeJson(jobId, `${stepRoot}/inputs.json`, execution.inputs);
			await runtime.artifactStore.writeJson(jobId, `${stepRoot}/references.json`, execution.references);
			await runtime.artifactStore.writeJson(jobId, `${stepRoot}/output-contract.json`, execution.outputContract);
			if (execution.prompt) {
				await runtime.artifactStore.writeJson(jobId, `${stepRoot}/prompt.json`, execution.prompt);
			}
			await runtime.artifactStore.writeJson(jobId, `${stepRoot}/raw-response.json`, execution.raw);

			if (execution.status === "failed") {
				await runtime.jobStore.updateStep(jobId, step.id, {
					status: "failed",
					completedAt: runtime.now(),
					error: execution.error,
				});
				await runtime.jobStore.appendEvent(jobId, {
					jobId,
					stepId: step.id,
					type: "step_failed",
					timestamp: runtime.now(),
					payload: execution.error,
				});
				throw execution.error ?? new Error(`Step failed: ${step.id}`);
			}

			await runtime.artifactStore.writeJson(jobId, `${stepRoot}/output.json`, execution.output);
			for (const [key, value] of Object.entries(execution.contextWrites ?? {})) {
				await contextStore.writeJson(key, value);
			}
			await runtime.jobStore.updateStep(jobId, step.id, { status: "succeeded", completedAt: runtime.now() });
			await runtime.jobStore.appendEvent(jobId, {
				jobId,
				stepId: step.id,
				type: "step_completed",
				timestamp: runtime.now(),
			});
		}

		await runtime.jobStore.updateJob(jobId, { status: "succeeded", currentStepId: undefined });
		await runtime.jobStore.appendEvent(jobId, { jobId, type: "job_completed", timestamp: runtime.now() });
	} catch (error) {
		const normalized = normalizeError(error);
		try {
			await runtime.jobStore.updateJob(jobId, { status: "failed", error: normalized });
			await runtime.jobStore.appendEvent(jobId, {
				jobId,
				type: "job_failed",
				timestamp: runtime.now(),
				payload: normalized,
			});
		} catch {
			// best-effort: store itself is broken, nothing more to record
		}
	}
}

function normalizeError(error: unknown): { code: string; message: string } {
	if (error && typeof error === "object" && "code" in error && "message" in error) {
		return error as { code: string; message: string };
	}
	return {
		code: "inference_job_failed",
		message: error instanceof Error ? error.message : String(error),
	};
}
```

- [ ] **Step 5: Run the resilience test + the existing worker test → both pass**

Run: `pnpm vitest run packages/inference/src/__tests__/worker-resilience.test.ts packages/inference/src/__tests__/worker.test.ts`
Expected: PASS (existing `worker.test.ts` still green — behavior on the happy path is unchanged; only error-path coverage was added and resolution was extracted).

- [ ] **Step 6: Commit**

```bash
git add packages/inference/src/worker/resolve-input.ts packages/inference/src/worker/run-inference-job.ts packages/inference/src/__tests__/worker-resilience.test.ts
git commit -m "fix(inference): worker reaches terminal state on pre-loop errors; extract resolve-input"
```

---

### Task 5: createInferenceRuntime + refactor app composition

**Files:**
- Create: `packages/inference/src/worker/create-inference-runtime.ts`
- Modify: `packages/inference/src/index.ts` (export it — see Task 6, but add here so the app can import)
- Modify: `apps/web/src/server/inference-runtime.ts` (use the factory + real registry + registered function)
- Test: `packages/inference/src/__tests__/create-inference-runtime.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/inference/src/__tests__/create-inference-runtime.test.ts`:

```ts
import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
	createInferenceRuntime,
	createPipelineRegistry,
	definePipeline,
	defineStep,
	jobInput,
	outputContractRef,
	runInferenceJob,
} from "@cx/inference";
import { describe, expect, it } from "vitest";

describe("createInferenceRuntime", () => {
	it("wires a file-backed runtime that runs a function-engine step end-to-end", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-rt-"));
		const pipelines = createPipelineRegistry();
		pipelines.register(
			definePipeline({
				id: "screen-generation",
				version: "v1",
				steps: [
					defineStep({
						id: "01-analyze",
						engine: "function",
						inputs: { job: jobInput() },
						run: { id: "source-spec-mvp" },
						output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
					}),
				],
			}),
		);
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines,
			functions: {
				"source-spec-mvp": () => ({
					schemaVersion: "source-spec.v0.1",
					sourceImport: {
						files: [],
						importId: "test",
						receivedAt: "2026-06-08T00:00:00.000Z",
						sourceKind: "prdd-markdown-bundle",
					},
					sourceShape: {
						screen: { name: "T", regions: [], route: "/t", screenCode: "T" },
					},
				}),
			},
		});

		const job = await runtime.jobStore.createJob({
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
			input: { screenCode: "T" },
		});
		await runInferenceJob(runtime, job.jobId);

		const jobJson = JSON.parse(await readFile(path.join(dataRoot, "inference-jobs", job.jobId, "job.json"), "utf8"));
		expect(jobJson.status).toBe("succeeded");
	});
});
```

> The function returns a contract-valid `source-spec` so main's `validateJsonSchema(outputContract.data.jsonSchema, raw)` passes. The shape mirrors `validSourceSpec` in main's `worker.test.ts`.

- [ ] **Step 2: Run → fail** (`createInferenceRuntime` not exported).

- [ ] **Step 3: Implement `create-inference-runtime.ts`**

`packages/inference/src/worker/create-inference-runtime.ts`:

```ts
import type { InferenceRuntime, KnowledgeBase, PipelineRegistry } from "../contracts";
import { createContextStore } from "../context/context-store";
import { createClaudeEngine } from "../engine/claude-engine";
import { createFunctionEngine, type InferenceFunction } from "../engine/function-engine";
import { createInferenceKnowledgeBase } from "../knowledge/knowledge-base";
import { createJobStore } from "../stores/job-store";
import { FileArtifactStore } from "../stores/file-artifact-store";
import { createPipelineRegistry } from "../pipeline/registry";

let counter = 0;

export function createInferenceRuntime(config: {
	pipelines?: PipelineRegistry;
	dataRoot?: string;
	functions?: Record<string, InferenceFunction>;
	knowledgeBase?: KnowledgeBase;
	now?: () => string;
	newId?: () => string;
}): InferenceRuntime {
	const artifactStore = new FileArtifactStore(config.dataRoot ?? ".data");
	const now = config.now ?? (() => new Date().toISOString());
	const newId = config.newId ?? (() => `job-${Date.now().toString(36)}-${(counter++).toString(36)}`);
	const jobStore = createJobStore(artifactStore, { now, newId });

	return {
		artifactStore,
		createContextStore: (jobId) => createContextStore(jobId, artifactStore),
		engines: {
			function: createFunctionEngine(config.functions ?? {}),
			claude: createClaudeEngine(),
		},
		jobStore,
		knowledgeBase: config.knowledgeBase ?? createInferenceKnowledgeBase(),
		pipelines: config.pipelines ?? createPipelineRegistry(),
		now,
		newId,
	};
}
```

> `newId` avoids `Math.random` for determinism friendliness; the app may override.

- [ ] **Step 4: Add the export to `packages/inference/src/index.ts`** (full export of new helpers happens in Task 6; add at least this line now so the test + app resolve):

```ts
export { createInferenceRuntime } from "./worker/create-inference-runtime";
```

- [ ] **Step 5: Run the test → pass.**

- [ ] **Step 6: Refactor `apps/web/src/server/inference-runtime.ts`** to use the factory, a real registry, and a registered function (preserving the existing source-spec behavior). Full replacement:

```ts
import path from "node:path";
import {
	createInferenceRuntime,
	createPipelineRegistry,
	definePipeline,
	defineStep,
	type EngineRequest,
	type InferenceRuntime,
	jobInput,
	outputContractRef,
	runInferenceJob,
} from "@cx/inference";

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

const pipelines = createPipelineRegistry();
pipelines.register(
	definePipeline({
		id: "screen-generation",
		version: "v1",
		steps: [
			defineStep({
				id: "01-analyze",
				engine: "function",
				inputs: { job: jobInput() },
				run: { id: "source-spec-mvp" },
				output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
			}),
		],
	}),
);

export const inferenceRuntime: InferenceRuntime = createInferenceRuntime({
	dataRoot,
	pipelines,
	functions: { "source-spec-mvp": buildSourceSpec },
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

- [ ] **Step 7: Verify the existing demo still works** — full package suite + typecheck-light:

Run: `pnpm vitest run packages/inference`
Expected: PASS (all existing + new tests).

- [ ] **Step 8: Commit**

```bash
git add packages/inference/src/worker/create-inference-runtime.ts packages/inference/src/index.ts apps/web/src/server/inference-runtime.ts packages/inference/src/__tests__/create-inference-runtime.test.ts
git commit -m "feat(inference): createInferenceRuntime factory; app uses real registry + function engine"
```

---

### Task 6: Public surface exports

**Files:**
- Modify: `packages/inference/src/index.ts`

- [ ] **Step 1: Add the new exports** (keep all existing main exports; append the authoring/engine helpers). The file should export:

```ts
export { createContextStore } from "./context/context-store";
export type * from "./contracts";
export { createClaudeEngine, createFunctionEngine, type InferenceFunction } from "./engine";
export { createInferenceKnowledgeBase } from "./knowledge/knowledge-base";
export {
	artifact,
	context,
	createPipelineRegistry,
	defineStep,
	definePipeline,
	jobInput,
	knowledge,
	outputContractRef,
	runStep,
	stepOutput,
	value,
} from "./pipeline";
export { FileArtifactStore } from "./stores/file-artifact-store";
export { createJobStore } from "./stores/job-store";
export { createInferenceRuntime } from "./worker/create-inference-runtime";
export { runInferenceJob } from "./worker/run-inference-job";
```

- [ ] **Step 2: Verify imports resolve**

Run: `pnpm vitest run packages/inference`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/inference/src/index.ts
git commit -m "feat(inference): export authoring helpers, engines, runtime factory"
```

---

### Task 7: Client + read slice

**Files:**
- Create: `apps/web/src/lib/inference-read.ts` + `.test.ts`
- Create: `apps/web/src/app/api/inference/[jobId]/route.ts`
- Create: `apps/web/src/app/api/inference/[jobId]/steps/route.ts`
- Create: `apps/web/src/app/api/inference/[jobId]/artifacts/[...artifactPath]/route.ts`
- Create: `apps/web/src/lib/inference-events-reducer.ts` + `.test.ts`
- Create: `apps/web/src/lib/inference-client.ts` + `.test.ts`
- Create: `apps/web/src/model/inference/use-inference.ts`
- Create: `apps/web/src/model/inference/use-inference-stream.ts`
- Create: `apps/web/src/components/inference/InferenceDemo.tsx`
- Create: `apps/web/src/app/inference-demo/page.tsx`

> The shared runtime is `@/server/inference-runtime` (main's location). Step artifacts now include `output-contract.json`; the read allowlist permits it (`steps/<id>/<name>.json` covers the hyphen). The POST route already returns `{ jobId }`; the SSE route already streams `event: <type>` / `data: <json>`.

- [ ] **Step 1: Read helper — failing test** `apps/web/src/lib/inference-read.test.ts`:

```ts
import {
	createInferenceKnowledgeBase,
	createJobStore,
	type InferenceRuntime,
	createPipelineRegistry,
	definePipeline,
	defineStep,
	jobInput,
	outputContractRef,
	runInferenceJob,
} from "@cx/inference";
import { createContextStore } from "@cx/inference";
import { MemoryArtifactStore, createFakeEngine } from "@cx/inference/testing";
import { describe, expect, it } from "vitest";
import { readArtifact, readStepSnapshots } from "./inference-read";

const validSourceSpec = {
	schemaVersion: "source-spec.v0.1",
	sourceImport: { files: [], importId: "t", receivedAt: "2026-06-08T00:00:00.000Z", sourceKind: "prdd-markdown-bundle" },
	sourceShape: { screen: { name: "T", regions: [], route: "/t", screenCode: "T" } },
};

async function runDemo() {
	const artifactStore = new MemoryArtifactStore();
	const jobStore = createJobStore(artifactStore, { now: () => "t", newId: () => "job-1" });
	const engine = createFakeEngine(() => validSourceSpec);
	const pipelines = createPipelineRegistry();
	pipelines.register(
		definePipeline({
			id: "screen-generation",
			version: "v1",
			steps: [
				defineStep({
					id: "01-analyze",
					engine: "function",
					inputs: { job: jobInput() },
					run: { id: "fake" },
					output: { contractRef: outputContractRef("source-spec"), writeToContext: "source-spec" },
				}),
			],
		}),
	);
	const runtime: InferenceRuntime = {
		artifactStore,
		createContextStore: (jobId) => createContextStore(jobId, artifactStore),
		engines: { claude: engine, function: engine },
		jobStore,
		knowledgeBase: createInferenceKnowledgeBase(),
		now: () => "t",
		newId: () => "x",
		pipelines,
	};
	const job = await jobStore.createJob({ pipelineId: "screen-generation", pipelineVersion: "v1", input: { screenCode: "T" } });
	await runInferenceJob(runtime, job.jobId);
	return { runtime, jobId: job.jobId };
}

describe("readStepSnapshots", () => {
	it("returns one snapshot per declared step", async () => {
		const { runtime, jobId } = await runDemo();
		const steps = await readStepSnapshots(runtime, jobId);
		expect(steps).toHaveLength(1);
		expect(steps[0]).toMatchObject({ stepId: "01-analyze", status: "succeeded" });
	});
});

describe("readArtifact", () => {
	it("reads allowed artifacts incl. output-contract.json; rejects traversal", async () => {
		const { runtime, jobId } = await runDemo();
		expect(JSON.parse(await readArtifact(runtime, jobId, "steps/01-analyze/output.json"))).toEqual(validSourceSpec);
		await expect(readArtifact(runtime, jobId, "steps/01-analyze/output-contract.json")).resolves.toBeTruthy();
		await expect(readArtifact(runtime, jobId, "../secret")).rejects.toThrow();
	});
});
```

- [ ] **Step 2: Run → fail.**

- [ ] **Step 3: Implement `apps/web/src/lib/inference-read.ts`**

```ts
import type { InferenceRuntime, Step } from "@cx/inference";

export async function readStepSnapshots(runtime: InferenceRuntime, jobId: string): Promise<Step[]> {
	const job = await runtime.jobStore.getJob(jobId);
	const pipeline = runtime.pipelines.get(job.pipelineId, job.pipelineVersion);
	return Promise.all(
		pipeline.steps.map(async (step): Promise<Step> => {
			const stepPath = `steps/${step.id}/step.json`;
			if (await runtime.artifactStore.exists(jobId, stepPath)) {
				return runtime.artifactStore.readJson<Step>(jobId, stepPath);
			}
			return { stepId: step.id, status: "pending" };
		}),
	);
}

const ALLOWED_ARTIFACT =
	/^(job\.json|events\.ndjson|steps\/[a-z0-9-]+\/[a-z-]+\.json|context\/[a-z0-9-]+\.json)$/;

export async function readArtifact(runtime: InferenceRuntime, jobId: string, artifactPath: string): Promise<string> {
	if (!ALLOWED_ARTIFACT.test(artifactPath)) throw new Error(`Artifact not allowed: ${artifactPath}`);
	return runtime.artifactStore.readText(jobId, artifactPath);
}
```

- [ ] **Step 4: Run → pass.**

- [ ] **Step 5: Create the three read routes**

`apps/web/src/app/api/inference/[jobId]/route.ts`:

```ts
import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
	const { jobId } = await context.params;
	try {
		return Response.json(await inferenceRuntime.jobStore.getJob(jobId));
	} catch {
		return Response.json({ error: "job not found" }, { status: 404 });
	}
}
```

`apps/web/src/app/api/inference/[jobId]/steps/route.ts`:

```ts
import { readStepSnapshots } from "@/lib/inference-read";
import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
	const { jobId } = await context.params;
	try {
		return Response.json({ steps: await readStepSnapshots(inferenceRuntime, jobId) });
	} catch {
		return Response.json({ error: "job not found" }, { status: 404 });
	}
}
```

`apps/web/src/app/api/inference/[jobId]/artifacts/[...artifactPath]/route.ts`:

```ts
import { readArtifact } from "@/lib/inference-read";
import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";

export async function GET(
	_request: Request,
	context: { params: Promise<{ jobId: string; artifactPath: string[] }> },
) {
	const { jobId, artifactPath } = await context.params;
	const artifactRelPath = artifactPath.join("/");
	try {
		const text = await readArtifact(inferenceRuntime, jobId, artifactRelPath);
		const contentType = artifactRelPath.endsWith(".ndjson") ? "application/x-ndjson" : "application/json";
		return new Response(text, { headers: { "Content-Type": contentType } });
	} catch {
		return Response.json({ error: "artifact not found or not allowed" }, { status: 404 });
	}
}
```

- [ ] **Step 6: Reducer — failing test** `apps/web/src/lib/inference-events-reducer.test.ts`:

```ts
import type { InferenceEvent } from "@cx/inference";
import { describe, expect, it } from "vitest";
import { initialInferenceStreamState, reduceInferenceEvent } from "./inference-events-reducer";

const ev = (seq: number, type: InferenceEvent["type"]): InferenceEvent => ({ seq, jobId: "j", type, timestamp: "t" });

describe("reduceInferenceEvent", () => {
	it("accumulates and tracks terminal status", () => {
		let s = reduceInferenceEvent(initialInferenceStreamState, ev(1, "job_started"));
		s = reduceInferenceEvent(s, ev(2, "job_completed"));
		expect(s.events).toHaveLength(2);
		expect(s.status).toBe("succeeded");
	});

	it("ignores duplicate/out-of-order seq", () => {
		const s = reduceInferenceEvent(initialInferenceStreamState, ev(2, "job_started"));
		expect(reduceInferenceEvent(s, ev(2, "step_started"))).toBe(s);
		expect(reduceInferenceEvent(s, ev(1, "step_started"))).toBe(s);
	});
});
```

- [ ] **Step 7: Run → fail. Implement** `apps/web/src/lib/inference-events-reducer.ts`:

```ts
import type { InferenceEvent } from "@cx/inference";

export type InferenceStreamStatus = "running" | "succeeded" | "failed";

export type InferenceStreamState = {
	events: InferenceEvent[];
	status: InferenceStreamStatus;
	lastSeq: number;
};

export const initialInferenceStreamState: InferenceStreamState = { events: [], status: "running", lastSeq: 0 };

export function reduceInferenceEvent(state: InferenceStreamState, event: InferenceEvent): InferenceStreamState {
	if (event.seq <= state.lastSeq) return state;
	const status: InferenceStreamStatus =
		event.type === "job_completed" ? "succeeded" : event.type === "job_failed" ? "failed" : state.status;
	return { events: [...state.events, event], status, lastSeq: event.seq };
}
```

- [ ] **Step 8: Client — failing test** `apps/web/src/lib/inference-client.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInferenceJob } from "./inference-client";

afterEach(() => vi.restoreAllMocks());

describe("createInferenceJob", () => {
	it("POSTs and returns jobId", async () => {
		vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ jobId: "job-xyz" }), { status: 202 })));
		expect(await createInferenceJob({ a: 1 })).toBe("job-xyz");
	});

	it("throws on non-ok", async () => {
		vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
		await expect(createInferenceJob({})).rejects.toThrow();
	});
});
```

- [ ] **Step 9: Run → fail. Implement** `apps/web/src/lib/inference-client.ts`:

```ts
import type { InferenceEvent } from "@cx/inference";

const INFERENCE_EVENT_TYPES = [
	"job_started",
	"job_completed",
	"job_failed",
	"step_started",
	"step_completed",
	"step_failed",
] as const;

export async function createInferenceJob(input: unknown): Promise<string> {
	const response = await fetch("/api/inference", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!response.ok) throw new Error(`Inference job creation failed: ${response.status}`);
	const body = (await response.json()) as { jobId: string };
	return body.jobId;
}

export function subscribeInferenceEvents(
	jobId: string,
	handlers: { onEvent: (event: InferenceEvent) => void; onError?: () => void },
): () => void {
	if (typeof EventSource === "undefined") return () => undefined;
	const source = new EventSource(`/api/inference/${encodeURIComponent(jobId)}/events`);
	const onMessage = (message: MessageEvent<string>) => {
		try {
			handlers.onEvent(JSON.parse(message.data) as InferenceEvent);
		} catch {
			// keep-alive comments are not JSON
		}
	};
	const onError = () => handlers.onError?.();
	for (const type of INFERENCE_EVENT_TYPES) source.addEventListener(type, onMessage);
	source.addEventListener("error", onError);
	return () => {
		for (const type of INFERENCE_EVENT_TYPES) source.removeEventListener(type, onMessage);
		source.removeEventListener("error", onError);
		source.close();
	};
}
```

> NOTE the POST body: main's POST does `request.json()` then passes the whole body as `input` to `createInferenceJob`. So the client sends the input object directly as the JSON body (not wrapped in `{input}`).

- [ ] **Step 10: Run reducer + client tests → pass.**

- [ ] **Step 11: Hooks** (no `useMemo`/`useCallback`).

`apps/web/src/model/inference/use-inference.ts`:

```ts
"use client";

import { useState } from "react";
import { createInferenceJob } from "@/lib/inference-client";

export function useInference() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function run(input: unknown): Promise<string | null> {
		setCreating(true);
		setError(null);
		try {
			const id = await createInferenceJob(input);
			setJobId(id);
			return id;
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : String(caught));
			return null;
		} finally {
			setCreating(false);
		}
	}

	return { jobId, creating, error, run };
}
```

`apps/web/src/model/inference/use-inference-stream.ts`:

```ts
"use client";

import { useEffect, useState } from "react";
import { subscribeInferenceEvents } from "@/lib/inference-client";
import {
	initialInferenceStreamState,
	type InferenceStreamState,
	reduceInferenceEvent,
} from "@/lib/inference-events-reducer";

export function useInferenceStream(jobId: string | null): InferenceStreamState {
	const [state, setState] = useState<InferenceStreamState>(initialInferenceStreamState);
	useEffect(() => {
		if (!jobId) return;
		setState(initialInferenceStreamState);
		return subscribeInferenceEvents(jobId, {
			onEvent: (event) => setState((current) => reduceInferenceEvent(current, event)),
		});
	}, [jobId]);
	return state;
}
```

- [ ] **Step 12: Demo page**

`apps/web/src/components/inference/InferenceDemo.tsx`:

```tsx
"use client";

import { useInference } from "@/model/inference/use-inference";
import { useInferenceStream } from "@/model/inference/use-inference-stream";

export function InferenceDemo() {
	const { jobId, creating, error, run } = useInference();
	const stream = useInferenceStream(jobId);

	return (
		<main style={{ padding: 24, fontFamily: "ui-monospace, monospace", lineHeight: 1.6 }}>
			<h1>Inference Demo</h1>
			<button type="button" disabled={creating} onClick={() => void run({ screenCode: "DEMO" })}>
				{creating ? "Running…" : "Run demo"}
			</button>
			{error ? <p style={{ color: "crimson" }}>{error}</p> : null}
			{jobId ? (
				<p>
					job <code>{jobId}</code> — status: <strong>{stream.status}</strong>
				</p>
			) : null}
			<ol>
				{stream.events.map((event) => (
					<li key={event.seq}>
						#{event.seq} {event.type}
						{event.stepId ? ` (${event.stepId})` : ""}
					</li>
				))}
			</ol>
		</main>
	);
}
```

`apps/web/src/app/inference-demo/page.tsx`:

```tsx
import { InferenceDemo } from "@/components/inference/InferenceDemo";

export default function InferenceDemoPage() {
	return <InferenceDemo />;
}
```

- [ ] **Step 13: Verify suites + hooks policy**

Run: `pnpm vitest run apps/web/src/lib/inference-read.test.ts apps/web/src/lib/inference-events-reducer.test.ts apps/web/src/lib/inference-client.test.ts`
Expected: PASS.
Run: `node scripts/check-react-hooks-policy.mjs apps packages`
Expected: passes.

- [ ] **Step 14: Commit**

```bash
git add apps/web/src/lib/inference-read.ts apps/web/src/lib/inference-read.test.ts "apps/web/src/app/api/inference/[jobId]/route.ts" "apps/web/src/app/api/inference/[jobId]/steps/route.ts" "apps/web/src/app/api/inference/[jobId]/artifacts/[...artifactPath]/route.ts" apps/web/src/lib/inference-events-reducer.ts apps/web/src/lib/inference-events-reducer.test.ts apps/web/src/lib/inference-client.ts apps/web/src/lib/inference-client.test.ts apps/web/src/model/inference/use-inference.ts apps/web/src/model/inference/use-inference-stream.ts apps/web/src/components/inference/InferenceDemo.tsx apps/web/src/app/inference-demo/page.tsx
git commit -m "feat(inference): client, read routes, hooks, and demo page"
```

---

### Task 8: Live verification

- [ ] **Step 1:** Start dev server separately: `pnpm --filter web exec next dev -p 3114`.
- [ ] **Step 2:** Open `http://localhost:3114/inference-demo`, click **Run demo**.
- [ ] **Step 3:** Expect: jobId shown, status **succeeded**, timeline `#1 job_started → #2 step_started (01-analyze) → #3 step_completed (01-analyze) → #4 job_completed`.
- [ ] **Step 4:** Confirm read routes:
  ```bash
  curl -s http://localhost:3114/api/inference/<jobId>/steps
  curl -s http://localhost:3114/api/inference/<jobId>/artifacts/steps/01-analyze/output.json
  curl -s http://localhost:3114/api/inference/<jobId>/artifacts/steps/01-analyze/output-contract.json
  ```
- [ ] **Step 5:** Stop the dev server. `.data/` is gitignored.

---

## Self-Review Notes

- **Adapts to main, not our old branch:** every contract reference (`OutputContract.contractRef`, `KnowledgeRef` 5-source union, `EngineRequest.outputContract`, `runInferenceJob(runtime, jobId)`, `output-contract.json` artifact, POST body = raw input) matches main's current code, verified by reading main's files.
- **No duplication of main's existing work:** run-step, knowledge-base, validation, contracts are untouched. We only add helpers + fix the worker + add the client.
- **Worker fix** (Task 4) is the one behavior change to existing main code; the resilience test proves the unknown-pipeline path now terminates. The happy-path `worker.test.ts` must stay green.
- **App composition refactor** (Task 5) replaces main's hand-rolled `sourceSpecEngine`/no-op-registry with the real factory + registry + registered `source-spec-mvp` function; behavior preserved (same source-spec output, validated by `validateJsonSchema`).
- **Type consistency:** `createFunctionEngine`/`InferenceFunction`, `defineStep`/`definePipeline`/`createPipelineRegistry`/`jobInput`/`knowledge`/`outputContractRef`, `createFakeEngine`, `createInferenceRuntime`, `readStepSnapshots`/`readArtifact`, `createInferenceJob`/`subscribeInferenceEvents`, `reduceInferenceEvent`, `useInference`/`useInferenceStream` are used identically across tasks and tests.
- **Policy:** hooks use only `useState`/`useEffect` + inline functions.

## Deferred

- Real `claude` engine (Agent SDK) — still a stub; out of scope.
- Styling/workbench integration of the demo page.
- Removing the deprecated `@cx/pipeline` screen-generation path.
