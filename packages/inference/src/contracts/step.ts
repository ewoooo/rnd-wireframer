import type { InferenceReference, OutputContractObject } from "@cx/schema";

export type KnowledgeValue = InferenceReference;

export type StepInputRef = { kind: "job-input"; path?: string } | { kind: "context"; key: string };

export type KnowledgeRef = {
	source:
		| "component-catalog"
		| "layout-catalog"
		| "skillset"
		| "token-catalog"
		| `reference-${string}`;
	id?: string;
};

export type OutputContractRef = {
	source: "output-contract";
	id: string;
};

export type FunctionRef = { id: string };

export type StepOutputFailurePolicy = {
	kind: "validation-report-has-errors";
};

export type OutputContract = {
	contractRef: OutputContractRef;
	failWhen?: StepOutputFailurePolicy;
	/** Context key for the step output. Defaults to contractRef.id; pass false to skip the write. */
	writeToContext?: string | false;
};

export type OutputContractValue = OutputContractObject;

export type StepRunCondition = {
	contextKey: string;
	kind: "context-validation-report-has-errors";
};

/**
 * Exactly one of `task` (claude step) or `run` (function step) must be set.
 * A claude step automatically loads the skillset named after its task;
 * `references` adds knowledge on top of that.
 */
export type InferenceStepDefinition = {
	id: string;
	task?: string;
	run?: FunctionRef;
	inputs?: Record<string, StepInputRef>;
	references?: Record<string, KnowledgeRef>;
	runWhen?: StepRunCondition;
	output: OutputContract;
};
