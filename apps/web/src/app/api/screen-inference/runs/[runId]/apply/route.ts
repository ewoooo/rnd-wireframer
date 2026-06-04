import { readFile } from "node:fs/promises";
import path from "node:path";
import { type RenderTreeScreenNodeContract, SCHEMA_VERSION } from "@cx/schema";
import { NextResponse } from "next/server";
import { applyScreenInferenceFinalResult } from "@/lib/screen-inference-apply";
import { updateScreenInferenceRunStatus } from "@/lib/screen-inference-run-store";

export const runtime = "nodejs";

const RUN_ROOT = path.join(process.cwd(), "data/runs/screen-generation");

type ScreenInferenceApplyRouteContext = {
	params: Promise<{
		runId: string;
	}>;
};

export async function POST(_request: Request, context: ScreenInferenceApplyRouteContext) {
	try {
		const { runId } = await context.params;
		await updateScreenInferenceRunStatus(runId, "applying");

		const finalResult = JSON.parse(
			await readFile(path.join(readRunDir(runId), "artifacts/final-result.json"), "utf8"),
		) as RenderTreeScreenNodeContract;
		const result = await applyScreenInferenceFinalResult({ node: finalResult });

		if (!result.written) {
			return NextResponse.json(
				{
					ok: false,
					result,
					schemaVersion: SCHEMA_VERSION.applyResult,
				},
				{ status: 422 },
			);
		}

		await updateScreenInferenceRunStatus(runId, "applied");

		return NextResponse.json({
			appliedArtifacts: [
				{
					kind: "render-db",
					uri: `supabase:render_screens/${result.screenId}`,
				},
			],
			ok: true,
			result,
			schemaVersion: SCHEMA_VERSION.applyResult,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error) },
			{ status: readErrorStatus(error) },
		);
	}
}

function readRunDir(runId: string): string {
	const safeRunId = runId.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 120);
	if (!safeRunId) throw new Error("runId is required.");
	return path.join(RUN_ROOT, safeRunId);
}

function readErrorStatus(error: unknown): number {
	if (isNodeError(error) && error.code === "ENOENT") return 404;
	return 500;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Failed to apply screen inference run.";
}
