import { buildScreenGenerationAgentInput, orchestrationBoundary } from "@cx/orchestration";
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
					areas: [{ name: "화면 상단 네비게이션", slotHint: "header", sourceAreaNo: 0 }],
					name: "상품 상세 핵심 요약 탐색",
					route: "/nova/prdd/pg/001/0",
					screenCode: "NOVA-PRDD-PG-001-0",
				},
				components: [
					{
						label: "AppBarHeader",
						sourceAreaNo: 0,
						sourceComponentId: "AppBar",
						variant: "WithBack",
					},
				],
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
});
