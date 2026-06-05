import type { AgentRunRequest, AgentRunResult } from "./runtime-contract";
import type { AgentPromptArtifact } from "./task-catalog";

export type AgentRunnerRequest = AgentRunRequest & {
	prompt: AgentPromptArtifact;
};

export type AgentRunner = (request: AgentRunnerRequest) => Promise<AgentRunResult>;
