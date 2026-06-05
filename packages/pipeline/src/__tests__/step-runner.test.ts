import { definePipeline, defineStep, from, runStepPipeline, value } from "@cx/pipeline";
import type {
	PipelineFeedbackRule,
	PipelinePersistenceAdapter,
	PipelineRunEvent,
	PipelineRunStatus,
} from "@cx/pipeline/types";
import { describe, expect, it } from "vitest";

describe("runStepPipeline", () => {
	it("executes a small deterministic Step pipeline and persists status/events", async () => {
		const persistence = createMemoryPersistence();
		const events: PipelineRunEvent[] = [];
		const pipeline = definePipeline({
			artifacts: [
				{
					from: from("step.compose.message"),
					id: "final-message",
					kind: "text",
				},
				{
					from: { kind: "step-collection", stepIds: ["read-source", "compose"] },
					id: "trace",
					kind: "trace",
				},
			],
			id: "step-fixture",
			steps: [
				defineStep({
					execute: (inputs) => ({ text: `${inputs.source}` }),
					id: "read-source",
					inputs: { source: from("input.source") },
					usesAI: false,
				}),
				defineStep({
					execute: (inputs) => ({
						message: `${inputs.prefix}: ${inputs.text}`,
					}),
					id: "compose",
					inputs: {
						prefix: from("ref.copy.prefix"),
						schema: value({ schemaVersion: "message.v0.1" }),
						text: from("step.read-source.text"),
					},
					usesAI: false,
				}),
			],
		});

		const result = await runStepPipeline(pipeline, {
			createEventId: createEventIds(),
			input: { source: "hello" },
			now: createClock(),
			onEvent: (event) => {
				events.push(event);
			},
			persistence,
			refs: { copy: { prefix: "generated" } },
			runId: "step-run-001",
		});

		expect(result.artifacts).toEqual({
			"final-message": "generated: hello",
			trace: {
				"read-source": { text: "hello" },
				compose: { message: "generated: hello" },
			},
		});
		expect(result.status).toMatchObject({
			pipelineId: "step-fixture",
			runId: "step-run-001",
			status: "completed",
		});
		expect(result.status.stageOrder).toEqual(["read-source", "compose"]);
		expect(result.status.stages["read-source"]?.status).toBe("completed");
		expect(result.status.stages.compose?.status).toBe("completed");
		expect(result.events.map((event) => `${event.stage}:${event.status}`)).toEqual([
			"read-source:started",
			"read-source:completed",
			"compose:started",
			"compose:completed",
		]);
		expect(events).toHaveLength(4);
		expect(persistence.events).toHaveLength(4);
		expect(persistence.statuses.at(-1)?.status).toBe("completed");
	});

	it("executes AI steps through the provided agent adapter", async () => {
		const pipeline = definePipeline({
			id: "ai-step-fixture",
			steps: [
				defineStep({
					id: "agent-step",
					inputs: { topic: from("input.topic") },
					output: { schemaVersion: "agent-output.v0.1" },
					prompt: { id: "test-agent" },
					usesAI: true,
				}),
			],
		});

		const result = await runStepPipeline(pipeline, {
			agent: ({ inputs, step }) => ({
				promptId: (step.prompt as { id: string }).id,
				result: `draft ${inputs.topic}`,
			}),
			input: { topic: "screen" },
			now: createClock(),
			runId: "ai-step-run",
		});

		expect(result.state.steps["agent-step"]?.output).toEqual({
			promptId: "test-agent",
			result: "draft screen",
		});
	});

	it("skips steps before emitting started events when skipWhen matches", async () => {
		const persistence = createMemoryPersistence();
		const pipeline = definePipeline({
			id: "skip-fixture",
			steps: [
				defineStep({
					execute: () => ({ read: true }),
					id: "read-source",
					usesAI: false,
				}),
				defineStep({
					execute: () => ({ unreachable: true }),
					id: "compose",
					skipWhen: () => true,
					usesAI: false,
				}),
			],
		});

		const result = await runStepPipeline(pipeline, {
			createEventId: createEventIds(),
			now: createClock(),
			persistence,
			runId: "skip-run",
		});

		expect(result.events.map((event) => `${event.stage}:${event.status}`)).toEqual([
			"read-source:started",
			"read-source:completed",
		]);
		expect(result.status.stages.compose?.status).toBe("skipped");
		expect(result.state.steps.compose?.status).toBe("skipped");
		expect(persistence.events.map((event) => event.stage)).toEqual(["read-source", "read-source"]);
	});

	it("persists failed status for missing input references", async () => {
		const persistence = createMemoryPersistence();
		const pipeline = definePipeline({
			id: "missing-ref-fixture",
			steps: [
				defineStep({
					execute: () => ({ unreachable: true }),
					id: "compose",
					inputs: { missing: from("step.read-source.text") },
					usesAI: false,
				}),
			],
		});

		await expect(
			runStepPipeline(pipeline, {
				now: createClock(),
				persistence,
				runId: "missing-ref-run",
			}),
		).rejects.toThrow("Pipeline step input reference is missing: step.read-source.text");

		expect(persistence.events.map((event) => event.status)).toEqual(["started", "failed"]);
		expect(persistence.statuses.at(-1)).toMatchObject({
			currentStage: "compose",
			error: {
				code: "pipeline.step_input_ref_missing",
			},
			status: "failed",
		});
	});

	it("routes feedback steps with bounded retry counts", async () => {
		const calls: string[] = [];
		const pipeline = definePipeline({
			feedback: [createQualityRevisionFeedbackRule()],
			id: "feedback-fixture",
			steps: [
				defineStep({
					execute: () => {
						calls.push("generate");
						return { candidate: "draft" };
					},
					id: "generate",
					usesAI: false,
				}),
				defineStep({
					execute: () => {
						calls.push("review");
						return { decision: "revise" };
					},
					id: "review",
					usesAI: false,
				}),
				defineStep({
					execute: () => {
						calls.push("revise");
						return { candidate: "revised" };
					},
					id: "revise",
					skipWhen: (state) => (state.retryCounts["quality-revision"] ?? 0) === 0,
					usesAI: false,
				}),
				defineStep({
					execute: () => {
						calls.push("validate-after-revision");
						return { ok: true };
					},
					id: "validate-after-revision",
					skipWhen: (state) => (state.retryCounts["quality-revision"] ?? 0) === 0,
					usesAI: false,
				}),
				defineStep({
					execute: () => {
						calls.push("write");
						return { done: true };
					},
					id: "write",
					usesAI: false,
				}),
			],
		});

		const result = await runStepPipeline(pipeline, {
			now: createClock(),
			runId: "feedback-run",
		});

		expect(calls).toEqual(["generate", "review", "revise", "validate-after-revision", "write"]);
		expect(result.state.retryCounts["quality-revision"]).toBe(1);
		expect(result.state.steps.revise?.status).toBe("completed");
		expect(result.state.steps["validate-after-revision"]?.status).toBe("completed");
		expect(result.status.status).toBe("completed");
	});

	it("skips optional feedback steps when feedback condition does not match", async () => {
		const pipeline = definePipeline({
			feedback: [
				{
					fromStep: "review",
					goTo: "revise",
					id: "quality-revision",
					maxRetries: 1,
					when: () => false,
				},
			],
			id: "feedback-skip-fixture",
			steps: [
				defineStep({
					execute: () => ({ decision: "accept" }),
					id: "review",
					usesAI: false,
				}),
				defineStep({
					execute: () => ({ unreachable: true }),
					id: "revise",
					skipWhen: (state) => (state.retryCounts["quality-revision"] ?? 0) === 0,
					usesAI: false,
				}),
			],
		});

		const result = await runStepPipeline(pipeline, {
			now: createClock(),
			runId: "feedback-skip-run",
		});

		expect(result.state.retryCounts["quality-revision"]).toBeUndefined();
		expect(result.state.steps.revise?.status).toBe("skipped");
		expect(result.events.map((event) => `${event.stage}:${event.status}`)).toEqual([
			"review:started",
			"review:completed",
		]);
	});
});

function createQualityRevisionFeedbackRule(): PipelineFeedbackRule {
	const rule: PipelineFeedbackRule = {
		fromStep: "review",
		goTo: "revise",
		id: "quality-revision",
		maxRetries: 1,
		thenStep: "validate-after-revision",
		when: (output) => (output as { decision: string }).decision === "revise",
	};
	return rule;
}

function createMemoryPersistence(): PipelinePersistenceAdapter & {
	events: PipelineRunEvent[];
	statuses: PipelineRunStatus[];
} {
	const statuses: PipelineRunStatus[] = [];
	const events: PipelineRunEvent[] = [];

	return {
		events,
		async appendEvent(event) {
			events.push(event);
		},
		async readStatus(runId) {
			return statuses.find((status) => status.runId === runId);
		},
		statuses,
		async writeStatus(status) {
			statuses.push(status);
		},
	};
}

function createClock(): () => string {
	let tick = 0;
	return () => {
		tick += 1;
		return `2026-06-05T00:00:${String(tick).padStart(2, "0")}.000Z`;
	};
}

function createEventIds(): () => string {
	let id = 0;
	return () => {
		id += 1;
		return `event-${id}`;
	};
}
