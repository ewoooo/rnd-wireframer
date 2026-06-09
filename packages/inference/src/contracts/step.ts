import type { InferenceReference, OutputContractObject } from "@cx/schema";

export type KnowledgeValue = InferenceReference;

export type StepInputRef = { kind: "job-input"; path?: string } | { kind: "context"; key: string };

export type KnowledgeRef = {
	source:
		| "component-catalog"
		| "layout-catalog"
		| "prompt-catalog"
		| "skill"
		| "stage-skillset"
		| "token-catalog";
	id?: string;
	version?: string;
};

export type OutputContractRef = {
	source: "output-contract";
	id: string;
	version?: string;
};

export type PromptTemplateRef = { id: string; version?: string };
export type FunctionRef = { id: string };

export type StepOutputFailurePolicy = {
	kind: "validation-report-has-errors";
};

export type OutputContract = {
	contractRef: OutputContractRef;
	failWhen?: StepOutputFailurePolicy;
	writeToContext?: string;
};

export type OutputContractValue = OutputContractObject;

export type StepRunCondition = {
	contextKey: string;
	kind: "context-validation-report-has-errors";
};

export type InferenceStepDefinition = {
	id: string;
	engine: "claude" | "function";
	inputs?: Record<string, StepInputRef>;
	references?: Record<string, KnowledgeRef>;
	prompt?: PromptTemplateRef;
	run?: FunctionRef;
	runWhen?: StepRunCondition;
	output: OutputContract;
};
