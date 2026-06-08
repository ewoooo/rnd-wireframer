import { describe, expect, it } from "vitest";
import {
	createFailedScreenInferenceStatus,
	createScreenInferenceProgressStatus,
} from "./screen-inference-run";

describe("screen inference run status", () => {
	it("maps compose pipeline stages to the compose badge and message", () => {
		const status = createScreenInferenceProgressStatus({
			now: "2026-06-04T12:00:00.000Z",
			runId: "web-run",
			stage: "derive-decoration-plan",
		});

		expect(status.currentLayer).toBe("compose");
		expect(status.currentMessage).toBe("Decorating sections…");
		expect(status.layers.map((layer) => [layer.layer, layer.status])).toEqual([
			["understand", "completed"],
			["compose", "running"],
			["revise", "pending"],
		]);
	});

	it("maps revise pipeline stages to the revise badge and message", () => {
		const status = createScreenInferenceProgressStatus({
			now: "2026-06-04T12:00:00.000Z",
			runId: "web-run",
			stage: "review-quality",
		});

		expect(status.currentLayer).toBe("revise");
		expect(status.currentMessage).toBe("Reviewing quality…");
		expect(status.layers.map((layer) => [layer.layer, layer.status])).toEqual([
			["understand", "completed"],
			["compose", "completed"],
			["revise", "running"],
		]);
	});

	it("keeps post-validation component proposal progress in the revise layer", () => {
		const status = createScreenInferenceProgressStatus({
			now: "2026-06-04T12:00:00.000Z",
			runId: "web-run",
			stage: "propose-components",
		});

		expect(status.currentLayer).toBe("revise");
		expect(status.currentMessage).toBe("Checking component proposals…");
		expect(status.layers.map((layer) => [layer.layer, layer.status])).toEqual([
			["understand", "completed"],
			["compose", "completed"],
			["revise", "running"],
		]);
	});

	it("preserves the failing layer when a later pipeline stage errors", () => {
		const status = createFailedScreenInferenceStatus({
			error: {
				code: "screen_inference_run_failed",
				message: "Review quality failed.",
			},
			now: "2026-06-04T12:00:00.000Z",
			runId: "web-run",
			stage: "review-quality",
		});

		expect(status.currentLayer).toBe("revise");
		expect(status.currentMessage).toBe("Reviewing quality…");
		expect(status.currentStage).toBe("review-quality");
		expect(status.layers.map((layer) => [layer.layer, layer.status])).toEqual([
			["understand", "completed"],
			["compose", "completed"],
			["revise", "failed"],
		]);
		expect(status.layers.find((layer) => layer.layer === "revise")?.summary).toMatchObject({
			description: "Review quality failed.",
			title: "Inference failed",
		});
	});
});
