import {
	Agent,
	type AgentInputItem,
	type AgentOptions,
	type NonStreamRunOptions,
	run,
	type TextOutput,
} from "@openai/agents";

export const DEFAULT_CX_AGENT_MODEL = "gpt-5.4-mini";

export type CxTextAgent = Agent<unknown, TextOutput>;

export interface CreateCxTextAgentOptions {
	name: string;
	instructions: string;
	model?: string;
	modelSettings?: AgentOptions<unknown, TextOutput>["modelSettings"];
	tools?: AgentOptions<unknown, TextOutput>["tools"];
	handoffs?: AgentOptions<unknown, TextOutput>["handoffs"];
}

export type CxTextAgentInput = string | AgentInputItem[];

export type CxTextAgentRunOptions = NonStreamRunOptions<unknown, CxTextAgent>;

export interface CxTextAgentRunOutput {
	finalOutput: string;
	lastResponseId?: string;
	rawResponseCount: number;
}

export function createCxTextAgent(options: CreateCxTextAgentOptions): CxTextAgent {
	return new Agent({
		name: options.name,
		instructions: options.instructions,
		model: options.model ?? DEFAULT_CX_AGENT_MODEL,
		modelSettings: options.modelSettings,
		tools: options.tools,
		handoffs: options.handoffs,
	});
}

export async function runCxTextAgent(
	agent: CxTextAgent,
	input: CxTextAgentInput,
	options?: CxTextAgentRunOptions,
): Promise<CxTextAgentRunOutput> {
	const result = await run(agent, input, options);

	if (typeof result.finalOutput !== "string") {
		throw new Error("Agent run finished without a text finalOutput.");
	}

	return {
		finalOutput: result.finalOutput,
		lastResponseId: result.lastResponseId,
		rawResponseCount: result.rawResponses.length,
	};
}
