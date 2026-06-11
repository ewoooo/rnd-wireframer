import type { FunctionRef, KnowledgeValue, OutputContractValue } from "./step";

export type EngineRequest = {
	task?: string;
	run?: FunctionRef;
	inputs: Record<string, unknown>;
	references: Record<string, KnowledgeValue | KnowledgeValue[]>;
	outputContract: OutputContractValue;
};

export type EngineResult = {
	raw: unknown;
	/** Engine-assembled prompt, persisted to steps/{stepId}/prompt.json when present. */
	prompt?: unknown;
};

export interface Engine {
	execute(request: EngineRequest): Promise<EngineResult>;
}

export type EngineRegistry = Record<"claude" | "function", Engine>;
