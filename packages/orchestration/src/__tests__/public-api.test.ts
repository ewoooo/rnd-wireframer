import {
	buildComponentProposalAgentInput,
	buildCompositionPlanAgentInput,
	buildDecorationPlan,
	buildDesignContextBundleRefs,
	buildGenerationNextAction,
	buildPatternLayerCandidates,
	buildPatternSelectionAgentInput,
	buildQualityReviewAgentInput,
	buildScreenGenerationAgentInput,
	buildScreenIntentAgentInput,
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

	it("embeds design-context bundle bodies into generation context", () => {
		const sourceSpec: SourceSpec = {
			schemaVersion: SCHEMA_VERSION.sourceSpec,
			sourceImport: {
				files: [],
				importId: "sample",
				receivedAt: "2026-05-27T00:00:00.000Z",
				sourceKind: "prdd-markdown-bundle",
			},
			sourceShape: {
				screen: { name: "샘플", regions: [], route: "/sample", screenCode: "SAMPLE" },
			},
		};

		const input = buildScreenGenerationAgentInput(sourceSpec, {
			designContextBundles: [
				{
					id: "visual-foundation",
					reason: "r",
					sourceDocs: [],
					version: "v",
					body: "DIVIDER RULE LINE",
				},
			],
		});

		expect(JSON.stringify(input.context)).toContain("DIVIDER RULE LINE");
		expect(input.query).toContain("context.designContextBundles");
	});

	it("instructs design scoring using injected bundles in quality review", () => {
		const sourceSpec: SourceSpec = {
			schemaVersion: SCHEMA_VERSION.sourceSpec,
			sourceImport: {
				files: [],
				importId: "sample",
				receivedAt: "2026-05-27T00:00:00.000Z",
				sourceKind: "prdd-markdown-bundle",
			},
			sourceShape: {
				screen: { name: "샘플", regions: [], route: "/sample", screenCode: "SAMPLE" },
			},
		};

		const input = buildQualityReviewAgentInput({
			candidate: {},
			sourceSpec,
			designContextBundles: [
				{ id: "quality-review", reason: "r", sourceDocs: [], version: "v", body: "GATE LINE" },
			],
		});

		expect(input.query.toLowerCase()).toContain("score");
		expect(input.query).toContain("hierarchy");
		expect(input.query).toContain("separation");
		expect(input.query).toContain("fidelity");
		expect(JSON.stringify(input.context)).toContain("GATE LINE");
	});

	it("builds bounded component-proposal input", () => {
		const sourceSpec: SourceSpec = {
			schemaVersion: SCHEMA_VERSION.sourceSpec,
			sourceImport: {
				files: [],
				importId: "sample",
				receivedAt: "2026-05-27T00:00:00.000Z",
				sourceKind: "prdd-markdown-bundle",
			},
			sourceShape: {
				screen: { name: "샘플", regions: [], route: "/sample", screenCode: "SAMPLE" },
			},
		};

		const input = buildComponentProposalAgentInput({
			sourceSpec,
			candidate: { foo: "bar" },
		});

		expect(input.query).toContain("Propose");
		expect(input.query).toContain("nearestCatalogMatch");
		expect(input.query).toContain("component-proposal.v0.1");
		expect(input.context.sourceSpec).toBe(sourceSpec);
		expect(input.context.candidate).toEqual({ foo: "bar" });
	});

	it("instructs contextual divider, spacing, and hierarchy decisions", () => {
		const sourceSpec: SourceSpec = {
			schemaVersion: SCHEMA_VERSION.sourceSpec,
			sourceImport: {
				files: [],
				importId: "sample",
				receivedAt: "2026-05-27T00:00:00.000Z",
				sourceKind: "prdd-markdown-bundle",
			},
			sourceShape: {
				screen: { name: "샘플", regions: [], route: "/sample", screenCode: "SAMPLE" },
			},
		};

		const query = buildScreenGenerationAgentInput(sourceSpec).query;

		expect(query.toLowerCase()).toContain("divider");
		expect(query).toContain("1px");
		expect(query).toContain("4px");
		expect(query.toLowerCase()).toContain("hierarchy");
	});

	it("builds screen intent and composition plan agent inputs before generation", () => {
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
		const screenIntent = { schemaVersion: SCHEMA_VERSION.screenIntent };

		const intentInput = buildScreenIntentAgentInput(sourceSpec);
		const compositionInput = buildCompositionPlanAgentInput({
			screenIntent,
			sourceSpec,
		});

		expect(intentInput.query).toContain("Derive the screen intent");
		expect(intentInput.context.targetArtifact.kind).toBe("screen-intent");
		expect(compositionInput.query).toContain("Create a composition plan");
		expect(compositionInput.query).toContain("visualHierarchy");
		expect(compositionInput.query).toContain("rejectedPatterns");
		expect(compositionInput.query).toContain("COMPOSITION_LAYERS");
		expect(compositionInput.context.screenIntent).toBe(screenIntent);
		expect(compositionInput.context.targetArtifact.kind).toBe("composition-plan");
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
				layout: "layout.screen.commerceDetailScreen",
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

	it("builds a decoration plan that splits terms list and agreement controls", () => {
		const sourceSpec = createTermsSourceSpec();

		const decorationPlan = buildDecorationPlan({ sourceSpec });

		expect(decorationPlan.schemaVersion).toBe(SCHEMA_VERSION.decorationPlan);
		expect(decorationPlan.displayRules.hideInternalSourceNames).toBe(true);
		expect(decorationPlan.areas.map((area) => area.displayTitle)).toContain("약관 목록 조회");
		expect(decorationPlan.areas.map((area) => area.displayTitle)).toContain("약관 동의");
		expect(decorationPlan.areas.find((area) => area.role === "content-list")).toMatchObject({
			componentRefs: ["ListTextTerms"],
			layoutIntent: { areaPatternRole: "list-stack" },
			splitFrom: "1",
		});
		expect(
			decorationPlan.areas.find((area) => area.role === "content-list")?.repeatedItems,
		).toEqual([
			expect.objectContaining({
				label: "[필수] 서비스 이용약관",
				propsHint: expect.objectContaining({ subText: "[필수] 서비스 이용약관" }),
				required: true,
			}),
			expect.objectContaining({
				label: "[선택] 마케팅 정보 수신 동의",
				required: false,
			}),
		]);
		expect(decorationPlan.diagnostics).toEqual([]);
	});

	it("builds pattern layer candidates as a pure orchestration helper", () => {
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
							children: [
								{
									children: [
										{
											kind: "component",
											label: "AppBarHeader",
											sourceComponentId: "AppBar",
										},
									],
									kind: "area",
									sourceAreaId: "0",
								},
							],
							slot: "header",
						},
						{
							children: [
								{
									children: [
										{
											componentType: "ListText",
											kind: "component",
											label: "ListTextTerms",
											props: { title: "{약관명} (예: 서비스 이용약관)" },
											sourceComponentId: "ListText",
											sourceId: "ListTextTerms",
										},
										{
											componentType: "Checkbox",
											kind: "component",
											label: "CheckboxTermsRequired",
											props: { label: "[필수] {약관명} (예: 서비스 이용약관)" },
											sourceComponentId: "Checkbox",
											sourceId: "CheckboxTermsRequired",
										},
									],
									kind: "area",
									sourceAreaId: "1",
									sourceAreaName: "TermsSection",
								},
							],
							slot: "contents",
						},
						{
							children: [
								{
									children: [
										{
											componentType: "ActionButton",
											kind: "component",
											label: "ActionButtonNext",
											sourceComponentId: "ActionButton",
											sourceId: "ActionButtonNext",
										},
									],
									kind: "area",
									sourceAreaId: "999",
									sourceAreaName: "ActionButtonSection",
								},
							],
							slot: "bottom",
						},
					],
					route: "/nova/prdd/pg/001/0",
					screenCode: "NOVA-PRDD-PG-001-0",
				},
			},
		};

		const candidates = buildPatternLayerCandidates({
			decorationPlan: buildDecorationPlan({ sourceSpec }),
			resolver: {
				resolveComponentLayout: () => "layout.composite.componentAppBar",
				resolveRegionLayout: ({ fallbackByType, type }) => fallbackByType[type],
			},
			sourceSpec,
		});

		expect(
			candidates
				.filter((candidate) => candidate.level === "region")
				.map((candidate) => candidate.layout),
		).toEqual(["layout.region.header", "layout.region.contents", "layout.region.bottom"]);
		expect(
			candidates.find((candidate) => candidate.id === "layer.area.decor.area.1.content-list")
				?.layout,
		).toBe("layout.area.listStack");
		expect(
			candidates.find((candidate) => candidate.id === "layer.area.decor.area.1.agreement-controls")
				?.layout,
		).toBe("layout.area.checkboxStack");
		expect(
			candidates.find((candidate) => candidate.id === "layer.area.decor.area.999.0")?.layout,
		).toBe("layout.area.bottomActionArea");
		expect(
			candidates.find((candidate) => candidate.id === "layer.component.0.AppBar")?.layout,
		).toBe("layout.composite.componentAppBar");
	});

	it("builds quality review agent input from the generated candidate", () => {
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
		const candidate = { renderTree: { version: SCHEMA_VERSION.renderTree } };
		const validationReport = { ok: true, issues: [] };

		const input = buildQualityReviewAgentInput({
			candidate,
			sourceSpec,
			validationReport,
		});

		expect(input.query).toContain("Review the generated screen candidate");
		expect(input.query).toContain(SCHEMA_VERSION.qualityInspection);
		expect(input.context.candidate).toBe(candidate);
		expect(input.context.validationReport).toBe(validationReport);
	});

	it("selects design-context bundle refs without reading bundle files", () => {
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
					name: "검색 결과 목록",
					regions: [],
					route: "/search",
					screenCode: "SEARCH-001",
				},
			},
		};

		const selection = buildDesignContextBundleRefs({
			screenIntent: { primaryTask: "검색 결과 list를 확인한다" },
			sourceSpec,
			validationReport: {
				summary: { errorCount: 0, warningCount: 1 },
			},
		});

		expect(selection.bundleRefs.map((bundleRef) => bundleRef.id)).toEqual([
			"layout-composition",
			"visual-foundation",
			"interaction-state",
			"quality-review",
		]);
		expect(selection.bundleRefs[0]).toMatchObject({
			version: "2026-05-29",
		});
	});

	it("decides generation next actions from validation and quality results", () => {
		expect(
			buildGenerationNextAction({
				retryCount: 0,
				validationReport: {
					summary: { errorCount: 1, warningCount: 0 },
				},
			}),
		).toMatchObject({ action: "request-revision", target: "contract" });

		expect(
			buildGenerationNextAction({
				qualityInspection: {
					summary: { errorCount: 1, warningCount: 0 },
				},
				retryCount: 0,
				validationReport: {
					summary: { errorCount: 0, warningCount: 0 },
				},
			}),
		).toMatchObject({ action: "request-revision", target: "quality" });

		expect(
			buildGenerationNextAction({
				retryCount: 0,
				validationReport: {
					summary: { errorCount: 0, warningCount: 1 },
				},
			}),
		).toMatchObject({ action: "request-human-review" });
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
				layout: "layout.screen.commerceDetailScreen",
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
		const qualityInspection = {
			findings: [{ code: "anti-slop", message: "placeholder", severity: "error" }],
		};

		const input = buildScreenRevisionAgentInput({
			layerCandidates,
			patternSelection,
			previousCandidate,
			qualityInspection,
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
		expect(input.context.qualityInspection).toBe(qualityInspection);
		expect(input.context.validationReport).toBe(validationReport);
		expect(input.previousResult).toBe(previousCandidate);
	});
});

function createTermsSourceSpec(): SourceSpec {
	return {
		schemaVersion: SCHEMA_VERSION.sourceSpec,
		sourceImport: {
			files: [],
			importId: "sample",
			receivedAt: "2026-05-27T00:00:00.000Z",
			sourceKind: "prdd-markdown-bundle",
		},
		sourceShape: {
			screen: {
				name: "약관 동의",
				regions: [
					{
						children: [
							{
								children: [
									{
										componentType: "ListText",
										kind: "component",
										label: "ListTextTerms",
										props: {
											showRightItem: true,
											title: "{약관명} (예: 서비스 이용약관)",
										},
										sourceComponentId: "ListText",
										sourceId: "ListTextTerms",
										variant: "dot",
									},
									{
										componentType: "Checkbox",
										kind: "component",
										label: "CheckboxTermsRequired",
										props: {
											label: "[필수] {약관명} (예: 서비스 이용약관)",
										},
										sourceComponentId: "Checkbox",
										sourceId: "CheckboxTermsRequired",
									},
									{
										componentType: "Checkbox",
										kind: "component",
										label: "CheckboxTermsOptional",
										props: {
											label: "[선택] {약관명} (예: 마케팅 정보 수신 동의)",
										},
										sourceComponentId: "Checkbox",
										sourceId: "CheckboxTermsOptional",
									},
								],
								kind: "area",
								minCount: "2",
								sourceAreaId: "1",
								sourceAreaName: "TermsSection",
							},
						],
						slot: "contents",
					},
				],
				route: "/nova/mbr/pg/001/0",
				screenCode: "NOVA-MBR-PG-001-0",
			},
		},
	};
}
