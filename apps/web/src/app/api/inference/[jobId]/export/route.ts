import { inferenceRuntime } from "@/server/inference-runtime";
import { buildExportResponse } from "@/server/tsx-export";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
	const { jobId } = await context.params;
	return buildExportResponse({
		artifactStore: inferenceRuntime.artifactStore,
		jobId,
		jobStore: inferenceRuntime.jobStore,
	});
}
