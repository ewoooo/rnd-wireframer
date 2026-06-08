import type { ComponentCatalog } from "@cx/components/types";
import type { DesignContextBundleContent, DesignContextBundleRef } from "@cx/schema";
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
	| "select-pattern"
	| "validate-render-tree"
	| "write-artifacts";

export type StepInputRef =
	| RefStepInputRef
	| ReferencesStepInputRef
	| StepOutputStepInputRef
	| ValueStepInputRef;

export type RefStepInputRef = {
	kind: "ref";
	ref: string;
};

/**
 * Declares the named references a step's node needs. The engine resolves each
 * name to pure data (via `resolveReference`, memoized per run) and injects them
 * as a `{ [name]: resolved }` record — replacing imperative adapter calls in
 * step bodies.
 */
export type ReferencesStepInputRef = {
	kind: "refs";
	names: string[];
};

/** Resolves a declared reference name to pure data, given the run's ref adapters. */
export type ReferenceResolver = (
	name: string,
	refs: Record<string, unknown>,
) => Promise<unknown> | unknown;

export type StepOutputStepInputRef = {
	kind: "step-output";
	outputName: string;
	stepId: string;
};

export type ValueStepInputRef = {
	kind: "value";
	value: unknown;
};

export type OutputContract = {
	artifactKind?: string;
	jsonSchema?: unknown;
	schemaVersion?: string;
};

export type PipelineStepOutputDefinition = {
	result: OutputContract;
	[outputName: string]: OutputContract;
};

export type StepRunContext = {
	pipelineId: string;
	runId: string;
};

export type StepExecutor = (
	inputs: ResolvedStepInputs,
	context: StepRunContext,
) => Promise<unknown> | unknown;

export type PipelineStep = AiPipelineStep | ExecutablePipelineStep;

export type BasePipelineStep = {
	id: string;
	inputs?: Record<string, StepInputRef>;
};

export type AiPipelineStep = BasePipelineStep & {
	output: PipelineStepOutputDefinition;
	prompt: unknown;
	usesAI: true;
};

export type ExecutablePipelineStep = BasePipelineStep & {
	execute: StepExecutor;
	output?: PipelineStepOutputDefinition;
	usesAI: false;
};

export type StepCollectionRef = {
	kind: "step-collection";
	stepIds: string[];
};

export type ArtifactCondition = (state: PipelineExecutionState) => boolean | Promise<boolean>;

export type PipelineArtifactRule = {
	from: StepInputRef | StepCollectionRef;
	id: string;
	kind: string;
	when?: ArtifactCondition;
};

export type StepPipelineDefinition = {
	artifacts?: PipelineArtifactRule[];
	id: string;
	steps: PipelineStep[];
};

/** Compatibility alias. Pipeline definitions are Step definitions; use StepPipelineDefinition. */
export type PipelineDefinition = StepPipelineDefinition;

export type PipelineExecutionStepState = {
	completedAt?: string;
	error?: {
		code: string;
		message: string;
	};
	/** Normalized step outputs. The primary output lives under `result`. */
	outputs?: Record<string, unknown>;
	startedAt?: string;
	status: PipelineStageRunStatus;
};

export type PipelineExecutionState = {
	input: Record<string, unknown>;
	refs: Record<string, unknown>;
	steps: Record<string, PipelineExecutionStepState>;
};

export type ResolvedStepInputs = Record<string, unknown>;

export type StepAgentAdapterInput = {
	context: StepRunContext;
	inputs: ResolvedStepInputs;
	step: AiPipelineStep;
};

export type StepAgentAdapter = (input: StepAgentAdapterInput) => Promise<unknown> | unknown;

export type RunStepPipelineOptions = {
	agent?: StepAgentAdapter;
	createEventId?: () => string;
	input?: Record<string, unknown>;
	now?: () => string;
	onEvent?: (event: PipelineRunEvent) => Promise<void> | void;
	persistence?: PipelinePersistenceAdapter;
	refs?: Record<string, unknown>;
	/** Resolves `refs([...])` step inputs to pure data; memoized per run. */
	resolveReference?: ReferenceResolver;
	runId: string;
	status?: {
		outDir?: string;
		runDir?: string;
		sourcePath?: string;
	};
};

export type StepPipelineRunResult = {
	artifacts: Record<string, unknown>;
	events: PipelineRunEvent[];
	runId: string;
	state: PipelineExecutionState;
	status: PipelineRunStatus;
};

export type PipelineAgentMode = "claude-local-first" | "fake";
export type ArtifactStorePreset = "data-run" | "local-transient" | "web-fixture";
export type PipelineProgressEvent = {
	pipelineId: PipelineId | string;
	runId: string;
	stage: PipelineStageId | string;
	status: "completed" | "failed" | "started";
	timestamp?: string;
};

export type PipelineStageRunStatus = "completed" | "failed" | "pending" | "running" | "skipped";

export type PipelineRunLifecycleStatus = "completed" | "failed" | "queued" | "running";

export type PipelineRunStatus = {
	completedAt?: string;
	createdAt: string;
	currentStage?: string;
	error?: {
		code: string;
		message: string;
	};
	outDir?: string;
	pipelineId: PipelineId | string;
	runDir?: string;
	runId: string;
	schemaVersion: "pipeline-run-status.v0.1";
	sourcePath?: string;
	stageOrder: string[];
	stages: Record<
		string,
		{
			completedAt?: string;
			startedAt?: string;
			status: PipelineStageRunStatus;
		}
	>;
	status: PipelineRunLifecycleStatus;
	updatedAt: string;
};

export type PipelineRunEvent = {
	eventId: string;
	pipelineId: PipelineId | string;
	runId: string;
	stage?: string;
	status: "completed" | "failed" | "started";
	timestamp: string;
	type: "pipeline" | "stage";
};

export type PipelinePersistenceAdapter = {
	appendEvent(event: PipelineRunEvent): Promise<void>;
	readStatus(runId: string): Promise<PipelineRunStatus | undefined>;
	writeStatus(status: PipelineRunStatus): Promise<void>;
};

export type ScreenGenerationComponentCatalogEntryRef = {
	type: string;
	props?: Record<
		string,
		{
			required?: boolean;
			role?: string;
			type: string;
			values?: readonly string[];
		}
	>;
};

export type ScreenGenerationComponentCatalogRefs = {
	/**
	 * Fixed adapter key. Resolves one component type into the prop contract used
	 * when building agent context, e.g. "AppBar" -> allowed props/roles.
	 */
	getEntry(type: string): ScreenGenerationComponentCatalogEntryRef | undefined;
	/**
	 * Fixed adapter key. Marks catalog entries as stable/candidate so agent
	 * context and review can distinguish promoted components from experimental ones.
	 */
	getStatus(type: string): "candidate" | "stable" | undefined;
	/**
	 * Fixed adapter key. Lists the component vocabulary available beyond the
	 * source-mapped components, so generation can choose better-fitting catalog entries.
	 */
	getTypes(): string[];
	/**
	 * Fixed adapter key. Full catalog value passed to RenderTree validation.
	 * The lookup functions above shape agent context; this value checks final output.
	 */
	validationCatalog?: ComponentCatalog;
};

export type ScreenGenerationLayoutCatalogRefs = {
	resolveComponentLayout(input: {
		componentType?: string;
		sourceComponentId: string;
		sourceId?: string;
	}): string | undefined;
	resolveRegionLayout(input: {
		compositionText: string;
		fallbackByType: Record<"Screen.Bottom" | "Screen.Contents" | "Screen.Header", string>;
		screenLayout: string;
		type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header";
	}): string;
};

export type ScreenGenerationSkillBundleRef = {
	body: string;
	description?: string;
	dir: string;
	id: string;
	inputContract?: string;
	outputContract?: string;
	sideFiles: Array<{
		content: string;
		path: string;
	}>;
	stage: "pattern-selection" | "quality-inspection" | "render-tree-generation";
};

export type ScreenGenerationReferences = {
	componentCatalogs: ScreenGenerationComponentCatalogRefs;
	designContextBundles: {
		loadContents(refs: DesignContextBundleRef[]): Promise<DesignContextBundleContent[]>;
	};
	layoutCatalogs: ScreenGenerationLayoutCatalogRefs;
	skillBundles: {
		loadCatalog(): Promise<ScreenGenerationSkillBundleRef[]>;
	};
};

export type ScreenGenerationReferencesInput = {
	componentCatalogs?: Partial<ScreenGenerationComponentCatalogRefs>;
	designContextBundles?: Partial<ScreenGenerationReferences["designContextBundles"]>;
	layoutCatalogs?: Partial<ScreenGenerationLayoutCatalogRefs>;
	skillBundles?: Partial<ScreenGenerationReferences["skillBundles"]>;
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
	persistence?: {
		adapter?: PipelinePersistenceAdapter;
		enabled?: boolean;
		eventsFileName?: string;
		statusFileName?: string;
	};
	references?: ScreenGenerationReferencesInput;
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

/**
 * Pipeline run result. The authoritative field list is produced by
 * `createScreenGenerationPipelineResult`; keep this type in sync with it.
 * Per-stage agent payloads stay `unknown` to keep the public surface decoupled
 * from agent/inference types — consumers narrow at the read site.
 */
export type PipelineRunResult = {
	// Always present.
	outDir: string;
	pipelineResult: SideEffectExecutionResult;
	pipelineResultWrite: SideEffectExecutionResult;
	runId: string;
	sourcePath: string;
	summary: PipelineSummary;
	// Render-tree generation (legacy unprefixed names) + final render target.
	agentInput?: unknown;
	agentResult?: unknown;
	finalResult?: unknown;
	runnerRequest?: unknown;
	// Per-stage agent triples.
	compositionPlanAgentInput?: unknown;
	compositionPlanAgentResult?: unknown;
	compositionPlanRunnerRequest?: unknown;
	patternSelectionAgentInput?: unknown;
	patternSelectionAgentResult?: unknown;
	patternSelectionRunnerRequest?: unknown;
	qualityReviewAgentInput?: unknown;
	qualityReviewAgentResult?: unknown;
	qualityReviewRunnerRequest?: unknown;
	screenIntentAgentInput?: unknown;
	screenIntentAgentResult?: unknown;
	screenIntentRunnerRequest?: unknown;
	// Deterministic scaffolding + reports.
	decorationPlan?: unknown;
	designContextBundleSelection?: unknown;
	designSkillSelection?: unknown;
	generationSkillCatalog?: unknown;
	initialValidationReport?: unknown;
	parseCommandResult?: unknown;
	patternLayerCandidates?: unknown;
	renderTreeGenerationSkill?: unknown;
	sourceSpec?: unknown;
	validationReport?: unknown;
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
	appendText?(path: string, content: string): Promise<void>;
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
