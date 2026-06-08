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
