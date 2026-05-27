import type { AgentRunner, AgentRunnerRequest } from "@cx/agent/contract";
import type { ScreenGenerationAgentInput } from "@cx/orchestration/types";

export function createFakeGenerationAgentRunner(input: {
	agentInput: ScreenGenerationAgentInput;
	onRequest: (request: AgentRunnerRequest) => void;
}): AgentRunner {
	return async (request) => {
		input.onRequest(request);

		return {
			payload: {
				children: [
					{
						children: [
							screenRegion("Screen.Header", "screen-header"),
							{
								children: [],
								componentVersion: "0.1.0",
								metadata: { id: "screen-contents", title: "Contents" },
								props: {
									layout: { direction: "column" },
									scroll: true,
								},
								type: "Screen.Contents",
							},
							screenRegion("Screen.Bottom", "screen-bottom"),
						],
						componentVersion: "0.1.0",
						metadata: {
							id: input.agentInput.context.sourceSummary.screenCode,
							title: input.agentInput.context.sourceSummary.screenName,
						},
						type: "Screen",
					},
				],
				metadata: { id: input.agentInput.context.sourceSummary.screenCode },
				version: input.agentInput.context.targetArtifact.schemaVersion,
			},
			session: {
				mode: request.session?.mode ?? "new",
				sessionId: request.session?.sessionId,
			},
			taskKind: request.taskKind,
		};
	};
}

function screenRegion(type: "Screen.Header" | "Screen.Bottom", id: string) {
	return {
		children: [],
		componentVersion: "0.1.0",
		metadata: { id, title: id },
		props: {
			layout: { direction: "column" },
			position: "static",
		},
		type,
	};
}
