import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SmokeRunExplorer } from "@/components/smoke/SmokeRunExplorer";
import type { SmokeRunSummary } from "@/lib/smoke-runs";

afterEach(cleanup);

describe("SmokeRunExplorer navigation", () => {
	it("shows the global navigation rail before the smoke run browser", () => {
		render(<SmokeRunExplorer runs={[]} />);

		expect(screen.getByRole("navigation", { name: "Workbench navigation" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "SCN" })).toHaveAttribute("href", "/");
		expect(screen.getByRole("link", { name: "SMK" })).toHaveAttribute("href", "/smoke");
		expect(screen.getByRole("link", { name: "SMK" })).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("heading", { level: 1, name: "Smoke Runs" })).toBeInTheDocument();
	});

	it("selects runs from separate left and right lists", () => {
		render(<SmokeRunExplorer runs={[createRun("run-a"), createRun("run-b")]} />);

		expect(screen.getAllByText("run-a ↔ run-b").length).toBeGreaterThan(0);

		const rightPane = screen.getByRole("region", { name: "Right runs" });
		fireEvent.click(within(rightPane).getByRole("button", { name: /run-a/ }));

		expect(screen.getAllByText("run-a ↔ run-a").length).toBeGreaterThan(0);
		expect(screen.getByRole("region", { name: "Left runs" })).toBeInTheDocument();
		expect(rightPane).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Dry" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Apply/ })).not.toBeInTheDocument();
		expect(screen.queryByText("ok")).not.toBeInTheDocument();
		expect(screen.queryByText("check")).not.toBeInTheDocument();
		expect(screen.getAllByText("Inference Layers").length).toBeGreaterThan(0);
		expect(screen.getAllByText("compose").length).toBeGreaterThan(0);
		expect(screen.getAllByText("detail-confirmation-screen").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Content first").length).toBeGreaterThan(0);
	});
});

function createRun(id: string): SmokeRunSummary {
	return {
		id,
		manifest: {
			agentMode: "fake",
			agentResult: "artifacts/agent-result.json",
			artifactRoot: "artifacts",
			compositionPlan: "artifacts/composition-plan.json",
			createdAt: "2026-06-01T00:00:00.000Z",
			finalResult: "artifacts/final-result.json",
			pipelineId: "screen-generation",
			pipelineResult: "artifacts/pipeline-result.json",
			qualityReview: "artifacts/quality-review.json",
			runId: id,
			schemaVersion: "smoke-run-manifest.v0.1",
			sourcePath: `data/client-imports/${id}.md`,
			stageLayers: [
				{
					artifacts: ["artifacts/source-spec.json", "artifacts/screen-intent.json"],
					layer: "understand",
					stages: ["read-source", "parse-source", "derive-screen-intent"],
					traceKeys: ["parseResult", "screenIntent"],
				},
				{
					artifacts: [
						"artifacts/composition-plan.json",
						"artifacts/decoration-plan.json",
						"artifacts/pattern-selection.json",
					],
					layer: "compose",
					stages: ["plan-composition", "derive-decoration-plan", "select-pattern"],
					traceKeys: ["composition", "patternSelection"],
				},
				{
					artifacts: ["artifacts/validation-report.json", "artifacts/final-result.json"],
					layer: "revise",
					stages: ["validate-render-tree", "write-artifacts"],
					traceKeys: ["initialValidationReport", "revision"],
				},
			],
			summary: {
				errorCount: 0,
				ok: true,
				validationOk: true,
				warningCount: 0,
			},
			tags: [],
			validationReport: "artifacts/validation-report.json",
		},
		compositionPlan: {
			density: "medium",
			primaryUserAction: "continue",
			visualHierarchy: "Content first",
		},
		quality: {
			genericLayoutCount: 0,
			missingLayoutCount: 0,
			nodeCount: 0,
			placeholderCount: 0,
			stateCoverageCount: 0,
		},
		runDir: `/tmp/${id}`,
		trace: {
			designSkillSelection: {
				selectedSkill: {
					id: "detail-confirmation-screen",
					qualityGates: ["visual-hierarchy", "action-clarity"],
					requiredDesignDocs: ["docs/design/COMPOSITION_LAYERS.md"],
				},
			},
		},
	};
}
