import type { Engine, InferenceStepDefinition } from "@cx/inference";
import { createInferenceKnowledgeBase, runStep } from "@cx/inference";
import { resolveOutputContractForInference, SCHEMA_VERSION } from "@cx/schema";
import { describe, expect, it } from "vitest";

const validSourceSpec = {
	schemaVersion: "source-spec.v0.1",
	sourceImport: {
		files: [],
		importId: "sample",
		receivedAt: "2026-06-08T00:00:00.000Z",
		sourceKind: "prdd-markdown-bundle",
	},
	sourceShape: {
		screen: {
			name: "Sample",
			regions: [],
			route: "/sample",
			screenCode: "SAMPLE",
		},
	},
};

function makeStep(): InferenceStepDefinition {
	return {
		id: "analyze",
		inputs: {
			source: { kind: "context", key: "source" },
		},
		run: { id: "fake" },
		output: {
			contractRef: { source: "output-contract", id: "source-spec" },
			writeToContext: "source-spec",
		},
	};
}

describe("runStep", () => {
	it("validates raw output with the resolved output-contract", async () => {
		const engine: Engine = {
			async execute(request) {
				expect(request.outputContract.id).toBe("source-spec");
				return { raw: validSourceSpec };
			},
		};
		const knowledgeBase = createInferenceKnowledgeBase();

		const execution = await runStep(makeStep(), {
			engines: { claude: engine, function: engine },
			resolveInput: async () => ({ screenCode: "SAMPLE" }),
			resolveReference: async () => {
				throw new Error("no references expected");
			},
			resolveOutputContract: (ref) => knowledgeBase.resolveOutputContract(ref),
		});

		expect(execution.status).toBe("succeeded");
		expect(execution.raw).toEqual(validSourceSpec);
		expect(execution.contextWrites).toEqual({ "source-spec": validSourceSpec });
	});

	it("fails instead of coercing when raw output violates the output-contract", async () => {
		const engine: Engine = {
			async execute() {
				return { raw: { sourceImport: {} } };
			},
		};
		const knowledgeBase = createInferenceKnowledgeBase();

		const execution = await runStep(makeStep(), {
			engines: { claude: engine, function: engine },
			resolveInput: async () => ({ screenCode: "SAMPLE" }),
			resolveReference: async () => {
				throw new Error("no references expected");
			},
			resolveOutputContract: (ref) => knowledgeBase.resolveOutputContract(ref),
		});

		expect(execution.status).toBe("failed");
		expect(execution.error?.code).toBe("output_contract_validation_failed");
		expect(execution.contextWrites).toBeUndefined();
	});

	it("returns failed (not throw) after retrying when the engine always throws", async () => {
		let calls = 0;
		const engine: Engine = {
			async execute() {
				calls += 1;
				throw new Error("model returned non-JSON");
			},
		};
		const knowledgeBase = createInferenceKnowledgeBase();

		const execution = await runStep(makeStep(), {
			engines: { claude: engine, function: engine },
			resolveInput: async () => ({ screenCode: "SAMPLE" }),
			resolveReference: async () => {
				throw new Error("no references expected");
			},
			resolveOutputContract: (ref) => knowledgeBase.resolveOutputContract(ref),
		});

		expect(execution.status).toBe("failed");
		expect(execution.error?.code).toBe("engine_execution_failed");
		expect(calls).toBe(2);
	});

	it("succeeds on the second attempt after a transient throw", async () => {
		let calls = 0;
		const engine: Engine = {
			async execute() {
				calls += 1;
				if (calls === 1) {
					throw new Error("transient model failure");
				}
				return { raw: validSourceSpec };
			},
		};
		const knowledgeBase = createInferenceKnowledgeBase();

		const execution = await runStep(makeStep(), {
			engines: { claude: engine, function: engine },
			resolveInput: async () => ({ screenCode: "SAMPLE" }),
			resolveReference: async () => {
				throw new Error("no references expected");
			},
			resolveOutputContract: (ref) => knowledgeBase.resolveOutputContract(ref),
		});

		expect(execution.status).toBe("succeeded");
		expect(calls).toBe(2);
	});

	it("routes task steps to claude, auto-loads the same-named skillset, and snapshots the prompt", async () => {
		let capturedTask: unknown;
		const resolvedRefs: unknown[] = [];
		const step = {
			id: "02-screen-intent",
			task: "screen-intent",
			inputs: { sourceSpec: { kind: "context" as const, key: "source-spec" } },
			output: { contractRef: { source: "output-contract" as const, id: "screen-intent" } },
		};
		const context = {
			resolveInput: async () => ({ a: 1 }),
			resolveReference: async (ref: unknown) => {
				resolvedRefs.push(ref);
				return { kind: "skillset" } as never;
			},
			resolveOutputContract: async () => resolveOutputContractForInference("screen-intent"),
			engines: {
				claude: {
					async execute(request: { task?: string }) {
						capturedTask = request.task;
						return {
							prompt: { system: "s", user: "u" },
							raw: {
								schemaVersion: SCHEMA_VERSION.screenIntent,
								coreJudgment: "x",
								firstUnderstanding: "x",
								ctaPromise: "x",
								contentPriority: [],
								sourceInterpretation: { defer: [], preserve: [], summarize: [] },
							},
						};
					},
				},
				function: {
					async execute() {
						return { raw: {} };
					},
				},
			},
		};
		const result = await runStep(step, context as never);
		expect(capturedTask).toBe("screen-intent");
		expect(resolvedRefs).toEqual([{ source: "skillset", id: "screen-intent" }]);
		expect(result.references.skillset).toEqual({ kind: "skillset" });
		expect(result.prompt).toEqual({ system: "s", user: "u" });
		expect(result.status).toBe("succeeded");
	});

	it("narrows a selectFromContext reference catalog to the ids the upstream context adopted", async () => {
		const referenceCatalog = {
			kind: "reference-catalog",
			id: "area.catalog",
			owner: "@cx/agent",
			sourceRef: "ref",
			schemaVersion: "ssot-object.v1",
			data: {
				category: "area",
				mode: "catalog",
				documents: [
					{ id: "area-radio-option-group", situation: "s", tags: [], sourceRef: "a", body: "A" },
					{ id: "area-form-address", situation: "s", tags: [], sourceRef: "b", body: "B" },
				],
			},
		};
		let capturedReferences: Record<string, unknown> | undefined;
		const step: InferenceStepDefinition = {
			id: "04-render-tree",
			task: "screen-generation",
			references: {
				selectedAreaReferences: {
					source: "reference-area-catalog",
					selectFromContext: {
						contextKey: "composition-plan",
						path: ["designTrace", "usedReferenceIds"],
					},
				},
			},
			output: { contractRef: { source: "output-contract", id: "source-spec" } },
		};
		const execution = await runStep(step, {
			engines: {
				claude: {
					async execute(request) {
						capturedReferences = request.references;
						return { raw: validSourceSpec };
					},
				},
				function: {
					async execute() {
						return { raw: {} };
					},
				},
			},
			resolveInput: async (ref) => {
				expect(ref).toEqual({ kind: "context", key: "composition-plan" });
				return { designTrace: { usedReferenceIds: ["area-radio-option-group"] } };
			},
			resolveReference: async (ref) =>
				(ref.source === "skillset" ? { kind: "skillset" } : referenceCatalog) as never,
			resolveOutputContract: (ref) => createInferenceKnowledgeBase().resolveOutputContract(ref),
		});

		expect(execution.status).toBe("succeeded");
		const selected = capturedReferences?.selectedAreaReferences as typeof referenceCatalog;
		expect(selected.data.documents.map((document) => document.id)).toEqual([
			"area-radio-option-group",
		]);
	});

	it("writes context under the contract id by default and skips when writeToContext is false", async () => {
		const engine: Engine = {
			async execute() {
				return { raw: validSourceSpec };
			},
		};
		const knowledgeBase = createInferenceKnowledgeBase();
		const baseContext = {
			engines: { claude: engine, function: engine },
			resolveInput: async () => ({}),
			resolveReference: async () => {
				throw new Error("no references expected");
			},
			resolveOutputContract: (ref: Parameters<typeof knowledgeBase.resolveOutputContract>[0]) =>
				knowledgeBase.resolveOutputContract(ref),
		};

		const defaulted = await runStep(
			{
				id: "analyze",
				run: { id: "fake" },
				output: { contractRef: { source: "output-contract", id: "source-spec" } },
			},
			baseContext,
		);
		expect(defaulted.contextWrites).toEqual({ "source-spec": validSourceSpec });

		const skipped = await runStep(
			{
				id: "analyze",
				run: { id: "fake" },
				output: {
					contractRef: { source: "output-contract", id: "source-spec" },
					writeToContext: false,
				},
			},
			baseContext,
		);
		expect(skipped.contextWrites).toBeUndefined();
	});
});
