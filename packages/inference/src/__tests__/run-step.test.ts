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
		engine: "function",
		inputs: {
			source: { kind: "value", value: { screenCode: "SAMPLE" } },
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
			resolveInput: async (ref) => (ref.kind === "value" ? ref.value : null),
			resolveReference: async () => {
				throw new Error("no references expected");
			},
			resolveOutputContract: (ref) => knowledgeBase.resolveOutputContract(ref),
		});

		expect(execution.status).toBe("succeeded");
		expect(execution.output).toEqual(validSourceSpec);
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
			resolveInput: async (ref) => (ref.kind === "value" ? ref.value : null),
			resolveReference: async () => {
				throw new Error("no references expected");
			},
			resolveOutputContract: (ref) => knowledgeBase.resolveOutputContract(ref),
		});

		expect(execution.status).toBe("failed");
		expect(execution.error?.code).toBe("output_contract_validation_failed");
		expect(execution.output).toBeUndefined();
	});

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
				function: {
					async execute() {
						return { raw: {} };
					},
				},
			},
		};
		const result = await runStep(step, context as never);
		expect(captured).toEqual({ id: "screen-intent" });
		expect(result.status).toBe("succeeded");
	});
});
