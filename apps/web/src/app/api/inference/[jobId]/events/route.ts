import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";

type RouteContext = {
	params: Promise<{ jobId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
	const { jobId } = await context.params;
	const url = new URL(request.url);
	const after = Number(url.searchParams.get("after") ?? request.headers.get("Last-Event-ID") ?? 0);
	const events = await inferenceRuntime.jobStore.listEvents(
		jobId,
		Number.isFinite(after) ? after : 0,
	);
	const body = events
		.map((event) => {
			return [
				`id: ${event.seq}`,
				`event: ${event.type}`,
				`data: ${JSON.stringify(event)}`,
				"",
			].join("\n");
		})
		.join("\n");
	return new Response(body, {
		headers: {
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"Content-Type": "text/event-stream; charset=utf-8",
		},
	});
}
