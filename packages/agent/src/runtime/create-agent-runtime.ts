import type { AgentRunner, AgentRuntime } from "../contract";
import { AgentRunnerNotConfiguredError } from "../errors/agent-error";

export type CreateAgentRuntimeOptions = {
	runner?: AgentRunner;
};

export function createAgentRuntime(options: CreateAgentRuntimeOptions = {}): AgentRuntime {
	return {
		run: options.runner ?? defaultMissingRunner,
	};
}

async function defaultMissingRunner(): Promise<never> {
	throw new AgentRunnerNotConfiguredError();
}
