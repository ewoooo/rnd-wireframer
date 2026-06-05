import type { AgentRunner, AgentRunnerRequest, AgentRunResult } from "@cx/agent/contract";
import { buildScreenIntentAgentInput } from "@cx/orchestration";
import type { ScreenIntentAgentInput } from "@cx/orchestration/types";
import { SCHEMA_VERSION, type ScreenIntentContract, type SourceSpec } from "@cx/schema";
import { runAgentPromptNode } from "../agent";

export type RunScreenIntentNodeInput = {
	onRunnerRequest?: (request: AgentRunnerRequest) => void;
	runner: AgentRunner;
	sourceSpec: SourceSpec;
};

export type RunScreenIntentNodeResult = {
	agentInput: ScreenIntentAgentInput;
	agentResult: AgentRunResult;
	runnerRequest?: AgentRunnerRequest;
};

export async function runScreenIntentNode(
	input: RunScreenIntentNodeInput,
): Promise<RunScreenIntentNodeResult> {
	const agentInput = buildScreenIntentAgentInput(input.sourceSpec);
	return runAgentPromptNode({
		agentInput,
		onRunnerRequest: input.onRunnerRequest,
		runner: input.runner,
		taskKind: "screen-intent",
	});
}

export function createFakeScreenIntent(sourceSpec: SourceSpec): ScreenIntentContract {
	const screen = sourceSpec.sourceShape.screen;
	const componentIds = listSourceRefs(sourceSpec).slice(0, 8);

	return {
		contentPriority: componentIds,
		primaryUserAction: "complete-primary-flow",
		rationale:
			"Fake pipeline intent keeps the design decision artifact visible before composition planning.",
		schemaVersion: SCHEMA_VERSION.screenIntent,
		screenPurpose: `${screen.name} 화면에서 핵심 정보를 이해하고 다음 행동으로 이어지게 한다.`,
		sourceInterpretation: {
			defer: [],
			preserve: [screen.screenCode, screen.route],
			summarize: componentIds,
		},
	};
}

function listSourceRefs(sourceSpec: SourceSpec): string[] {
	return sourceSpec.sourceShape.screen.regions.flatMap((region) =>
		region.children.flatMap((area) => [
			area.sourceAreaId,
			...area.children.map((component) => component.sourceId ?? component.sourceComponentId),
		]),
	);
}
