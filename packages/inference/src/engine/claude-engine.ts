import { type AgentRuntime, type AgentTaskKind, runAgentTask } from "@cx/agent";
import type { Engine } from "../contracts";

/** Thin adapter: delegates a claude step to @cx/agent. Owns no domain mapping. */
export function createClaudeEngine(agentRuntime: AgentRuntime): Engine {
	return {
		async execute({ prompt, inputs, references, outputContract }) {
			if (!prompt?.id) {
				throw new Error("claude engine requires step.prompt.id (AgentTaskKind)");
			}
			const result = await runAgentTask(agentRuntime, {
				taskKind: prompt.id as AgentTaskKind,
				input: {
					query: `Produce ${outputContract.data.dtoName} (${outputContract.id}) from the provided context.`,
					context: { inputs, references, jsonSchema: outputContract.data.jsonSchema },
				},
			});
			return { raw: result.payload };
		},
	};
}
