import type { FunctionRef, KnowledgeValue, OutputContractValue, StepConstraint } from "./step";

export type EngineRequest = {
	task?: string;
	run?: FunctionRef;
	inputs: Record<string, unknown>;
	references: Record<string, KnowledgeValue | KnowledgeValue[]>;
	outputContract: OutputContractValue;
	/** claude step 제약 프로필. 생략 시 "strict". */
	constraint?: StepConstraint;
};

/**
 * LLM 호출 사용량 메타(@cx/agent AgentUsage와 같은 모양 — 구조적 호환).
 * claude step만 채우고 function step은 undefined.
 */
export type StepUsage = {
	inputTokens?: number;
	outputTokens?: number;
	cacheCreationInputTokens?: number;
	cacheReadInputTokens?: number;
	totalCostUsd?: number;
	durationMs?: number;
};

export type EngineResult = {
	raw: unknown;
	/** Engine-assembled prompt, persisted to steps/{stepId}/prompt.json when present. */
	prompt?: unknown;
	usage?: StepUsage;
};

export interface Engine {
	execute(request: EngineRequest): Promise<EngineResult>;
}

export type EngineRegistry = Record<"claude" | "function", Engine>;
