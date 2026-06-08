import { type RenderTreeScreenNodeContract, SCHEMA_VERSION } from "@cx/schema";
import { NextResponse } from "next/server";
import { readErrorMessage } from "@/lib/api-error";
import { applyScreenInferenceFinalResult } from "@/lib/screen-inference-apply";
import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";

type InferenceApplyRouteContext = {
	params: Promise<{
		jobId: string;
	}>;
};

export async function POST(_request: Request, context: InferenceApplyRouteContext) {
	try {
		const { jobId } = await context.params;
		const finalResult = await inferenceRuntime.artifactStore.readJson<RenderTreeScreenNodeContract>(
			jobId,
			"steps/04-render-tree/output.json",
		);
		const result = await applyScreenInferenceFinalResult({ node: finalResult });
		const body = {
			appliedArtifacts: result.written
				? [
						{
							kind: "render-db",
							uri: `supabase:render_screens/${result.screenId}`,
						},
					]
				: undefined,
			ok: result.written,
			result,
			schemaVersion: SCHEMA_VERSION.applyResult,
		};

		await inferenceRuntime.artifactStore.writeJson(jobId, "context/apply-result.json", body);

		return NextResponse.json(body, { status: result.written ? 200 : 422 });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to apply inference result.") },
			{ status: readErrorStatus(error) },
		);
	}
}

function readErrorStatus(error: unknown): number {
	if (isNodeError(error) && error.code === "ENOENT") return 404;
	return 500;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}
