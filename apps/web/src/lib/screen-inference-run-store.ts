import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PipelineRunEvent } from "@cx/pipeline";
import { getScreenGenerationStageOrder, runPipeline } from "@cx/pipeline";
import type { PipelineStageId } from "@cx/pipeline/types";
import { readErrorMessage } from "@/lib/api-error";
import { parseScreenInferencePipelineEventLines } from "@/lib/screen-inference-events";
import {
	createFailedScreenInferenceStatus,
	createScreenInferenceProgressStatus,
	createScreenInferenceRunId,
	createScreenInferenceStatus,
	createWaitingReviewStatus,
	type ScreenInferenceRunManifest,
	type ScreenInferenceRunStatus,
} from "@/lib/screen-inference-run";
import { CLIENT_IMPORT_ROOT, RUN_ROOT } from "@/lib/server-paths";

const SCREEN_GENERATION_STAGES = new Set<string>(getScreenGenerationStageOrder());

export type ScreenInferenceRunCreateInput = {
	previousRunId?: string;
	runId?: string;
	screenId?: string;
	sourcePath: string;
	tags?: string[];
	useAI?: boolean;
};

export async function createScreenInferenceRun(input: ScreenInferenceRunCreateInput) {
	const sourcePath = resolveClientImportPath(input.sourcePath);
	const screenId = input.screenId ?? path.basename(sourcePath).replace(/\.md$/i, "");
	const runId = input.runId ?? createScreenInferenceRunId(screenId);
	const createdAt = new Date().toISOString();
	const status = createScreenInferenceStatus({ now: createdAt, runId, status: "queued" });

	await writeRunStatus(status);

	void runScreenInferencePipeline({
		createdAt,
		previousRunId: input.previousRunId,
		runId,
		sourcePath: path.relative(process.cwd(), sourcePath),
		tags: input.tags,
		useAI: input.useAI,
	});

	return {
		runId,
		status,
		statusUrl: `/api/screen-inference/runs/${encodeURIComponent(runId)}`,
	};
}

export async function readScreenInferenceRun(runId: string) {
	const [status, manifest] = await Promise.all([
		readRunStatus(runId),
		readOptionalJson<ScreenInferenceRunManifest>(path.join(readRunDir(runId), "manifest.json")),
	]);

	if (status) {
		return {
			manifest,
			status,
		};
	}

	if (manifest) {
		return {
			manifest,
			status: createWaitingReviewStatus({ manifest, runId }),
		};
	}

	return undefined;
}

export async function updateScreenInferenceRunStatus(
	runId: string,
	status: ScreenInferenceRunStatus["status"],
) {
	const current = await readRunStatus(runId);
	if (!current) throw new Error("Run not found.");
	await writeRunStatus({
		...(status === "applied"
			? createWaitingReviewStatus({
					createdAt: current.createdAt,
					now: new Date().toISOString(),
					runId,
				})
			: current),
		currentLayer: undefined,
		runId,
		status,
		updatedAt: new Date().toISOString(),
	});
}

export async function readScreenInferenceRunPipelineEvents(
	runId: string,
): Promise<PipelineRunEvent[]> {
	const contents = await readOptionalText(path.join(readRunDir(runId), "pipeline-events.ndjson"));
	return contents ? parseScreenInferencePipelineEventLines(contents) : [];
}

async function runScreenInferencePipeline(input: {
	createdAt: string;
	previousRunId?: string;
	runId: string;
	sourcePath: string;
	tags?: string[];
	useAI?: boolean;
}) {
	await writeRunStatus(
		createScreenInferenceStatus({
			now: new Date().toISOString(),
			runId: input.runId,
			status: "running",
		}),
	);

	try {
		const useAI = input.useAI ?? true;
		await runPipeline("screen-generation", {
			agentMode: useAI ? "claude-local-first" : "fake",
			runId: input.runId,
			source: {
				path: input.sourcePath,
				type: "file",
			},
			tags: [
				"web-new-screen",
				...(input.previousRunId ? [`previous:${input.previousRunId}`] : []),
				...(input.tags ?? []),
			],
			onProgress: async (event) => {
				if (event.status !== "started") return;
				if (!isScreenGenerationStage(event.stage)) return;
				await writeRunStatus(
					createScreenInferenceProgressStatus({
						createdAt: input.createdAt,
						now: new Date().toISOString(),
						runId: input.runId,
						stage: event.stage,
					}),
				);
			},
			useAI,
		});

		const manifest = await readOptionalJson<ScreenInferenceRunManifest>(
			path.join(readRunDir(input.runId), "manifest.json"),
		);
		await writeRunStatus(
			createWaitingReviewStatus({
				createdAt: input.createdAt,
				manifest,
				now: new Date().toISOString(),
				runId: input.runId,
			}),
		);
	} catch (error) {
		const currentStatus = await readRunStatus(input.runId);
		await writeRunStatus(
			createFailedScreenInferenceStatus({
				createdAt: currentStatus?.createdAt ?? input.createdAt,
				error: {
					code: "screen_inference_run_failed",
					message: readErrorMessage(error, "Screen inference run failed."),
				},
				now: new Date().toISOString(),
				runId: input.runId,
				stage: currentStatus?.currentStage,
			}),
		);
	}
}

async function readRunStatus(runId: string): Promise<ScreenInferenceRunStatus | undefined> {
	return readOptionalJson<ScreenInferenceRunStatus>(path.join(readRunDir(runId), "status.json"));
}

async function writeRunStatus(status: ScreenInferenceRunStatus) {
	const runDir = readRunDir(status.runId);
	await mkdir(runDir, { recursive: true });
	await writeFile(path.join(runDir, "status.json"), `${JSON.stringify(status, null, 2)}\n`, "utf8");
}

async function readOptionalJson<T>(filePath: string): Promise<T | undefined> {
	try {
		return JSON.parse(await readFile(filePath, "utf8")) as T;
	} catch (error) {
		if (isNodeError(error) && error.code === "ENOENT") return undefined;
		throw error;
	}
}

async function readOptionalText(filePath: string): Promise<string | undefined> {
	try {
		return await readFile(filePath, "utf8");
	} catch (error) {
		if (isNodeError(error) && error.code === "ENOENT") return undefined;
		throw error;
	}
}

function resolveClientImportPath(sourcePath: string): string {
	const absolutePath = path.resolve(process.cwd(), sourcePath);
	const relativePath = path.relative(CLIENT_IMPORT_ROOT, absolutePath);

	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		throw new Error("source.path must be under data/client-imports/.");
	}
	if (!/\.md$/i.test(absolutePath)) {
		throw new Error("source.path must point to a Markdown file.");
	}

	return absolutePath;
}

function readRunDir(runId: string): string {
	const safeRunId = runId.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 120);
	if (!safeRunId) throw new Error("runId is required.");
	return path.join(RUN_ROOT, safeRunId);
}

function isScreenGenerationStage(stage: string): stage is PipelineStageId {
	return SCREEN_GENERATION_STAGES.has(stage);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}
