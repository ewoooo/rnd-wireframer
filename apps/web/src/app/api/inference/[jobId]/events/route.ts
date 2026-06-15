import { isInferenceTerminalEventType } from "@cx/inference";
import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
	params: Promise<{ jobId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
	const { jobId } = await context.params;
	const url = new URL(request.url);
	const startAfter = Number(
		request.headers.get("Last-Event-ID") ?? url.searchParams.get("after") ?? 0,
	);
	const encoder = new TextEncoder();

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			let after = Number.isFinite(startAfter) ? startAfter : 0;
			let closed = false;
			const abort = () => {
				closed = true;
			};
			request.signal.addEventListener("abort", abort, { once: true });

			try {
				controller.enqueue(encoder.encode(": connected\n\n"));
				while (!closed) {
					const events = await inferenceRuntime.jobStore.listEvents(jobId, after);
					for (const event of events) {
						after = event.seq;
						// Every event MUST end with a blank line, or EventSource never dispatches it.
						controller.enqueue(
							encoder.encode(
								`id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
							),
						);
					}
					// Terminal 뒤에 background step 이벤트가 같은 배치로 따라올 수 있으므로
					// 배치 전체에서 terminal을 찾는다 — 마지막 이벤트만 보면 스트림이
					// 영원히 닫히지 않는다.
					if (events.some((event) => isInferenceTerminalEventType(event.type))) break;
					if (events.length === 0) controller.enqueue(encoder.encode(": keep-alive\n\n"));
					await new Promise((resolve) => setTimeout(resolve, 200));
				}
			} finally {
				request.signal.removeEventListener("abort", abort);
				if (!closed) controller.close();
			}
		},
		cancel() {
			// client disconnected — abort handler already flips `closed`
		},
	});

	return new Response(stream, {
		headers: {
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"Content-Type": "text/event-stream; charset=utf-8",
			"X-Accel-Buffering": "no",
		},
	});
}
