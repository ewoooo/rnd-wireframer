import type { sideEffectBoundary } from "./contract";

export type SideEffectBoundary = typeof sideEffectBoundary;
export type SideEffectBoundaryName = SideEffectBoundary["name"];
export type SideEffectPackageName = SideEffectBoundary["packageName"];

export type SideEffectOperation = SideEffectBoundary["owns"][number];
export type SideEffectCommandStatus = "failed" | "skipped" | "succeeded";
export type PipelineRunMode = "commit" | "dry-run";

export type PipelineId = "screen-generation";

export type PipelineStageId =
	| "derive-screen-intent"
	| "derive-decoration-plan"
	| "generate-render-tree"
	| "parse-source"
	| "plan-composition"
	| "propose-components"
	| "read-source"
	| "review-quality"
	| "revise-render-tree-if-invalid"
	| "select-pattern"
	| "validate-render-tree"
	| "validate-render-tree-after-revision"
	| "write-artifacts";

export type PipelineDefinition = {
	id: PipelineId | string;
	stages: PipelineStageId[];
};

export type PipelineAgentMode = "claude-local-first" | "fake";
export type ArtifactStorePreset = "data-run" | "local-transient" | "web-fixture";
export type PipelineProgressEvent = {
	pipelineId: PipelineId;
	runId: string;
	stage: PipelineStageId;
	status: "completed" | "started";
};

export type ScreenGenerationPipelineOptions = {
	agentMode?: PipelineAgentMode;
	artifactStore?: {
		preset?: ArtifactStorePreset;
		rootDir?: string;
		saveLocal?: boolean;
	};
	/** Evaluation 전용: design-context bundle 본문 주입을 끈다(A/B 비교). */
	disableDesignContext?: boolean;
	outDir?: string;
	onProgress?: (event: PipelineProgressEvent) => Promise<void> | void;
	runId?: string;
	source:
		| {
				kind?: PipelineMarkdownSourceFile["kind"];
				path: string;
				type: "file";
		  }
		| string;
	/** Batch 그룹 식별용 태그. manifest.tags로 기록된다. */
	tags?: string[];
	useAI?: boolean;
};

export type PipelineSummary = {
	agentPayload?: unknown;
	areaCount: number;
	componentCount: number;
	ok: boolean;
	outDir: string;
	screenCode?: string;
	session?: unknown;
	sourcePath: string;
	validationOk?: boolean;
};

export type PipelineRunResult = {
	outDir: string;
	pipelineResult: SideEffectExecutionResult;
	pipelineResultWrite: SideEffectExecutionResult;
	runId: string;
	sourcePath: string;
	summary: PipelineSummary;
	[key: string]: unknown;
};

export type SideEffectArtifactRef = {
	kind: "directory" | "file" | "store";
	uri: string;
	version?: string;
};

export type SideEffectIssue = {
	code: string;
	message: string;
	severity: "error" | "warning";
};

export type SideEffectCommandResult = {
	artifact?: SideEffectArtifactRef;
	issues: SideEffectIssue[];
	operation: SideEffectOperation;
	output?: unknown;
	status: SideEffectCommandStatus;
};

export type SideEffectCommandBase<Operation extends SideEffectOperation, Input> = {
	id: string;
	input: Input;
	operation: Operation;
};

export type WriteVersionedArtifactCommand = SideEffectCommandBase<
	"versioned-artifact-write",
	{
		artifact?: Omit<SideEffectArtifactRef, "kind" | "uri">;
		content: unknown;
		targetPath: string;
	}
>;

export type SourceArtifactReadCommand = SideEffectCommandBase<
	"source-artifact-read",
	{
		kind?: PipelineMarkdownSourceFile["kind"];
		path: string;
	}
>;

export type WriteRunLogCommand = SideEffectCommandBase<
	"run-log-write",
	{
		content: unknown;
		targetPath: string;
	}
>;

export type ApplyApprovedArtifactCommand = SideEffectCommandBase<
	"approved-catalog-apply",
	{
		fromPath: string;
		toPath: string;
	}
>;

export type SideEffectCommand =
	| ApplyApprovedArtifactCommand
	| SourceArtifactReadCommand
	| WriteRunLogCommand
	| WriteVersionedArtifactCommand;

export type SideEffectExecutionResult = {
	artifact?: SideEffectArtifactRef;
	commands?: SideEffectCommandResult[];
	issues: SideEffectIssue[];
	operation: SideEffectOperation;
	ok: boolean;
};

export type PipelineFileSystemAdapter = {
	copyFile(from: string, to: string): Promise<void>;
	ensureDir(path: string): Promise<void>;
	exists(path: string): Promise<boolean>;
	readText(path: string): Promise<string>;
	writeText(path: string, content: string): Promise<void>;
};

export type PipelineClockAdapter = {
	now(): string;
};

export type PipelineIdAdapter = {
	createId(prefix: string): string;
};

export type PipelineAdapters = {
	clock: PipelineClockAdapter;
	fs: PipelineFileSystemAdapter;
	id: PipelineIdAdapter;
};

export type SideEffectExecutorInput<Command extends SideEffectCommand = SideEffectCommand> = {
	adapters: PipelineAdapters;
	command: Command;
	mode: PipelineRunMode;
};

export type SideEffectExecutor<Command extends SideEffectCommand = SideEffectCommand> = (
	input: SideEffectExecutorInput<Command>,
) => Promise<SideEffectCommandResult>;

export type SideEffectExecutorRegistry = {
	[Command in SideEffectCommand as Command["operation"]]: SideEffectExecutor<Command>;
};

export type RunSideEffectsInput = {
	adapters: PipelineAdapters;
	commands: SideEffectCommand[];
	mode: PipelineRunMode;
	runId: string;
	stopOnFailure?: boolean;
};

export type PipelineMarkdownSourceFile = {
	areaCode?: string;
	content: string;
	id?: string;
	kind?: "area" | "component" | "screen" | "unknown";
	path: string;
	screenCode?: string;
	title?: string;
};
