import type { Engine, InferenceStepDefinition } from "@cx/inference";
import { createInferenceKnowledgeBase, runStep } from "@cx/inference";
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
});
