import type { PipelineRunEvent } from "@cx/pipeline";

export const SCREEN_INFERENCE_PIPELINE_EVENT_NAME = "pipeline-event";

export function parseScreenInferencePipelineEventLines(contents: string): PipelineRunEvent[] {
	const events: PipelineRunEvent[] = [];
	for (const line of contents.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const parsed = parsePipelineRunEvent(trimmed);
		if (parsed) events.push(parsed);
	}
	return events;
}

export function filterScreenInferencePipelineEventsAfter(
	events: PipelineRunEvent[],
	lastEventId?: string | null,
): PipelineRunEvent[] {
	if (!lastEventId) return events;
	const lastIndex = events.findIndex((event) => event.eventId === lastEventId);
	return lastIndex < 0 ? events : events.slice(lastIndex + 1);
}

export function formatScreenInferencePipelineEvent(event: PipelineRunEvent): string {
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
): PipelineRunEvent | undefined {
	return parsePipelineRunEvent(data);
}

function parsePipelineRunEvent(input: string): PipelineRunEvent | undefined {
	try {
		const value = JSON.parse(input) as unknown;
		if (!isPipelineRunEvent(value)) return undefined;
		return value;
	} catch {
		return undefined;
	}
}

function isPipelineRunEvent(value: unknown): value is PipelineRunEvent {
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
