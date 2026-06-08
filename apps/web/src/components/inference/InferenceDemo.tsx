"use client";

import { useInference } from "@/model/inference/use-inference";
import { useInferenceStream } from "@/model/inference/use-inference-stream";

export function InferenceDemo() {
	const { jobId, creating, error, run } = useInference();
	const stream = useInferenceStream(jobId);

	return (
		<main style={{ padding: 24, fontFamily: "ui-monospace, monospace", lineHeight: 1.6 }}>
			<h1>Inference Demo</h1>
			<button type="button" disabled={creating} onClick={() => void run({ screenCode: "DEMO" })}>
				{creating ? "Running…" : "Run demo"}
			</button>
			{error ? <p style={{ color: "crimson" }}>{error}</p> : null}
			{jobId ? (
				<p>
					job <code>{jobId}</code> — status: <strong>{stream.status}</strong>
				</p>
			) : null}
			<ol>
				{stream.events.map((event) => (
					<li key={event.seq}>
						#{event.seq} {event.type}
						{event.stepId ? ` (${event.stepId})` : ""}
					</li>
				))}
			</ol>
		</main>
	);
}
