import { isRecord } from "@cx/schema";
import type { PipelineStageId } from "@/lib/screen-inference-run";

export const SCREEN_INFERENCE_PIPELINE_EVENT_NAME = "pipeline-event";

export type ScreenInferencePipelineEvent = {
	eventId: string;
	pipelineId: "screen-generation";
	runId: string;
	stage?: PipelineStageId;
	status: "completed" | "failed" | "started";
	timestamp: string;
	type: string;
};

export function parseScreenInferencePipelineEventLines(
	contents: string,
): ScreenInferencePipelineEvent[] {
	const events: ScreenInferencePipelineEvent[] = [];
	for (const line of contents.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const parsed = parsePipelineRunEvent(trimmed);
		if (parsed) events.push(parsed);
	}
	return events;
}

export function filterScreenInferencePipelineEventsAfter(
	events: ScreenInferencePipelineEvent[],
	lastEventId?: string | null,
): ScreenInferencePipelineEvent[] {
	if (!lastEventId) return events;
	const lastIndex = events.findIndex((event) => event.eventId === lastEventId);
	return lastIndex < 0 ? events : events.slice(lastIndex + 1);
}

export function formatScreenInferencePipelineEvent(event: ScreenInferencePipelineEvent): string {
	return [
		`id: ${event.eventId}`,
		`event: ${SCREEN_INFERENCE_PIPELINE_EVENT_NAME}`,
		`data: ${JSON.stringify(event)}`,
		"",
		"",
	].join("\n");
}

export function parseScreenInferencePipelineEventMessage(
	data: string,
): ScreenInferencePipelineEvent | undefined {
	return parsePipelineRunEvent(data);
}

function parsePipelineRunEvent(input: string): ScreenInferencePipelineEvent | undefined {
	try {
		const value = JSON.parse(input) as unknown;
		if (!isPipelineRunEvent(value)) return undefined;
		return value;
	} catch {
		return undefined;
	}
}

function isPipelineRunEvent(value: unknown): value is ScreenInferencePipelineEvent {
	if (!isRecord(value)) return false;
	return (
		typeof value.eventId === "string" &&
		typeof value.pipelineId === "string" &&
		typeof value.runId === "string" &&
		typeof value.status === "string" &&
		typeof value.timestamp === "string" &&
		typeof value.type === "string"
	);
}
