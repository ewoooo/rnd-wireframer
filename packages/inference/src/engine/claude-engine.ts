import type { AgentPromptArtifact, AgentRuntime } from "@cx/agent";
import type { Engine } from "../contracts";

/** Thin adapter: assembles the prompt artifact and runs it via @cx/agent. Owns no domain mapping. */
export function createClaudeEngine(agentRuntime: AgentRuntime): Engine {
	return {
		async execute({ task, inputs, references, outputContract }) {
			if (!task) throw new Error("claude engine requires step.task");
			const query = `Produce ${outputContract.data.dtoName} (${outputContract.id}) from the provided context.`;
			const context = { inputs, references, jsonSchema: outputContract.data.jsonSchema };
			const prompt: AgentPromptArtifact = {
				system: `You are the Claude ${task} agent for RND Screen Generator.`,
				user: query,
				metadata: { context, taskKind: task },
			};
			const result = await agentRuntime.run({
				taskKind: task,
				input: { query, context },
				prompt,
				session: { mode: "new" },
			});
			return { raw: result.payload, prompt };
		},
	};
}
