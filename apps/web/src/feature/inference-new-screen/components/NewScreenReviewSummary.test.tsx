import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ScreenInferenceRunStatus } from "@/lib/screen-inference-run";
import { NewScreenReviewSummary } from "./NewScreenReviewSummary";

afterEach(() => {
	cleanup();
});

describe("NewScreenReviewSummary TSX export", () => {
	it("renders an export download link with the inference jobId when the run is waiting review", () => {
		render(
			<NewScreenReviewSummary
				review={{ status: buildRunStatus({ runId: "job-1234", status: "waiting-review" }) }}
			/>,
		);

		const link = screen.getByRole("link", { name: "TSX Export" });
		expect(link).toHaveAttribute("href", "/api/inference/job-1234/export");
		expect(link).toHaveAttribute("download");
	});

	it("keeps the export link pointed at the jobId after the run is applied", () => {
		render(
			<NewScreenReviewSummary
				review={{ status: buildRunStatus({ runId: "job-applied-7", status: "applied" }) }}
			/>,
		);

		expect(screen.getByRole("link", { name: "TSX Export" })).toHaveAttribute(
			"href",
			"/api/inference/job-applied-7/export",
		);
	});

	it("encodes the jobId in the export URL", () => {
		render(
			<NewScreenReviewSummary
				review={{
					status: buildRunStatus({ runId: "job/needs encoding", status: "waiting-review" }),
				}}
			/>,
		);

		expect(screen.getByRole("link", { name: "TSX Export" })).toHaveAttribute(
			"href",
			"/api/inference/job%2Fneeds%20encoding/export",
		);
	});

	it("disables export while the run is still running", () => {
		render(
			<NewScreenReviewSummary
				review={{ status: buildRunStatus({ runId: "job-running-1", status: "running" }) }}
			/>,
		);

		expect(screen.queryByRole("link", { name: "TSX Export" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "TSX Export" })).toBeDisabled();
	});

	it("disables export when the run failed", () => {
		render(
			<NewScreenReviewSummary
				review={{ status: buildRunStatus({ runId: "job-failed-1", status: "failed" }) }}
			/>,
		);

		expect(screen.queryByRole("link", { name: "TSX Export" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "TSX Export" })).toBeDisabled();
	});

	it("disables export when no run status is available", () => {
		render(<NewScreenReviewSummary review={{}} />);

		expect(screen.queryByRole("link", { name: "TSX Export" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "TSX Export" })).toBeDisabled();
	});
});

function buildRunStatus(input: {
	runId: string;
	status: ScreenInferenceRunStatus["status"];
}): ScreenInferenceRunStatus {
	return {
		createdAt: "2026-06-10T00:00:00.000Z",
		layers: [],
		runId: input.runId,
		schemaVersion: "screen-inference-run-status.v0.1",
		status: input.status,
		updatedAt: "2026-06-10T00:00:00.000Z",
	};
}
