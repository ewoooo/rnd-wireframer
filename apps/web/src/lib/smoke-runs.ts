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

export type SmokeValidationReport = {
	issues?: Array<{ code: string; message: string; severity: string }>;
	ok?: boolean;
	summary?: { errorCount?: number; warningCount?: number };
	target?: string;
};

export type SmokeRunSummary = {
	finalResult?: RenderTree;
	id: string;
	manifest: SmokeRunManifest;
	quality: QualityScorecard;
	runDir: string;
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

		return {
			finalResult,
			id: manifest.runId,
			manifest,
			quality: createQualityScorecard(finalResult),
			runDir,
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
