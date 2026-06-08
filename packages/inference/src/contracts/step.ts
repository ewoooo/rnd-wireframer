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
