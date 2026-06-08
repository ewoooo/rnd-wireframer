# @cx/inference MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the new `@cx/inference` package and drive one fake/deterministic step end-to-end — a job that leaves a complete JSON folder record under `.data/` and streams progress over SSE.

**Architecture:** Dependency-injection package per `docs/development/SCREEN_INFERENCE_ARCHITECTURE.md`. A `contracts/` leaf holds every type; `ArtifactStore` is the file-IO primitive; `JobStore`/`ContextStore` sit on top of it; `runStep` executes one step purely (returns what to persist); `runInferenceJob` orchestrates (persists, emits events, transitions status). Production wiring is `createInferenceRuntime`; tests use `createTestRuntime` from the `@cx/inference/testing` subpath.

**Tech Stack:** TypeScript (source consumed directly, no build), pnpm workspace, Vitest, Next.js App Router (API routes), `node:fs/promises`.

**SSOT reference:** `docs/development/SCREEN_INFERENCE_ARCHITECTURE.md` is the source of truth. This plan applies these **MVP simplifications** (deliberate, narrower than the SSOT, to be widened later):

1. **JobStore is a single implementation over `ArtifactStore`** (`createJobStore(artifactStore, …)`). "Memory vs file" is decided by which `ArtifactStore` you inject — no separate `MemoryJobStore`. (SSOT §5 listed two impls; they collapse because JobStore only uses `ArtifactStore`.)
2. **Step folder is `steps/{stepId}/`** (no order prefix) for the MVP. SSOT allows the order prefix as optional; deferred.
3. **The demo pipeline uses a `function` engine step**, so it produces no `prompt.json` (prompt is claude-only). The `prompt.json`/prompt-assembly path is covered by the `runStep` unit test with a fake `claude` engine.
4. **`appendEvent` returns the stored event** (with the assigned `seq`).
5. **Schema validation is pass-through** in the MVP (`output = raw`). Wiring `@cx/validation` is a follow-up commit.
6. **`claude` engine is a stub that throws** until `@cx/agent` is wired (follow-up).

**Conventions verified in this repo:**
- Packages have no build step: `package.json` uses `"main"/"types": "./src/index.ts"` and an `exports` map of subpaths to `./src/<dir>/index.ts`.
- Vitest config is at the repo root with `globals: true` and `include: ["packages/**/*.{test,spec}.{ts,tsx}"]`. Run a single file with `pnpm vitest run <path>`.
- pnpm workspace globs `packages/*`, so a new `packages/inference/` is auto-discovered after `pnpm install`.

---

### Task 1: Scaffold the `@cx/inference` package

**Files:**
- Create: `packages/inference/package.json`
- Create: `packages/inference/tsconfig.json`
- Create: `packages/inference/src/index.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
	"name": "@cx/inference",
	"version": "0.1.0",
	"private": true,
	"type": "module",
	"main": "./src/index.ts",
	"types": "./src/index.ts",
	"exports": {
		".": "./src/index.ts",
		"./testing": "./src/testing/index.ts"
	}
}
```

- [ ] **Step 2: Create `tsconfig.json`** (optional per repo convention, but requested; extends root)

```json
{
	"extends": "../../tsconfig.json"
}
```

- [ ] **Step 3: Create a placeholder `src/index.ts`**

```ts
// Public surface is filled in by later tasks. Empty re-export keeps the
// package importable while it is being built out.
export {};
```

- [ ] **Step 4: Link the workspace**

Run: `pnpm install`
Expected: completes; `packages/inference` is recognized as `@cx/inference` (no errors).

- [ ] **Step 5: Commit**

```bash
git add packages/inference/package.json packages/inference/tsconfig.json packages/inference/src/index.ts pnpm-lock.yaml
git commit -m "feat(inference): scaffold @cx/inference package"
```

---

### Task 2: Define the contracts (`contracts/`)

**Files:**
- Create: `packages/inference/src/contracts/ids.ts`
- Create: `packages/inference/src/contracts/job.ts`
- Create: `packages/inference/src/contracts/step.ts`
- Create: `packages/inference/src/contracts/engine.ts`
- Create: `packages/inference/src/contracts/stores.ts`
- Create: `packages/inference/src/contracts/pipeline.ts`
- Create: `packages/inference/src/contracts/worker.ts`
- Create: `packages/inference/src/contracts/index.ts`

This task is types only — no runtime, no tests. It locks the vocabulary every later task imports.

- [ ] **Step 1: `contracts/ids.ts`**

```ts
export type JobStatus = "queued" | "running" | "succeeded" | "failed";
export type StepStatus = "pending" | "running" | "succeeded" | "failed";

export type InferenceEventType =
	| "job_started"
	| "job_completed"
	| "job_failed"
	| "step_started"
	| "step_completed"
	| "step_failed";
```

- [ ] **Step 2: `contracts/job.ts`**

```ts
import type { InferenceEventType, JobStatus, StepStatus } from "./ids";

export type Job = {
	jobId: string;
	pipelineId: string;
	pipelineVersion: string;
	status: JobStatus;
	input: unknown;
	currentStepId?: string;
	error?: { code: string; message: string };
	createdAt: string;
	updatedAt: string;
};

export type CreateJobInput = {
	pipelineId: string;
	pipelineVersion: string;
	input: unknown;
};

export type Step = {
	stepId: string;
	status: StepStatus;
	startedAt?: string;
	completedAt?: string;
	error?: { code: string; message: string };
};

export type InferenceEvent = {
	seq: number;
	jobId: string;
	type: InferenceEventType;
	timestamp: string;
	stepId?: string;
	payload?: unknown;
};
```

- [ ] **Step 3: `contracts/step.ts`**

```ts
export type ReferenceEnvelope =
	| { id: string; source: string; sourceRef: string; format: "markdown"; version?: string; content: string }
	| { id: string; source: string; sourceRef: string; format: "json"; version?: string; data: unknown };

export type StepInputRef =
	| { kind: "job-input"; path?: string }
	| { kind: "step-output"; stepId: string; outputName?: string }
	| { kind: "context"; key: string }
	| { kind: "artifact"; path: string }
	| { kind: "value"; value: unknown };

export type KnowledgeRef = {
	source: "component-catalog" | "layout-catalog" | "skillset";
	id?: string;
	version?: string;
};

export type PromptTemplateRef = { id: string; version?: string };
export type FunctionRef = { id: string };

export type OutputContract = {
	schema: unknown;
	schemaVersion: string;
	writeToContext?: string;
};

export type InferenceStepDefinition = {
	id: string;
	engine: "claude" | "function";
	inputs?: Record<string, StepInputRef>;
	references?: Record<string, KnowledgeRef>;
	prompt?: PromptTemplateRef;
	run?: FunctionRef;
	output: OutputContract;
};
```

- [ ] **Step 4: `contracts/engine.ts`**

```ts
import type { FunctionRef, ReferenceEnvelope } from "./step";

export type PromptPayload = { messages: Array<{ role: string; content: string }> };

export type EngineRequest = {
	prompt?: PromptPayload;
	run?: FunctionRef;
	inputs: Record<string, unknown>;
	references: Record<string, ReferenceEnvelope | ReferenceEnvelope[]>;
};

export type EngineResult = { raw: unknown };

export interface Engine {
	execute(request: EngineRequest): Promise<EngineResult>;
}

export type EngineRegistry = Record<"claude" | "function", Engine>;
```

- [ ] **Step 5: `contracts/stores.ts`**

```ts
import type { CreateJobInput, InferenceEvent, Job, Step } from "./job";

export interface ArtifactStore {
	writeText(jobId: string, path: string, content: string): Promise<void>;
	writeJson(jobId: string, path: string, value: unknown): Promise<void>;
	appendLine(jobId: string, path: string, content: string): Promise<void>;
	readText(jobId: string, path: string): Promise<string>;
	readJson<T>(jobId: string, path: string): Promise<T>;
	exists(jobId: string, path: string): Promise<boolean>;
}

export interface JobStore {
	createJob(input: CreateJobInput): Promise<Job>;
	getJob(jobId: string): Promise<Job>;
	updateJob(jobId: string, patch: Partial<Job>): Promise<void>;
	createStep(jobId: string, stepId: string): Promise<void>;
	updateStep(jobId: string, stepId: string, patch: Partial<Step>): Promise<void>;
	appendEvent(jobId: string, event: Omit<InferenceEvent, "seq">): Promise<InferenceEvent>;
	listEvents(jobId: string, after?: number): Promise<InferenceEvent[]>;
}

export interface ContextStore {
	writeJson(key: string, value: unknown): Promise<void>;
	readJson<T>(key: string): Promise<T>;
	tryReadJson<T>(key: string): Promise<T | null>;
}
```

- [ ] **Step 6: `contracts/pipeline.ts`**

```ts
import type { InferenceStepDefinition } from "./step";

export type PipelineDefinition = {
	id: string;
	version: string;
	steps: InferenceStepDefinition[];
};

export interface PipelineRegistry {
	register(pipeline: PipelineDefinition): void;
	get(pipelineId: string, pipelineVersion: string): PipelineDefinition;
}
```

- [ ] **Step 7: `contracts/worker.ts`**

```ts
import type { EngineRegistry } from "./engine";
import type { PromptPayload } from "./engine";
import type { PipelineRegistry } from "./pipeline";
import type { KnowledgeRef, ReferenceEnvelope, StepInputRef } from "./step";
import type { ArtifactStore, ContextStore, JobStore } from "./stores";

export type KnowledgeBase = {
	resolve(ref: KnowledgeRef): Promise<ReferenceEnvelope | ReferenceEnvelope[]>;
};

export type WorkerDeps = {
	jobStore: JobStore;
	artifactStore: ArtifactStore;
	createContextStore: (jobId: string) => ContextStore;
	engines: EngineRegistry;
	knowledgeBase: KnowledgeBase;
	pipelines: PipelineRegistry;
	now: () => string;
	newId: () => string;
};

/** Opaque public handle the app passes back to runInferenceJob. */
export type InferenceRuntime = WorkerDeps;

export type StepRunContext = {
	resolveInput: (ref: StepInputRef) => Promise<unknown>;
	resolveReference: (ref: KnowledgeRef) => Promise<ReferenceEnvelope | ReferenceEnvelope[]>;
	engines: EngineRegistry;
};

export type StepExecution = {
	status: "succeeded" | "failed";
	inputs: Record<string, unknown>;
	references: Record<string, ReferenceEnvelope | ReferenceEnvelope[]>;
	prompt?: PromptPayload;
	raw: unknown;
	output?: unknown;
	contextWrites?: Record<string, unknown>;
	error?: { code: string; message: string };
};
```

- [ ] **Step 8: `contracts/index.ts`**

```ts
export type * from "./ids";
export type * from "./job";
export type * from "./step";
export type * from "./engine";
export type * from "./stores";
export type * from "./pipeline";
export type * from "./worker";
```

- [ ] **Step 9: Typecheck and commit**

Run: `pnpm tsc --noEmit -p packages/inference/tsconfig.json`
Expected: no errors.

```bash
git add packages/inference/src/contracts
git commit -m "feat(inference): define contracts vocabulary"
```

---

### Task 3: ArtifactStore — MemoryArtifactStore (test-first) then FileArtifactStore

**Files:**
- Create: `packages/inference/src/testing/memory-artifact-store.ts`
- Create: `packages/inference/src/stores/file-artifact-store.ts`
- Test: `packages/inference/src/__tests__/artifact-store.test.ts`

- [ ] **Step 1: Write the shared contract suite + failing test**

`packages/inference/src/__tests__/artifact-store.test.ts`:

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ArtifactStore } from "../contracts";
import { FileArtifactStore } from "../stores/file-artifact-store";
import { MemoryArtifactStore } from "../testing/memory-artifact-store";

function artifactStoreContract(name: string, make: () => ArtifactStore) {
	describe(`ArtifactStore contract: ${name}`, () => {
		it("writeText/readText roundtrip", async () => {
			const s = make();
			await s.writeText("job1", "a.txt", "hello");
			expect(await s.readText("job1", "a.txt")).toBe("hello");
		});

		it("writeJson/readJson roundtrip", async () => {
			const s = make();
			await s.writeJson("job1", "a.json", { x: 1 });
			expect(await s.readJson<{ x: number }>("job1", "a.json")).toEqual({ x: 1 });
		});

		it("appendLine appends newline-terminated lines in order", async () => {
			const s = make();
			await s.appendLine("job1", "e.ndjson", '{"a":1}');
			await s.appendLine("job1", "e.ndjson", '{"a":2}');
			expect(await s.readText("job1", "e.ndjson")).toBe('{"a":1}\n{"a":2}\n');
		});

		it("readText throws on missing; exists reflects writes", async () => {
			const s = make();
			expect(await s.exists("job1", "none.txt")).toBe(false);
			await expect(s.readText("job1", "none.txt")).rejects.toThrow();
			await s.writeText("job1", "x.txt", "y");
			expect(await s.exists("job1", "x.txt")).toBe(true);
		});

		it("rejects ../ path escape", async () => {
			const s = make();
			await expect(s.writeText("job1", "../evil.txt", "x")).rejects.toThrow();
		});
	});
}

artifactStoreContract("memory", () => new MemoryArtifactStore());
artifactStoreContract("file", () => new FileArtifactStore(mkdtempSync(path.join(tmpdir(), "cx-art-"))));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/artifact-store.test.ts`
Expected: FAIL — cannot find `../stores/file-artifact-store` / `../testing/memory-artifact-store`.

- [ ] **Step 3: Implement `MemoryArtifactStore`**

`packages/inference/src/testing/memory-artifact-store.ts`:

```ts
import type { ArtifactStore } from "../contracts";

export class MemoryArtifactStore implements ArtifactStore {
	readonly files = new Map<string, string>();

	private key(jobId: string, rel: string): string {
		if (rel.includes("..") || rel.startsWith("/")) throw new Error(`Invalid artifact path: ${rel}`);
		return `${jobId}/${rel}`;
	}

	async writeText(jobId: string, rel: string, content: string): Promise<void> {
		this.files.set(this.key(jobId, rel), content);
	}

	async writeJson(jobId: string, rel: string, value: unknown): Promise<void> {
		this.files.set(this.key(jobId, rel), JSON.stringify(value, null, 2));
	}

	async appendLine(jobId: string, rel: string, content: string): Promise<void> {
		const k = this.key(jobId, rel);
		this.files.set(k, `${this.files.get(k) ?? ""}${content}\n`);
	}

	async readText(jobId: string, rel: string): Promise<string> {
		const v = this.files.get(this.key(jobId, rel));
		if (v === undefined) throw new Error(`Missing artifact: ${jobId}/${rel}`);
		return v;
	}

	async readJson<T>(jobId: string, rel: string): Promise<T> {
		return JSON.parse(await this.readText(jobId, rel)) as T;
	}

	async exists(jobId: string, rel: string): Promise<boolean> {
		return this.files.has(this.key(jobId, rel));
	}
}
```

- [ ] **Step 4: Implement `FileArtifactStore`**

`packages/inference/src/stores/file-artifact-store.ts`:

```ts
import { access, appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArtifactStore } from "../contracts";

const SAFE_JOB_ID = /^[A-Za-z0-9._-]+$/;

export class FileArtifactStore implements ArtifactStore {
	constructor(private readonly dataRoot: string = ".data") {}

	private resolve(jobId: string, rel: string): string {
		if (!SAFE_JOB_ID.test(jobId)) throw new Error(`Invalid jobId: ${jobId}`);
		if (rel.includes("..") || path.isAbsolute(rel)) throw new Error(`Invalid artifact path: ${rel}`);
		const root = path.resolve(this.dataRoot, "inference-jobs", jobId);
		const full = path.resolve(root, rel);
		if (full !== root && !full.startsWith(root + path.sep)) {
			throw new Error(`Artifact path escapes job root: ${rel}`);
		}
		return full;
	}

	async writeText(jobId: string, rel: string, content: string): Promise<void> {
		const full = this.resolve(jobId, rel);
		await mkdir(path.dirname(full), { recursive: true });
		await writeFile(full, content, "utf8");
	}

	async writeJson(jobId: string, rel: string, value: unknown): Promise<void> {
		await this.writeText(jobId, rel, JSON.stringify(value, null, 2));
	}

	async appendLine(jobId: string, rel: string, content: string): Promise<void> {
		const full = this.resolve(jobId, rel);
		await mkdir(path.dirname(full), { recursive: true });
		await appendFile(full, `${content}\n`, "utf8");
	}

	async readText(jobId: string, rel: string): Promise<string> {
		return readFile(this.resolve(jobId, rel), "utf8");
	}

	async readJson<T>(jobId: string, rel: string): Promise<T> {
		return JSON.parse(await this.readText(jobId, rel)) as T;
	}

	async exists(jobId: string, rel: string): Promise<boolean> {
		try {
			await access(this.resolve(jobId, rel));
			return true;
		} catch {
			return false;
		}
	}
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/artifact-store.test.ts`
Expected: PASS — both `memory` and `file` contract suites green.

- [ ] **Step 6: Commit**

```bash
git add packages/inference/src/testing/memory-artifact-store.ts packages/inference/src/stores/file-artifact-store.ts packages/inference/src/__tests__/artifact-store.test.ts
git commit -m "feat(inference): ArtifactStore (memory + file) with path safety"
```

---

### Task 4: JobStore over ArtifactStore (seq, events, steps)

**Files:**
- Create: `packages/inference/src/stores/job-store.ts`
- Test: `packages/inference/src/__tests__/job-store.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/inference/src/__tests__/job-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MemoryArtifactStore } from "../testing/memory-artifact-store";
import { createJobStore } from "../stores/job-store";

function makeStore() {
	let t = 0;
	let n = 0;
	const artifact = new MemoryArtifactStore();
	const jobStore = createJobStore(artifact, {
		now: () => new Date(t++).toISOString(),
		newId: () => `job-${++n}`,
	});
	return { artifact, jobStore };
}

describe("JobStore", () => {
	it("creates a job snapshot at job.json", async () => {
		const { artifact, jobStore } = makeStore();
		const job = await jobStore.createJob({ pipelineId: "demo", pipelineVersion: "v1", input: { a: 1 } });
		expect(job.jobId).toBe("job-1");
		expect(job.status).toBe("queued");
		expect(await jobStore.getJob("job-1")).toEqual(job);
		expect(await artifact.exists("job-1", "job.json")).toBe(true);
	});

	it("updateJob merges patch and bumps updatedAt", async () => {
		const { jobStore } = makeStore();
		await jobStore.createJob({ pipelineId: "demo", pipelineVersion: "v1", input: {} });
		await jobStore.updateJob("job-1", { status: "running" });
		expect((await jobStore.getJob("job-1")).status).toBe("running");
	});

	it("appendEvent assigns a monotonic seq and listEvents filters by after", async () => {
		const { jobStore } = makeStore();
		await jobStore.createJob({ pipelineId: "demo", pipelineVersion: "v1", input: {} });
		const e1 = await jobStore.appendEvent("job-1", { jobId: "job-1", type: "job_started", timestamp: "t" });
		const e2 = await jobStore.appendEvent("job-1", { jobId: "job-1", type: "job_completed", timestamp: "t" });
		expect([e1.seq, e2.seq]).toEqual([1, 2]);
		expect(await jobStore.listEvents("job-1")).toHaveLength(2);
		expect(await jobStore.listEvents("job-1", 1)).toEqual([e2]);
	});

	it("createStep/updateStep maintain a step snapshot", async () => {
		const { artifact, jobStore } = makeStore();
		await jobStore.createJob({ pipelineId: "demo", pipelineVersion: "v1", input: {} });
		await jobStore.createStep("job-1", "analyze");
		await jobStore.updateStep("job-1", "analyze", { status: "succeeded" });
		const step = await artifact.readJson<{ stepId: string; status: string }>("job-1", "steps/analyze/step.json");
		expect(step).toMatchObject({ stepId: "analyze", status: "succeeded" });
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/job-store.test.ts`
Expected: FAIL — cannot find `../stores/job-store`.

- [ ] **Step 3: Implement `createJobStore`**

`packages/inference/src/stores/job-store.ts`:

```ts
import type { ArtifactStore, CreateJobInput, InferenceEvent, Job, JobStore, Step } from "../contracts";

const EVENTS = "events.ndjson";
const stepPath = (stepId: string) => `steps/${stepId}/step.json`;

export function createJobStore(
	store: ArtifactStore,
	clock: { now: () => string; newId: () => string },
): JobStore {
	return {
		async createJob(input: CreateJobInput): Promise<Job> {
			const ts = clock.now();
			const job: Job = {
				jobId: clock.newId(),
				pipelineId: input.pipelineId,
				pipelineVersion: input.pipelineVersion,
				status: "queued",
				input: input.input,
				createdAt: ts,
				updatedAt: ts,
			};
			await store.writeJson(job.jobId, "job.json", job);
			return job;
		},

		async getJob(jobId: string): Promise<Job> {
			return store.readJson<Job>(jobId, "job.json");
		},

		async updateJob(jobId: string, patch: Partial<Job>): Promise<void> {
			const current = await store.readJson<Job>(jobId, "job.json");
			await store.writeJson(jobId, "job.json", { ...current, ...patch, updatedAt: clock.now() });
		},

		async createStep(jobId: string, stepId: string): Promise<void> {
			const step: Step = { stepId, status: "pending" };
			await store.writeJson(jobId, stepPath(stepId), step);
		},

		async updateStep(jobId: string, stepId: string, patch: Partial<Step>): Promise<void> {
			const current = await store.readJson<Step>(jobId, stepPath(stepId));
			await store.writeJson(jobId, stepPath(stepId), { ...current, ...patch });
		},

		async appendEvent(jobId: string, event: Omit<InferenceEvent, "seq">): Promise<InferenceEvent> {
			const existing = (await store.exists(jobId, EVENTS)) ? await store.readText(jobId, EVENTS) : "";
			const lines = existing ? existing.trimEnd().split("\n").filter(Boolean) : [];
			const stored: InferenceEvent = { ...event, seq: lines.length + 1 };
			await store.appendLine(jobId, EVENTS, JSON.stringify(stored));
			return stored;
		},

		async listEvents(jobId: string, after = 0): Promise<InferenceEvent[]> {
			if (!(await store.exists(jobId, EVENTS))) return [];
			const text = await store.readText(jobId, EVENTS);
			return text
				.trimEnd()
				.split("\n")
				.filter(Boolean)
				.map((line) => JSON.parse(line) as InferenceEvent)
				.filter((e) => e.seq > after);
		},
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/job-store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/inference/src/stores/job-store.ts packages/inference/src/__tests__/job-store.test.ts
git commit -m "feat(inference): JobStore over ArtifactStore with monotonic event seq"
```

---

### Task 5: ContextStore

**Files:**
- Create: `packages/inference/src/context/context-store.ts`
- Test: `packages/inference/src/__tests__/context-store.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/inference/src/__tests__/context-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextStore } from "../context/context-store";
import { MemoryArtifactStore } from "../testing/memory-artifact-store";

describe("ContextStore", () => {
	it("writes and reads context/{key}.json", async () => {
		const store = new MemoryArtifactStore();
		const ctx = createContextStore("job-1", store);
		await ctx.writeJson("layout-plan", { rows: 3 });
		expect(await ctx.readJson<{ rows: number }>("layout-plan")).toEqual({ rows: 3 });
		expect(await store.exists("job-1", "context/layout-plan.json")).toBe(true);
	});

	it("tryReadJson returns null when the key is missing", async () => {
		const ctx = createContextStore("job-1", new MemoryArtifactStore());
		expect(await ctx.tryReadJson("missing")).toBeNull();
	});

	it("rejects invalid keys", async () => {
		const ctx = createContextStore("job-1", new MemoryArtifactStore());
		await expect(ctx.writeJson("../escape", {})).rejects.toThrow();
		await expect(ctx.writeJson("Bad Key", {})).rejects.toThrow();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/context-store.test.ts`
Expected: FAIL — cannot find `../context/context-store`.

- [ ] **Step 3: Implement `createContextStore`**

`packages/inference/src/context/context-store.ts`:

```ts
import type { ArtifactStore, ContextStore } from "../contracts";

const SAFE_KEY = /^[a-z0-9-]+$/;

export function createContextStore(jobId: string, store: ArtifactStore): ContextStore {
	const pathFor = (key: string): string => {
		if (!SAFE_KEY.test(key)) throw new Error(`Invalid context key: ${key}`);
		return `context/${key}.json`;
	};

	return {
		writeJson: (key, value) => store.writeJson(jobId, pathFor(key), value),
		readJson: <T>(key: string) => store.readJson<T>(jobId, pathFor(key)),
		async tryReadJson<T>(key: string): Promise<T | null> {
			const rel = pathFor(key);
			return (await store.exists(jobId, rel)) ? store.readJson<T>(jobId, rel) : null;
		},
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/context-store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/inference/src/context/context-store.ts packages/inference/src/__tests__/context-store.test.ts
git commit -m "feat(inference): ContextStore over ArtifactStore"
```

---

### Task 6: Pipeline helpers (defineStep / definePipeline / registry / ref helpers)

**Files:**
- Create: `packages/inference/src/pipeline/define-step.ts`
- Create: `packages/inference/src/pipeline/define-pipeline.ts`
- Create: `packages/inference/src/pipeline/registry.ts`
- Create: `packages/inference/src/pipeline/refs.ts`
- Create: `packages/inference/src/pipeline/index.ts`
- Test: `packages/inference/src/__tests__/pipeline.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/inference/src/__tests__/pipeline.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createPipelineRegistry, definePipeline, defineStep, knowledge, stepOutput } from "../pipeline";

const step = defineStep({
	id: "select-pattern",
	engine: "claude",
	inputs: { composition: stepOutput("plan-composition", "result") },
	references: { patternSkill: knowledge("skillset", "pattern-selection") },
	output: { schema: {}, schemaVersion: "v0" },
});

describe("pipeline helpers", () => {
	it("defineStep returns the literal with helper-built refs", () => {
		expect(step.inputs?.composition).toEqual({ kind: "step-output", stepId: "plan-composition", outputName: "result" });
		expect(step.references?.patternSkill).toEqual({ source: "skillset", id: "pattern-selection", version: undefined });
	});

	it("registry resolves by id@version and coexists across versions", () => {
		const reg = createPipelineRegistry();
		reg.register(definePipeline({ id: "demo", version: "v1", steps: [step] }));
		reg.register(definePipeline({ id: "demo", version: "v2", steps: [] }));
		expect(reg.get("demo", "v1").steps).toHaveLength(1);
		expect(reg.get("demo", "v2").steps).toHaveLength(0);
	});

	it("registry throws on unknown pipeline", () => {
		const reg = createPipelineRegistry();
		expect(() => reg.get("nope", "v1")).toThrow();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/pipeline.test.ts`
Expected: FAIL — cannot find `../pipeline`.

- [ ] **Step 3: Implement the helpers**

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
import type { KnowledgeRef, StepInputRef } from "../contracts";

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
```

`packages/inference/src/pipeline/index.ts`:

```ts
export { defineStep } from "./define-step";
export { definePipeline } from "./define-pipeline";
export { createPipelineRegistry } from "./registry";
export { artifact, context, jobInput, knowledge, stepOutput, value } from "./refs";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/pipeline.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/inference/src/pipeline packages/inference/src/__tests__/pipeline.test.ts
git commit -m "feat(inference): pipeline definition helpers and registry"
```

---

### Task 7: runStep + fake engine (per-step testing seam)

**Files:**
- Create: `packages/inference/src/testing/fake-engine.ts`
- Create: `packages/inference/src/pipeline/run-step.ts`
- Modify: `packages/inference/src/pipeline/index.ts` (export `runStep`)
- Test: `packages/inference/src/__tests__/run-step.test.ts`

> Note: `runStep` is internal-but-testable. It is exported from `pipeline/index.ts` for the worker and tests, but is NOT re-exported from the package root `index.ts` (Task 10 keeps the public surface minimal).

- [ ] **Step 1: Write the failing test**

`packages/inference/src/__tests__/run-step.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { KnowledgeRef, ReferenceEnvelope, StepInputRef } from "../contracts";
import { defineStep } from "../pipeline";
import { runStep } from "../pipeline/run-step";
import { createFakeEngine } from "../testing/fake-engine";

function noopEngine() {
	return createFakeEngine(() => ({}));
}

describe("runStep", () => {
	it("resolves inputs/references, assembles a prompt for claude, returns output", async () => {
		const claude = createFakeEngine(() => ({ pattern: "list" }));
		const step = defineStep({
			id: "select-pattern",
			engine: "claude",
			inputs: { composition: { kind: "step-output", stepId: "plan", outputName: "result" } },
			references: { layout: { source: "layout-catalog" } },
			output: { schema: {}, schemaVersion: "v0", writeToContext: "pattern" },
		});

		const envelope: ReferenceEnvelope = {
			id: "layout-catalog",
			source: "@cx/layout",
			sourceRef: "catalog",
			format: "json",
			data: [],
		};

		const exec = await runStep(step, {
			resolveInput: async (ref: StepInputRef) => ({ resolved: ref.kind }),
			resolveReference: async (_ref: KnowledgeRef) => envelope,
			engines: { claude, function: noopEngine() },
		});

		expect(exec.status).toBe("succeeded");
		expect(exec.inputs.composition).toEqual({ resolved: "step-output" });
		expect(exec.references.layout).toEqual(envelope);
		expect(exec.prompt?.messages).toHaveLength(1);
		expect(claude.calls[0]?.references.layout).toEqual(envelope);
		expect(exec.output).toEqual({ pattern: "list" });
		expect(exec.contextWrites).toEqual({ pattern: { pattern: "list" } });
	});

	it("marks status failed when the engine throws (no coercion)", async () => {
		const claude = createFakeEngine(() => {
			throw new Error("boom");
		});
		const step = defineStep({ id: "s", engine: "claude", output: { schema: {}, schemaVersion: "v0" } });
		const exec = await runStep(step, {
			resolveInput: async () => null,
			resolveReference: async () => [],
			engines: { claude, function: noopEngine() },
		});
		expect(exec.status).toBe("failed");
		expect(exec.error?.code).toBe("step_execution_failed");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/run-step.test.ts`
Expected: FAIL — cannot find `../testing/fake-engine` / `../pipeline/run-step`.

- [ ] **Step 3: Implement the fake engine**

`packages/inference/src/testing/fake-engine.ts`:

```ts
import type { Engine, EngineRequest } from "../contracts";

export type FakeEngine = Engine & { calls: EngineRequest[] };

export function createFakeEngine(respond: (request: EngineRequest) => unknown): FakeEngine {
	const calls: EngineRequest[] = [];
	return {
		calls,
		async execute(request: EngineRequest) {
			calls.push(request);
			return { raw: respond(request) };
		},
	};
}
```

- [ ] **Step 4: Implement `runStep`**

`packages/inference/src/pipeline/run-step.ts`:

```ts
import type {
	InferenceStepDefinition,
	PromptPayload,
	ReferenceEnvelope,
	StepExecution,
	StepRunContext,
} from "../contracts";

function assemblePrompt(
	step: InferenceStepDefinition,
	inputs: Record<string, unknown>,
	references: Record<string, ReferenceEnvelope | ReferenceEnvelope[]>,
): PromptPayload {
	// MVP prompt assembly is intentionally minimal: one message carrying the
	// declared prompt id plus the resolved inputs/references as JSON. Real
	// prompt-template rendering is a follow-up.
	return {
		messages: [{ role: "user", content: JSON.stringify({ promptId: step.prompt?.id ?? null, inputs, references }) }],
	};
}

export async function runStep(step: InferenceStepDefinition, ctx: StepRunContext): Promise<StepExecution> {
	const inputs: Record<string, unknown> = {};
	for (const [name, ref] of Object.entries(step.inputs ?? {})) {
		inputs[name] = await ctx.resolveInput(ref);
	}

	const references: Record<string, ReferenceEnvelope | ReferenceEnvelope[]> = {};
	for (const [name, ref] of Object.entries(step.references ?? {})) {
		references[name] = await ctx.resolveReference(ref);
	}

	try {
		const prompt = step.engine === "claude" ? assemblePrompt(step, inputs, references) : undefined;
		const { raw } = await ctx.engines[step.engine].execute({ prompt, run: step.run, inputs, references });
		// MVP: schema validation is pass-through (output === raw). @cx/validation is wired in a follow-up.
		const output = raw;
		const contextWrites = step.output.writeToContext ? { [step.output.writeToContext]: output } : undefined;
		return { status: "succeeded", inputs, references, prompt, raw, output, contextWrites };
	} catch (error) {
		return {
			status: "failed",
			inputs,
			references,
			raw: null,
			error: { code: "step_execution_failed", message: error instanceof Error ? error.message : String(error) },
		};
	}
}
```

- [ ] **Step 5: Export `runStep` from `pipeline/index.ts`**

Add this line to `packages/inference/src/pipeline/index.ts`:

```ts
export { runStep } from "./run-step";
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/run-step.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/inference/src/testing/fake-engine.ts packages/inference/src/pipeline/run-step.ts packages/inference/src/pipeline/index.ts packages/inference/src/__tests__/run-step.test.ts
git commit -m "feat(inference): runStep with fake-engine test seam"
```

---

### Task 8: Execution engines (function + claude stub)

**Files:**
- Create: `packages/inference/src/engine/function-engine.ts`
- Create: `packages/inference/src/engine/claude-engine.ts`
- Create: `packages/inference/src/engine/index.ts`
- Test: `packages/inference/src/__tests__/engine.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/inference/src/__tests__/engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createClaudeEngine } from "../engine/claude-engine";
import { createFunctionEngine } from "../engine/function-engine";

describe("function engine", () => {
	it("dispatches a registered function by FunctionRef.id", async () => {
		const engine = createFunctionEngine({ "demo-echo": (req) => ({ echoed: req.inputs }) });
		const result = await engine.execute({ run: { id: "demo-echo" }, inputs: { a: 1 }, references: {} });
		expect(result.raw).toEqual({ echoed: { a: 1 } });
	});

	it("throws on missing run or unknown function", async () => {
		const engine = createFunctionEngine({});
		await expect(engine.execute({ inputs: {}, references: {} })).rejects.toThrow();
		await expect(engine.execute({ run: { id: "nope" }, inputs: {}, references: {} })).rejects.toThrow();
	});
});

describe("claude engine (MVP stub)", () => {
	it("throws not-implemented", async () => {
		const engine = createClaudeEngine();
		await expect(engine.execute({ inputs: {}, references: {} })).rejects.toThrow(/not implemented/i);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/engine.test.ts`
Expected: FAIL — cannot find engine modules.

- [ ] **Step 3: Implement the engines**

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

/**
 * MVP stub. The claude engine will delegate to @cx/agent (resolveSkill +
 * Claude Agent SDK) in a follow-up. Until then it throws so misuse is loud.
 */
export function createClaudeEngine(): Engine {
	return {
		async execute() {
			throw new Error("claude engine not implemented in MVP; wire @cx/agent in a follow-up");
		},
	};
}
```

`packages/inference/src/engine/index.ts`:

```ts
export { createClaudeEngine } from "./claude-engine";
export { createFunctionEngine, type InferenceFunction } from "./function-engine";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/inference/src/engine packages/inference/src/__tests__/engine.test.ts
git commit -m "feat(inference): function engine + claude engine stub"
```

---

### Task 9: runInferenceJob + createTestRuntime (vertical slice)

**Files:**
- Create: `packages/inference/src/worker/resolve-input.ts`
- Create: `packages/inference/src/worker/run-inference-job.ts`
- Create: `packages/inference/src/testing/test-runtime.ts`
- Create: `packages/inference/src/testing/index.ts`
- Test: `packages/inference/src/__tests__/run-inference-job.test.ts`

- [ ] **Step 1: Write the failing slice test**

`packages/inference/src/__tests__/run-inference-job.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { InferenceEvent } from "../contracts";
import { createPipelineRegistry, definePipeline, defineStep } from "../pipeline";
import { createFunctionEngine } from "../engine";
import { createTestRuntime } from "../testing";
import { runInferenceJob } from "../worker/run-inference-job";

function demoRuntime() {
	const pipelines = createPipelineRegistry();
	pipelines.register(
		definePipeline({
			id: "demo",
			version: "v1",
			steps: [
				defineStep({
					id: "demo",
					engine: "function",
					run: { id: "demo-echo" },
					output: { schema: {}, schemaVersion: "v0", writeToContext: "demo-result" },
				}),
			],
		}),
	);
	const engines = {
		function: createFunctionEngine({ "demo-echo": (req) => ({ ok: true, input: req.inputs }) }),
		claude: { async execute() { throw new Error("unused"); } },
	};
	return createTestRuntime({ pipelines, engines });
}

describe("runInferenceJob (vertical slice)", () => {
	it("runs queued -> running -> succeeded, emits ordered events, writes artifacts + context", async () => {
		const runtime = demoRuntime();
		const job = await runtime.jobStore.createJob({ pipelineId: "demo", pipelineVersion: "v1", input: { spec: 1 } });

		await runInferenceJob(job.jobId, runtime);

		expect((await runtime.jobStore.getJob(job.jobId)).status).toBe("succeeded");

		const events = await runtime.jobStore.listEvents(job.jobId);
		expect(events.map((e: InferenceEvent) => e.type)).toEqual([
			"job_started",
			"step_started",
			"step_completed",
			"job_completed",
		]);
		expect(events.map((e) => e.seq)).toEqual([1, 2, 3, 4]);

		const dir = "steps/demo";
		for (const file of ["step.json", "inputs.json", "references.json", "raw-response.json", "output.json"]) {
			expect(await runtime.artifactStore.exists(job.jobId, `${dir}/${file}`)).toBe(true);
		}
		// function engine → no prompt.json
		expect(await runtime.artifactStore.exists(job.jobId, `${dir}/prompt.json`)).toBe(false);

		const ctx = runtime.createContextStore(job.jobId);
		expect(await ctx.readJson("demo-result")).toEqual({ ok: true, input: {} });
	});

	it("halts and marks failed when a step fails", async () => {
		const pipelines = createPipelineRegistry();
		pipelines.register(
			definePipeline({
				id: "boom",
				version: "v1",
				steps: [defineStep({ id: "x", engine: "function", run: { id: "missing" }, output: { schema: {}, schemaVersion: "v0" } })],
			}),
		);
		const runtime = createTestRuntime({
			pipelines,
			engines: { function: createFunctionEngine({}), claude: { async execute() { throw new Error("unused"); } } },
		});
		const job = await runtime.jobStore.createJob({ pipelineId: "boom", pipelineVersion: "v1", input: {} });
		await runInferenceJob(job.jobId, runtime);
		expect((await runtime.jobStore.getJob(job.jobId)).status).toBe("failed");
		const events = await runtime.jobStore.listEvents(job.jobId);
		expect(events.at(-1)?.type).toBe("job_failed");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/run-inference-job.test.ts`
Expected: FAIL — cannot find worker/testing modules.

- [ ] **Step 3: Implement the input resolver**

`packages/inference/src/worker/resolve-input.ts`:

```ts
import type { ArtifactStore, ContextStore, Job, StepInputRef } from "../contracts";

function getPath(value: unknown, dotted: string): unknown {
	return dotted.split(".").reduce<unknown>((acc, key) => {
		if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
			return (acc as Record<string, unknown>)[key];
		}
		return undefined;
	}, value);
}

export async function resolveInput(
	ref: StepInputRef,
	deps: { job: Job; context: ContextStore; artifactStore: ArtifactStore; jobId: string },
): Promise<unknown> {
	switch (ref.kind) {
		case "value":
			return ref.value;
		case "job-input":
			return ref.path ? getPath(deps.job.input, ref.path) : deps.job.input;
		case "context":
			return deps.context.readJson(ref.key);
		case "artifact":
			return deps.artifactStore.readJson(deps.jobId, ref.path);
		case "step-output":
			return deps.artifactStore.readJson(deps.jobId, `steps/${ref.stepId}/output.json`);
	}
}
```

- [ ] **Step 4: Implement `runInferenceJob`**

`packages/inference/src/worker/run-inference-job.ts`:

```ts
import type { InferenceRuntime } from "../contracts";
import { runStep } from "../pipeline/run-step";
import { resolveInput } from "./resolve-input";

export async function runInferenceJob(jobId: string, runtime: InferenceRuntime): Promise<void> {
	const { jobStore, artifactStore, engines, knowledgeBase, pipelines, now } = runtime;
	const job = await jobStore.getJob(jobId);
	const pipeline = pipelines.get(job.pipelineId, job.pipelineVersion);
	const context = runtime.createContextStore(jobId);

	await jobStore.updateJob(jobId, { status: "running" });
	await jobStore.appendEvent(jobId, { jobId, type: "job_started", timestamp: now() });

	for (const step of pipeline.steps) {
		await jobStore.createStep(jobId, step.id);
		await jobStore.updateStep(jobId, step.id, { status: "running", startedAt: now() });
		await jobStore.updateJob(jobId, { currentStepId: step.id });
		await jobStore.appendEvent(jobId, { jobId, type: "step_started", timestamp: now(), stepId: step.id });

		const exec = await runStep(step, {
			resolveInput: (ref) => resolveInput(ref, { job, context, artifactStore, jobId }),
			resolveReference: (ref) => knowledgeBase.resolve(ref),
			engines,
		});

		const dir = `steps/${step.id}`;
		await artifactStore.writeJson(jobId, `${dir}/inputs.json`, exec.inputs);
		await artifactStore.writeJson(jobId, `${dir}/references.json`, exec.references);
		if (exec.prompt) await artifactStore.writeJson(jobId, `${dir}/prompt.json`, exec.prompt);
		await artifactStore.writeJson(jobId, `${dir}/raw-response.json`, exec.raw);

		if (exec.status === "failed") {
			await jobStore.updateStep(jobId, step.id, { status: "failed", completedAt: now(), error: exec.error });
			await jobStore.appendEvent(jobId, { jobId, type: "step_failed", timestamp: now(), stepId: step.id });
			await jobStore.updateJob(jobId, { status: "failed", error: exec.error });
			await jobStore.appendEvent(jobId, { jobId, type: "job_failed", timestamp: now() });
			return;
		}

		await artifactStore.writeJson(jobId, `${dir}/output.json`, exec.output);
		for (const [key, val] of Object.entries(exec.contextWrites ?? {})) {
			await context.writeJson(key, val);
		}
		await jobStore.updateStep(jobId, step.id, { status: "succeeded", completedAt: now() });
		await jobStore.appendEvent(jobId, { jobId, type: "step_completed", timestamp: now(), stepId: step.id });
	}

	await jobStore.updateJob(jobId, { status: "succeeded" });
	await jobStore.appendEvent(jobId, { jobId, type: "job_completed", timestamp: now() });
}
```

- [ ] **Step 5: Implement `createTestRuntime` and the testing barrel**

`packages/inference/src/testing/test-runtime.ts`:

```ts
import type { EngineRegistry, InferenceRuntime, KnowledgeBase, PipelineRegistry } from "../contracts";
import { createContextStore } from "../context/context-store";
import { createJobStore } from "../stores/job-store";
import { MemoryArtifactStore } from "./memory-artifact-store";

export function createTestRuntime(opts: {
	pipelines: PipelineRegistry;
	engines: EngineRegistry;
	knowledgeBase?: KnowledgeBase;
}): InferenceRuntime {
	const artifactStore = new MemoryArtifactStore();
	let clock = 0;
	let id = 0;
	const now = () => new Date(clock++).toISOString();
	const newId = () => `job-${++id}`;
	const jobStore = createJobStore(artifactStore, { now, newId });

	return {
		jobStore,
		artifactStore,
		createContextStore: (jobId) => createContextStore(jobId, artifactStore),
		engines: opts.engines,
		knowledgeBase:
			opts.knowledgeBase ?? {
				async resolve() {
					throw new Error("test runtime has no knowledge base configured");
				},
			},
		pipelines: opts.pipelines,
		now,
		newId,
	};
}
```

`packages/inference/src/testing/index.ts`:

```ts
export { MemoryArtifactStore } from "./memory-artifact-store";
export { createFakeEngine, type FakeEngine } from "./fake-engine";
export { createTestRuntime } from "./test-runtime";
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run packages/inference/src/__tests__/run-inference-job.test.ts`
Expected: PASS — both slice and failure tests green.

- [ ] **Step 7: Run the whole package suite**

Run: `pnpm vitest run packages/inference`
Expected: PASS — all tasks' tests green.

- [ ] **Step 8: Commit**

```bash
git add packages/inference/src/worker packages/inference/src/testing/test-runtime.ts packages/inference/src/testing/index.ts packages/inference/src/__tests__/run-inference-job.test.ts
git commit -m "feat(inference): runInferenceJob orchestrator + test runtime (vertical slice)"
```

---

### Task 10: createInferenceRuntime + public surface (`index.ts`)

**Files:**
- Create: `packages/inference/src/worker/create-inference-runtime.ts`
- Create: `packages/inference/src/worker/index.ts`
- Modify: `packages/inference/src/index.ts` (the real public surface)
- Test: `packages/inference/src/__tests__/create-inference-runtime.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/inference/src/__tests__/create-inference-runtime.test.ts`:

```ts
import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createInferenceRuntime, createPipelineRegistry, definePipeline, defineStep, runInferenceJob } from "..";

describe("createInferenceRuntime", () => {
	it("wires a file-backed runtime that writes under dataRoot", async () => {
		const dataRoot = mkdtempSync(path.join(tmpdir(), "cx-rt-"));
		const pipelines = createPipelineRegistry();
		pipelines.register(
			definePipeline({
				id: "demo",
				version: "v1",
				steps: [
					defineStep({
						id: "demo",
						engine: "function",
						run: { id: "demo-echo" },
						output: { schema: {}, schemaVersion: "v0", writeToContext: "demo-result" },
					}),
				],
			}),
		);
		const runtime = createInferenceRuntime({
			dataRoot,
			pipelines,
			functions: { "demo-echo": () => ({ ok: true }) },
		});

		const job = await runtime.jobStore.createJob({ pipelineId: "demo", pipelineVersion: "v1", input: {} });
		await runInferenceJob(job.jobId, runtime);

		const jobJson = JSON.parse(
			await readFile(path.join(dataRoot, "inference-jobs", job.jobId, "job.json"), "utf8"),
		);
		expect(jobJson.status).toBe("succeeded");
		const outputJson = JSON.parse(
			await readFile(path.join(dataRoot, "inference-jobs", job.jobId, "steps/demo/output.json"), "utf8"),
		);
		expect(outputJson).toEqual({ ok: true });
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/inference/src/__tests__/create-inference-runtime.test.ts`
Expected: FAIL — `createInferenceRuntime` not exported from `..`.

- [ ] **Step 3: Implement `createInferenceRuntime`**

`packages/inference/src/worker/create-inference-runtime.ts`:

```ts
import { randomUUID } from "node:crypto";
import type { InferenceRuntime, KnowledgeBase, PipelineRegistry } from "../contracts";
import { createContextStore } from "../context/context-store";
import { createClaudeEngine } from "../engine/claude-engine";
import { createFunctionEngine, type InferenceFunction } from "../engine/function-engine";
import { createJobStore } from "../stores/job-store";
import { FileArtifactStore } from "../stores/file-artifact-store";

export function createInferenceRuntime(config: {
	pipelines: PipelineRegistry;
	dataRoot?: string;
	functions?: Record<string, InferenceFunction>;
	knowledgeBase?: KnowledgeBase;
}): InferenceRuntime {
	const artifactStore = new FileArtifactStore(config.dataRoot ?? ".data");
	const now = () => new Date().toISOString();
	const newId = () => randomUUID();
	const jobStore = createJobStore(artifactStore, { now, newId });

	return {
		jobStore,
		artifactStore,
		createContextStore: (jobId) => createContextStore(jobId, artifactStore),
		engines: {
			function: createFunctionEngine(config.functions ?? {}),
			claude: createClaudeEngine(),
		},
		knowledgeBase:
			config.knowledgeBase ?? {
				async resolve() {
					throw new Error("knowledge base not configured");
				},
			},
		pipelines: config.pipelines,
		now,
		newId,
	};
}
```

`packages/inference/src/worker/index.ts`:

```ts
export { createInferenceRuntime } from "./create-inference-runtime";
export { runInferenceJob } from "./run-inference-job";
```

- [ ] **Step 4: Write the real public `index.ts`**

`packages/inference/src/index.ts`:

```ts
export type {
	Engine,
	InferenceEvent,
	InferenceRuntime,
	InferenceStepDefinition,
	Job,
	PipelineDefinition,
	Step,
} from "./contracts";

export {
	artifact,
	context,
	createPipelineRegistry,
	defineStep,
	definePipeline,
	jobInput,
	knowledge,
	stepOutput,
	value,
} from "./pipeline";

export type { InferenceFunction } from "./engine";

export { createInferenceRuntime, runInferenceJob } from "./worker";
```

> Note: `runStep`, the stores, the engines, and the `Memory*`/fake helpers are intentionally NOT exported here. Test doubles come from the `@cx/inference/testing` subpath.

- [ ] **Step 5: Run test + full suite to verify pass**

Run: `pnpm vitest run packages/inference`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/inference/src/worker packages/inference/src/index.ts packages/inference/src/__tests__/create-inference-runtime.test.ts
git commit -m "feat(inference): createInferenceRuntime + restricted public surface"
```

---

### Task 11: API routes — POST create + GET events (SSE)

**Files:**
- Create: `apps/web/src/lib/inference-runtime.ts` (shared runtime + demo pipeline)
- Create: `apps/web/src/app/api/inference/route.ts` (POST)
- Create: `apps/web/src/app/api/inference/[jobId]/events/route.ts` (GET SSE)
- Modify: `apps/web/package.json` (add `@cx/inference` dependency)

- [ ] **Step 1: Add the workspace dependency**

Edit `apps/web/package.json` — add to `dependencies`:

```json
"@cx/inference": "workspace:*"
```

Run: `pnpm install`
Expected: links `@cx/inference` into `apps/web`.

- [ ] **Step 2: Create the shared runtime module**

`apps/web/src/lib/inference-runtime.ts`:

```ts
import {
	createInferenceRuntime,
	createPipelineRegistry,
	defineStep,
	definePipeline,
	type InferenceRuntime,
} from "@cx/inference";

const pipelines = createPipelineRegistry();
pipelines.register(
	definePipeline({
		id: "demo",
		version: "v1",
		steps: [
			defineStep({
				id: "demo",
				engine: "function",
				run: { id: "demo-echo" },
				output: { schema: {}, schemaVersion: "v0", writeToContext: "demo-result" },
			}),
		],
	}),
);

// Single shared runtime so POST (writer) and the SSE GET (reader) hit the same
// .data root within the dev server process.
export const inferenceRuntime: InferenceRuntime = createInferenceRuntime({
	pipelines,
	functions: { "demo-echo": (req) => ({ ok: true, input: req.inputs }) },
});
```

- [ ] **Step 3: Create the POST route**

`apps/web/src/app/api/inference/route.ts`:

```ts
import { runInferenceJob } from "@cx/inference";
import { inferenceRuntime } from "@/lib/inference-runtime";

export async function POST(request: Request) {
	const body = (await request.json().catch(() => ({}))) as {
		pipelineId?: string;
		pipelineVersion?: string;
		input?: unknown;
	};
	const job = await inferenceRuntime.jobStore.createJob({
		pipelineId: body.pipelineId ?? "demo",
		pipelineVersion: body.pipelineVersion ?? "v1",
		input: body.input ?? {},
	});
	// fire-and-forget: do not await the pipeline; the client follows via SSE.
	void runInferenceJob(job.jobId, inferenceRuntime);
	return Response.json({ jobId: job.jobId });
}
```

- [ ] **Step 4: Create the SSE GET route**

`apps/web/src/app/api/inference/[jobId]/events/route.ts`:

```ts
import { inferenceRuntime } from "@/lib/inference-runtime";

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
	const { jobId } = await params;
	const headerLastId = Number(request.headers.get("last-event-id") ?? 0);
	const encoder = new TextEncoder();

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			let after = Number.isFinite(headerLastId) ? headerLastId : 0;
			let closed = false;
			request.signal.addEventListener("abort", () => {
				closed = true;
			});

			while (!closed) {
				const events = await inferenceRuntime.jobStore.listEvents(jobId, after);
				for (const event of events) {
					after = event.seq;
					controller.enqueue(
						encoder.encode(`id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`),
					);
				}
				const last = events.at(-1);
				if (last && (last.type === "job_completed" || last.type === "job_failed")) break;
				await new Promise((resolve) => setTimeout(resolve, 200));
			}
			controller.close();
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
		},
	});
}
```

- [ ] **Step 5: Manual verification — job folder + SSE stream**

Start the dev server (separately, e.g. `pnpm dev`), then:

Run:
```bash
curl -s -X POST http://localhost:3000/api/inference -H 'content-type: application/json' -d '{"input":{"hello":"world"}}'
```
Expected: JSON `{"jobId":"<uuid>"}`.

Run (replace `<jobId>`):
```bash
ls -R .data/inference-jobs/<jobId>
```
Expected: `job.json`, `events.ndjson`, `steps/demo/{step.json,inputs.json,references.json,raw-response.json,output.json}`, `context/demo-result.json`.

Run (stream events; should print the 4 events then the connection closes):
```bash
curl -sN http://localhost:3000/api/inference/<jobId>/events
```
Expected: SSE lines with `event: job_started … step_started … step_completed … job_completed`, each with an `id:` equal to its `seq`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/web/src/lib/inference-runtime.ts "apps/web/src/app/api/inference/route.ts" "apps/web/src/app/api/inference/[jobId]/events/route.ts" pnpm-lock.yaml
git commit -m "feat(inference): POST create + SSE events API routes (local MVP)"
```

---

## Self-Review Notes

- **Spec coverage:** Tasks map to the user's requested order — package scaffold (T1), contracts (T2), ArtifactStore memory+file with path safety & job root (T3), JobStore with seq/events (T4), ContextStore (T5), pipeline helpers (T6), runStep with fake engine (T7), engines (T8), runInferenceJob slice with the doc's §16.4 acceptance assertions adapted to the function-engine demo (T9), createInferenceRuntime + public surface (T10), POST + SSE routes with manual browser/SSE verification (T11).
- **MVP simplifications are listed in the header** and cross-referenced in the tasks where they apply (single JobStore impl, `steps/{stepId}/` folder, function-engine demo omits `prompt.json`, pass-through validation, claude stub).
- **Type consistency:** `appendEvent(jobId, Omit<InferenceEvent,"seq">) → InferenceEvent`, `createJobStore(store, {now,newId})`, `createContextStore(jobId, store)`, `runStep(step, StepRunContext) → StepExecution`, `createFunctionEngine(Record<string, InferenceFunction>)`, `createInferenceRuntime(config) → InferenceRuntime`, `runInferenceJob(jobId, InferenceRuntime)` are used consistently across tasks and tests.

## Deferred (explicitly out of MVP scope)

- `@cx/validation` wiring for real `output.schema` checks (replace pass-through in `runStep`).
- `claude` engine delegating to `@cx/agent` (`resolveSkill` + Agent SDK) and the per-source `KnowledgeBase` resolvers + `ReferenceEnvelope` snapshots.
- Step folder order prefix (`01-<id>`), `GET /:jobId`, `GET /:jobId/steps`, `GET /:jobId/artifacts/:name`.
- Structural boundary enforcement (Biome `noRestrictedImports` + `scripts/check-inference-boundaries.mjs`) and a real queue/worker process for non-local deployment.
