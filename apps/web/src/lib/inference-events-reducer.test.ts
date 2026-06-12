import type { InferenceEvent } from "@cx/inference/contracts";
import { describe, expect, it } from "vitest";
import { initialInferenceStreamState, reduceInferenceEvent } from "./inference-events-reducer";

const ev = (seq: number, type: InferenceEvent["type"]): InferenceEvent => ({
	seq,
	jobId: "j",
	type,
	timestamp: "t",
});

describe("reduceInferenceEvent", () => {
	it("accumulates and tracks terminal status", () => {
		let s = reduceInferenceEvent(initialInferenceStreamState, ev(1, "job_started"));
		s = reduceInferenceEvent(s, ev(2, "job_completed"));
		expect(s.events).toHaveLength(2);
		expect(s.status).toBe("succeeded");
	});
	it("ignores duplicate/out-of-order seq", () => {
		const s = reduceInferenceEvent(initialInferenceStreamState, ev(2, "job_started"));
		expect(reduceInferenceEvent(s, ev(2, "step_started"))).toBe(s);
		expect(reduceInferenceEvent(s, ev(1, "step_started"))).toBe(s);
	});
});
