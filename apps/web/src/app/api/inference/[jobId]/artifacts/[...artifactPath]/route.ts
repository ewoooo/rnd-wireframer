import { readArtifact } from "@/lib/inference-read";
import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";

export async function GET(
	_request: Request,
	context: { params: Promise<{ jobId: string; artifactPath: string[] }> },
) {
	const { jobId, artifactPath } = await context.params;
	const artifactRelPath = artifactPath.join("/");
	try {
		const text = await readArtifact(inferenceRuntime, jobId, artifactRelPath);
		const contentType = artifactRelPath.endsWith(".ndjson") ? "application/x-ndjson" : "application/json";
		return new Response(text, { headers: { "Content-Type": contentType } });
	} catch {
		return Response.json({ error: "artifact not found or not allowed" }, { status: 404 });
	}
}
