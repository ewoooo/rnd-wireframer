import type { sideEffectBoundary } from "./contract";

export type SideEffectBoundary = typeof sideEffectBoundary;
export type SideEffectBoundaryName = SideEffectBoundary["name"];
export type SideEffectPackageName = SideEffectBoundary["packageName"];

export type SideEffectOperation = SideEffectBoundary["owns"][number];
export type SideEffectCommandStatus = "failed" | "skipped" | "succeeded";
export type PipelineRunMode = "commit" | "dry-run";

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
