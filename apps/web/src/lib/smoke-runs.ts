import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { RenderTree } from "@cx/renderer";
import { createQualityScorecard, type QualityScorecard } from "./quality-scorecard";

export type SmokeRunManifest = {
	agentMode: string;
	agentResult: string;
	artifactRoot: string;
	componentProposal?: string;
	compositionPlan?: string;
	createdAt: string;
	decorationPlan?: string;
	finalResult: string;
	patternSelection?: string;
	pipelineId: "screen-generation";
	pipelineResult: string;
	qualityReview: string;
	runId: string;
	schemaVersion: "smoke-run-manifest.v0.1";
	screenIntent?: string;
	sourcePath: string;
	sourceSpec?: string;
	stageLayers?: SmokeRunManifestLayerGroup[];
	stageOrder?: string[];
	summary: {
		errorCount: number;
		ok: boolean;
		validationOk?: boolean;
		warningCount: number;
	};
	tags: string[];
	trace?: string;
	validationReport: string;
};

export type SmokeRunManifestLayer = "compose" | "revise" | "understand";

export type SmokeRunManifestLayerGroup = {
	artifacts: string[];
	layer: SmokeRunManifestLayer;
	stages: string[];
	traceKeys: string[];
};

export type SmokeCompositionPlan = {
	density?: string;
	patternRationale?: string;
	primaryUserAction?: string;
	rejectedPatterns?: Array<{ pattern?: string; reason?: string }>;
	sectionRhythm?: string;
	visualHierarchy?: string;
};

export type SmokeRunTrace = {
	layers?: Record<string, { artifacts?: string[]; traceKeys?: string[] }>;
};

export type SmokeValidationReport = {
	issues?: Array<{ code: string; message: string; severity: string }>;
	ok?: boolean;
	summary?: { errorCount?: number; warningCount?: number };
	target?: string;
};

export type SmokeRunSummary = {
	compositionPlan?: SmokeCompositionPlan;
	finalResult?: RenderTree;
	id: string;
	manifest: SmokeRunManifest;
	quality: QualityScorecard;
	runDir: string;
	trace?: SmokeRunTrace;
	validationReport?: SmokeValidationReport;
};

const DEFAULT_RUNS_DIR = path.join(
	/* turbopackIgnore: true */ process.cwd(),
	"data/runs/screen-generation",
);

export async function listSmokeRunSummaries(
	runsDir = DEFAULT_RUNS_DIR,
): Promise<SmokeRunSummary[]> {
	const runIds = await readRunIds(runsDir);
	const runs = await Promise.all(
		runIds.map(async (runId) => readSmokeRunSummary(path.join(runsDir, runId))),
	);

	return runs
		.filter((run): run is SmokeRunSummary => Boolean(run))
		.sort((left, right) => right.manifest.createdAt.localeCompare(left.manifest.createdAt));
}

async function readRunIds(runsDir: string): Promise<string[]> {
	try {
		const entries = await readdir(runsDir, { withFileTypes: true });
		return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
	} catch {
		return [];
	}
}

async function readSmokeRunSummary(runDir: string): Promise<SmokeRunSummary | undefined> {
	try {
		const manifest = await readJson<SmokeRunManifest>(path.join(runDir, "manifest.json"));
		const finalResult = await readOptionalJson<RenderTree>(
			path.resolve(runDir, manifest.finalResult),
		);
		const validationReport = await readOptionalJson<SmokeValidationReport>(
			path.resolve(runDir, manifest.validationReport),
		);
		const compositionPlan = manifest.compositionPlan
			? await readOptionalJson<SmokeCompositionPlan>(path.resolve(runDir, manifest.compositionPlan))
			: undefined;
		const trace = manifest.trace
			? await readOptionalJson<SmokeRunTrace>(path.resolve(runDir, manifest.trace))
			: undefined;

		return {
			compositionPlan,
			finalResult,
			id: manifest.runId,
			manifest,
			quality: createQualityScorecard(finalResult),
			runDir,
			trace,
			validationReport,
		};
	} catch {
		return undefined;
	}
}

async function readJson<T>(filePath: string): Promise<T> {
	return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function readOptionalJson<T>(filePath: string): Promise<T | undefined> {
	try {
		return await readJson<T>(filePath);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
		throw error;
	}
}
