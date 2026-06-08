import { describe, expect, it } from "vitest";
import {
	filterScreenInferencePipelineEventsAfter,
	formatScreenInferencePipelineEvent,
	parseScreenInferencePipelineEventLines,
	parseScreenInferencePipelineEventMessage,
	SCREEN_INFERENCE_PIPELINE_EVENT_NAME,
	type ScreenInferencePipelineEvent,
} from "@/lib/screen-inference-events";
import type { PipelineStageId } from "@/lib/screen-inference-run";

describe("screen inference pipeline events", () => {
	it("parses persisted pipeline event lines and ignores incomplete lines", () => {
		const first = pipelineEvent("event-1", "read-source", "started");
		const second = pipelineEvent("event-2", "read-source", "completed");
		const contents = `${JSON.stringify(first)}\nnot-json\n${JSON.stringify(second)}\n`;

		expect(parseScreenInferencePipelineEventLines(contents)).toEqual([first, second]);
	});

	it("filters events after the last SSE event id", () => {
		const first = pipelineEvent("event-1", "read-source", "started");
		const second = pipelineEvent("event-2", "read-source", "completed");
		const third = pipelineEvent("event-3", "parse-source", "started");

		expect(filterScreenInferencePipelineEventsAfter([first, second, third], "event-2")).toEqual([
			third,
		]);
		expect(filterScreenInferencePipelineEventsAfter([first, second, third], "missing")).toEqual([
			first,
			second,
			third,
		]);
	});

	it("formats and parses SSE pipeline event payloads", () => {
		const event = pipelineEvent("event-1", "read-source", "started");
		const message = formatScreenInferencePipelineEvent(event);

		expect(message).toContain(`event: ${SCREEN_INFERENCE_PIPELINE_EVENT_NAME}`);
		expect(message).toContain("id: event-1");
		expect(parseScreenInferencePipelineEventMessage(JSON.stringify(event))).toEqual(event);
	});
});

function pipelineEvent(
	eventId: string,
	stage: PipelineStageId,
	status: ScreenInferencePipelineEvent["status"],
): ScreenInferencePipelineEvent {
	return {
		eventId,
		pipelineId: "screen-generation",
		runId: "run-1",
		stage,
		status,
		timestamp: "2026-06-05T00:00:00.000Z",
		type: "stage",
	};
}
