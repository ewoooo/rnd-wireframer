import type { InferenceReference, OutputContractObject } from "@cx/schema";

export type KnowledgeValue = InferenceReference;

export type StepInputRef =
	| { kind: "job-input"; path?: string }
	| { kind: "context"; key: string };

export type KnowledgeRef = {
	source: "component-catalog" | "layout-catalog" | "skill" | "prompt-catalog" | "token-catalog";
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

export type OutputContract = {
	contractRef: OutputContractRef;
	writeToContext?: string;
};

export type OutputContractValue = OutputContractObject;

export type InferenceStepDefinition = {
	id: string;
	engine: "claude" | "function";
	inputs?: Record<string, StepInputRef>;
	references?: Record<string, KnowledgeRef>;
	prompt?: PromptTemplateRef;
	run?: FunctionRef;
	output: OutputContract;
};
