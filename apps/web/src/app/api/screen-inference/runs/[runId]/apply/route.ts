import { type RenderTreeScreenNodeContract, SCHEMA_VERSION } from "@cx/schema";
import { NextResponse } from "next/server";
import { readErrorMessage } from "@/lib/api-error";
import { applyScreenInferenceFinalResult } from "@/lib/screen-inference-apply";
import { updateScreenInferenceRunStatus } from "@/lib/screen-inference-run-store";
import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";

type ScreenInferenceApplyRouteContext = {
	params: Promise<{
		runId: string;
	}>;
};

export async function POST(_request: Request, context: ScreenInferenceApplyRouteContext) {
	try {
		const { runId } = await context.params;
		await updateScreenInferenceRunStatus(runId, "applying");

		const finalResult = await inferenceRuntime.artifactStore.readJson<RenderTreeScreenNodeContract>(
			runId,
			"steps/04-render-tree/output.json",
		);
		const result = await applyScreenInferenceFinalResult({ node: finalResult });

		if (!result.written) {
			await updateScreenInferenceRunStatus(runId, "waiting-review");
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
		const runId = await readRunIdSafe(context);
		if (runId) await updateRunStatusSafe(runId, "failed");
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to apply screen inference run.") },
			{ status: readErrorStatus(error) },
		);
	}
}

async function readRunIdSafe(
	context: ScreenInferenceApplyRouteContext,
): Promise<string | undefined> {
	try {
		return (await context.params).runId;
	} catch {
		return undefined;
	}
}

async function updateRunStatusSafe(
	runId: string,
	status: Parameters<typeof updateScreenInferenceRunStatus>[1],
) {
	try {
		await updateScreenInferenceRunStatus(runId, status);
	} catch {
		// Preserve the original response error when status persistence also fails.
	}
}

function readErrorStatus(error: unknown): number {
	if (isNodeError(error) && error.code === "ENOENT") return 404;
	return 500;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}
