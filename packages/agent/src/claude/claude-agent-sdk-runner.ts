import type { AgentRunner } from "../contract";
import { AgentRunnerNotConfiguredError } from "../errors/agent-error";

export type CreateClaudeAgentSdkRunnerOptions = {
	localFirst?: boolean;
};

export function createClaudeAgentSdkRunner(
	_options: CreateClaudeAgentSdkRunnerOptions = {},
): AgentRunner {
	return async () => {
		throw new AgentRunnerNotConfiguredError();
	};
}
