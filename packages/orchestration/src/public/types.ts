import type { AgentTaskInput } from "@cx/agent/contract";
import type { SourceSpec } from "@cx/parser/types";
import type { orchestrationBoundary } from "./contract";

export type OrchestrationBoundary = typeof orchestrationBoundary;
export type OrchestrationBoundaryName = OrchestrationBoundary["name"];
export type OrchestrationPackageName = OrchestrationBoundary["packageName"];

export type OrchestrationOperation = OrchestrationBoundary["owns"][number];

export type OrchestrationStageKind =
	| "source-ingest"
	| "generation"
	| "quality-review"
	| "preview"
	| "apply";

export type OrchestrationNextAction =
	| "request-generation"
	| "request-review"
	| "request-preview"
	| "request-apply"
	| "request-retry"
	| "stop";

export type OrchestrationIssue = {
	code: string;
	message: string;
	severity: "error" | "warning";
};

export type OrchestrationDecision = {
	action: OrchestrationNextAction;
	issues: OrchestrationIssue[];
	stage: OrchestrationStageKind;
};

export type ScreenGenerationAgentContext = {
	sourceSpec: SourceSpec;
	sourceSummary: {
		areaCount: number;
		componentCount: number;
		route: string;
		screenCode: string;
		screenName: string;
	};
};

export type ScreenGenerationAgentInput = AgentTaskInput & {
	context: ScreenGenerationAgentContext;
};
