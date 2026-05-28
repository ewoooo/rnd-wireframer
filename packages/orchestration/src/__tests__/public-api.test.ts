import {
	buildPatternSelectionAgentInput,
	buildScreenGenerationAgentInput,
	buildScreenRevisionAgentInput,
	orchestrationBoundary,
} from "@cx/orchestration";
import type { OrchestrationDecision, OrchestrationOperation } from "@cx/orchestration/types";
import { SCHEMA_VERSION, type SourceSpec } from "@cx/schema";
import { describe, expect, it } from "vitest";

describe("@cx/orchestration public API", () => {
	it("exposes the pure orchestration package boundary", () => {
		expect(orchestrationBoundary.packageName).toBe("@cx/orchestration");
		expect(orchestrationBoundary.owns).toContain("stage-input-build");
		expect(orchestrationBoundary.owns).toContain("next-action-decision");
		expect(orchestrationBoundary.rejects).toContain("file-system-write");
		expect(orchestrationBoundary.rejects).toContain("validation-rule-judgement");
	});

	it("types orchestration decisions against public stage and action contracts", () => {
		const operation: OrchestrationOperation = "workflow-state-transition";
		const decision: OrchestrationDecision = {
			action: "request-review",
			issues: [],
			stage: "generation",
		};

		expect(operation).toBe("workflow-state-transition");
		expect(decision.action).toBe("request-review");
	});

	it("builds screen generation agent input from SourceSpec", () => {
		const sourceSpec: SourceSpec = {
			schemaVersion: SCHEMA_VERSION.sourceSpec,
			sourceImport: {
				files: [],
				importId: "sample",
				receivedAt: "2026-05-27T00:00:00.000Z",
				sourceKind: "prdd-markdown-bundle",
			},
			sourceShape: {
				screen: {
					name: "상품 상세 핵심 요약 탐색",
					regions: [
						{
							slot: "header",
							children: [
								{
									kind: "area",
									sourceAreaId: "0",
									children: [
										{
											kind: "component",
											label: "AppBarHeader",
											sourceComponentId: "AppBar",
											variant: "WithBack",
										},
									],
								},
							],
						},
					],
					route: "/nova/prdd/pg/001/0",
					screenCode: "NOVA-PRDD-PG-001-0",
				},
			},
		};

		const input = buildScreenGenerationAgentInput(sourceSpec);

		expect(input.query).toContain("Generate a RenderTree candidate");
		expect(input.query).toContain("render-tree.v0.1");
		expect(input.query).toContain("NOVA-PRDD-PG-001-0");
		expect(input.context.sourceSummary).toEqual({
			areaCount: 1,
			componentCount: 1,
			route: "/nova/prdd/pg/001/0",
			screenCode: "NOVA-PRDD-PG-001-0",
			screenName: "상품 상세 핵심 요약 탐색",
		});
		expect(input.context.sourceSpec).toBe(sourceSpec);
	});

	it("builds pattern selection agent input from layer candidates", () => {
		const sourceSpec: SourceSpec = {
			schemaVersion: SCHEMA_VERSION.sourceSpec,
			sourceImport: {
				files: [],
				importId: "sample",
				receivedAt: "2026-05-27T00:00:00.000Z",
				sourceKind: "prdd-markdown-bundle",
			},
			sourceShape: {
				screen: {
					name: "상품 상세 핵심 요약 탐색",
					regions: [],
					route: "/nova/prdd/pg/001/0",
					screenCode: "NOVA-PRDD-PG-001-0",
				},
			},
		};
		const layerCandidates = [
			{
				id: "layer.screen.composition",
				level: "screen" as const,
				pattern: {
					id: "commerce-detail-screen",
					target: "screen" as const,
					variant: "default",
				},
				reason: "screen regions exist",
				targetRef: "NOVA-PRDD-PG-001-0",
				title: "Screen composition layer",
			},
		];

		const input = buildPatternSelectionAgentInput({ layerCandidates, sourceSpec });

		expect(input.query).toContain("Select the pattern layer strategy");
		expect(input.context.layerCandidates).toBe(layerCandidates);
		expect(input.context.sourceSummary.screenCode).toBe("NOVA-PRDD-PG-001-0");
	});

	it("builds screen revision agent input from a validation report", () => {
		const sourceSpec: SourceSpec = {
			schemaVersion: SCHEMA_VERSION.sourceSpec,
			sourceImport: {
				files: [],
				importId: "sample",
				receivedAt: "2026-05-27T00:00:00.000Z",
				sourceKind: "prdd-markdown-bundle",
			},
			sourceShape: {
				screen: {
					name: "상품 상세 핵심 요약 탐색",
					regions: [],
					route: "/nova/prdd/pg/001/0",
					screenCode: "NOVA-PRDD-PG-001-0",
				},
			},
		};
		const previousCandidate = { version: "render-tree.v0.1" };
		const layerCandidates = [
			{
				id: "layer.screen.composition",
				level: "screen" as const,
				pattern: {
					id: "commerce-detail-screen",
					target: "screen" as const,
					variant: "default",
				},
				reason: "screen regions exist",
				targetRef: "NOVA-PRDD-PG-001-0",
				title: "Screen composition layer",
			},
		];
		const patternSelection = {
			selectedCandidates: [{ id: "layer.screen.composition" }],
		};
		const validationReport = {
			ok: false,
			issues: [{ code: "required-field-missing", message: "layout missing" }],
		};

		const input = buildScreenRevisionAgentInput({
			layerCandidates,
			patternSelection,
			previousCandidate,
			sourceSpec,
			validationReport,
		});

		expect(input.query).toContain("Revise the previous RenderTree candidate");
		expect(input.query).toContain("Top-level children must contain a Screen root node");
		expect(input.query).toContain(
			'Use props.position values only from "fixed", "sticky", or "static"',
		);
		expect(input.context.layerCandidates).toBe(layerCandidates);
		expect(input.context.patternSelection).toBe(patternSelection);
		expect(input.context.previousCandidate).toBe(previousCandidate);
		expect(input.context.validationReport).toBe(validationReport);
		expect(input.previousResult).toBe(previousCandidate);
	});
});
