import { type AgentRunner, createAgentRuntime } from "@cx/agent";
import { createContextStore } from "../context/context-store";
import type { InferenceRuntime, KnowledgeBase, PipelineRegistry } from "../contracts";
import { createClaudeEngine } from "../engine/claude-engine";
import { createFunctionEngine, type InferenceFunction } from "../engine/function-engine";
import { createInferenceKnowledgeBase } from "../knowledge/knowledge-base";
import { createPipelineRegistry } from "../pipeline/registry";
import { FileArtifactStore } from "../stores/file-artifact-store";
import { createJobStore } from "../stores/job-store";

let counter = 0;

export function createInferenceRuntime(config: {
	pipelines?: PipelineRegistry;
	dataRoot?: string;
	functions?: Record<string, InferenceFunction>;
	knowledgeBase?: KnowledgeBase;
	claudeRunner?: AgentRunner;
	now?: () => string;
	newId?: () => string;
}): InferenceRuntime {
	const artifactStore = new FileArtifactStore(config.dataRoot ?? ".data");
	const now = config.now ?? (() => new Date().toISOString());
	const newId =
		config.newId ?? (() => `job-${Date.now().toString(36)}-${(counter++).toString(36)}`);
	const jobStore = createJobStore(artifactStore, { now, newId });
	const agentRuntime = createAgentRuntime({ runner: config.claudeRunner });

	return {
		artifactStore,
		createContextStore: (jobId) => createContextStore(jobId, artifactStore),
		engines: {
			function: createFunctionEngine(config.functions ?? {}),
			claude: createClaudeEngine(agentRuntime),
		},
		jobStore,
		knowledgeBase: config.knowledgeBase ?? createInferenceKnowledgeBase(),
		pipelines: config.pipelines ?? createPipelineRegistry(),
		now,
		newId,
	};
}
