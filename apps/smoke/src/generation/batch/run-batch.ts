import path from "node:path";
import { runGenerationSmoke } from "../run-generation-smoke";
import type { GenerationSmokeOptions } from "../types";
import { resolveBatchTargets } from "./resolve-targets";

export type BatchScreenResult = {
	screen: string;
	runId: string;
	runDir: string;
	ok: boolean;
	validationOk: boolean;
	errorCount: number;
	warningCount: number;
	error?: string;
};

export type BatchResult = {
	batchId: string;
	results: BatchScreenResult[];
	okCount: number;
	failCount: number;
};

export type RunGenerationBatchOptions = {
	artifactRoot?: string;
	artifactStore?: GenerationSmokeOptions["artifactStore"];
	batchId?: string;
	disableDesignContext?: boolean;
	executionMode?: GenerationSmokeOptions["executionMode"];
	glob?: string;
	targetDir: string;
	useAI?: boolean;
};

type ValidationSummaryShape = {
	summary?: { errorCount?: number; warningCount?: number };
};

function createDefaultBatchId(): string {
	return `batch-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

/**
 * Run every markdown screen under `targetDir` (optionally glob-filtered) through
 * the single-screen pipeline. Each screen gets its own run folder tagged with the
 * batch id. Failures are recorded and do not stop the batch (continue-on-error).
 */
export async function runGenerationBatch(options: RunGenerationBatchOptions): Promise<BatchResult> {
	const batchId = options.batchId ?? createDefaultBatchId();
	const targets = await resolveBatchTargets(options.targetDir, options.glob);

	const shared: GenerationSmokeOptions = {
		artifactRoot: options.artifactRoot,
		artifactStore: options.artifactStore,
		disableDesignContext: options.disableDesignContext,
		executionMode: options.executionMode,
		tags: [batchId],
		useAI: options.useAI,
	};

	const results: BatchScreenResult[] = [];
	for (const target of targets) {
		const screen = path.basename(target, ".md");
		const runId = `${batchId}-${screen}`;
		try {
			const result = await runGenerationSmoke(target, { ...shared, runId });
			const validation = result.validationReport as ValidationSummaryShape | undefined;
			const outDir = result.summary.outDir;
			results.push({
				errorCount: validation?.summary?.errorCount ?? 0,
				ok: result.summary.ok && (result.summary.validationOk ?? true),
				runDir: outDir ? path.dirname(outDir) : "",
				runId,
				screen,
				validationOk: result.summary.validationOk ?? false,
				warningCount: validation?.summary?.warningCount ?? 0,
			});
		} catch (error) {
			results.push({
				error: error instanceof Error ? error.message : String(error),
				errorCount: 0,
				ok: false,
				runDir: "",
				runId,
				screen,
				validationOk: false,
				warningCount: 0,
			});
		}
	}

	const okCount = results.filter((entry) => entry.ok).length;
	return {
		batchId,
		failCount: results.length - okCount,
		okCount,
		results,
	};
}
