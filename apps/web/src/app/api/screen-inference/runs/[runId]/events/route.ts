import { NextResponse } from "next/server";
import { readErrorMessage } from "@/lib/api-error";
import {
	filterScreenInferencePipelineEventsAfter,
	formatScreenInferencePipelineEvent,
} from "@/lib/screen-inference-events";
import {
	readScreenInferenceRun,
	readScreenInferenceRunPipelineEvents,
} from "@/lib/screen-inference-run-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_INTERVAL_MS = 750;
const TERMINAL_SCREEN_INFERENCE_STATUSES = new Set(["failed", "waiting-review", "applied"]);

type ScreenInferenceRunEventsRouteContext = {
	params: Promise<{
		runId: string;
	}>;
};

export async function GET(request: Request, context: ScreenInferenceRunEventsRouteContext) {
	try {
		const { runId } = await context.params;
		const run = await readScreenInferenceRun(runId);
		if (!run) {
			return NextResponse.json({ error: "Run not found." }, { status: 404 });
		}

		const stream = createScreenInferenceRunEventStream({
			lastEventId: request.headers.get("last-event-id"),
			runId,
			signal: request.signal,
		});

		return new Response(stream, {
			headers: {
				"Cache-Control": "no-cache, no-transform",
				Connection: "keep-alive",
				"Content-Type": "text/event-stream; charset=utf-8",
				"X-Accel-Buffering": "no",
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to stream screen inference run events.") },
			{ status: 500 },
		);
	}
}

function createScreenInferenceRunEventStream(input: {
	lastEventId?: string | null;
	runId: string;
	signal: AbortSignal;
}) {
	const encoder = new TextEncoder();
	let isClosed = false;
	let lastSentEventId = input.lastEventId ?? undefined;

	return new ReadableStream<Uint8Array>({
		async start(controller) {
			const abort = () => {
				isClosed = true;
				controller.close();
			};
			input.signal.addEventListener("abort", abort, { once: true });

			try {
				controller.enqueue(encoder.encode(": connected\n\n"));
				while (!isClosed) {
					const events = filterScreenInferencePipelineEventsAfter(
						await readScreenInferenceRunPipelineEvents(input.runId),
						lastSentEventId,
					);

					for (const event of events) {
						controller.enqueue(encoder.encode(formatScreenInferencePipelineEvent(event)));
						lastSentEventId = event.eventId;
					}

					const run = await readScreenInferenceRun(input.runId);
					if (run && TERMINAL_SCREEN_INFERENCE_STATUSES.has(run.status.status)) break;
					if (events.length === 0) controller.enqueue(encoder.encode(": keep-alive\n\n"));
					await wait(POLL_INTERVAL_MS);
				}
			} finally {
				input.signal.removeEventListener("abort", abort);
				if (!isClosed) controller.close();
			}
		},
		cancel() {
			isClosed = true;
		},
	});
}

function wait(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
