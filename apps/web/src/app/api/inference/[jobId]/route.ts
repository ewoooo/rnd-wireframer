import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
	const { jobId } = await context.params;
	try {
		return Response.json(await inferenceRuntime.jobStore.getJob(jobId));
	} catch {
		return Response.json({ error: "job not found" }, { status: 404 });
	}
}
