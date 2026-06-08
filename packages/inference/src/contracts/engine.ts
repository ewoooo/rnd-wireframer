import type { FunctionRef, KnowledgeValue, OutputContractValue, PromptTemplateRef } from "./step";

export type EngineRequest = {
	prompt?: PromptTemplateRef;
	run?: FunctionRef;
	inputs: Record<string, unknown>;
	references: Record<string, KnowledgeValue | KnowledgeValue[]>;
	outputContract: OutputContractValue;
};

export type EngineResult = { raw: unknown };

export interface Engine {
	execute(request: EngineRequest): Promise<EngineResult>;
}

export type EngineRegistry = Record<"claude" | "function", Engine>;
