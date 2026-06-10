import {
	type ComponentProposalContract,
	type CompositionPlanContract,
	type DecorationPlanContract,
	type DesignContextBundleContent,
	type DesignContextBundleRef,
	type DesignSkillSelectionContract,
	getJsonSchema,
	isRenderTreeAreaNode,
	isRenderTreeAreaNodeType,
	isRenderTreeScreenRegionNode,
	isRenderTreeScreenRegionNodeType,
	type QualityInspectionContract,
	RENDER_TREE_NODE_TYPE,
	type RenderTreeContract,
	resolveOutputContractForInference,
	SCHEMA_VERSION,
	SCHEMA_VERSION_BY_ARTIFACT_KIND,
	type SourceSpec,
	SSOT_OBJECT_SCHEMA_VERSION,
	type StageSkillsetObject,
} from "@cx/schema";
import { describe, expect, it } from "vitest";

describe("@cx/schema public API", () => {
	it("uses artifact-local version names without generation flow prefix", () => {
		expect(SCHEMA_VERSION.sourceSpec).toBe("source-spec.v0.1");
		expect(SCHEMA_VERSION.renderTree).toBe("render-tree.v0.1");
		expect(
			Object.values(SCHEMA_VERSION).every((version) => !version.includes("generation-v2")),
		).toBe(true);
	});

	it("maps artifact kinds to schema versions and JSON schema ids", () => {
		expect(SCHEMA_VERSION_BY_ARTIFACT_KIND["source-spec"]).toBe(SCHEMA_VERSION.sourceSpec);
		expect(SCHEMA_VERSION_BY_ARTIFACT_KIND["screen-intent"]).toBe(SCHEMA_VERSION.screenIntent);
		expect(SCHEMA_VERSION_BY_ARTIFACT_KIND["composition-plan"]).toBe(
			SCHEMA_VERSION.compositionPlan,
		);
		expect(SCHEMA_VERSION_BY_ARTIFACT_KIND["decoration-plan"]).toBe(SCHEMA_VERSION.decorationPlan);
		expect(SCHEMA_VERSION_BY_ARTIFACT_KIND["table-generation-result"]).toBe(
			SCHEMA_VERSION.tableGenerationResult,
		);
		expect(getJsonSchema("source-spec")).toMatchObject({
			$id: "source-spec.v0.1",
			properties: {
				schemaVersion: {
					const: "source-spec.v0.1",
				},
			},
		});
		expect(getJsonSchema("render-tree")).toMatchObject({
			$id: "render-tree.v0.1",
			properties: {
				version: {
					const: "render-tree.v0.1",
				},
			},
			required: ["version", "metadata", "children"],
		});
		expect(getJsonSchema("table-generation-result")).toMatchObject({
			$id: "table-generation-result.v0.1",
			properties: {
				schemaVersion: {
					const: "table-generation-result.v0.1",
				},
			},
			required: ["schemaVersion", "screen", "areas", "components"],
		});
		expect(getJsonSchema("screen-intent")).toMatchObject({
			$id: "screen-intent.v0.2",
			additionalProperties: false,
			properties: {
				missingDecisions: {
					type: "array",
				},
				stateCoverageHints: {
					type: "array",
				},
				usedSkills: {
					type: "array",
				},
			},
			required: [
				"schemaVersion",
				"coreJudgment",
				"firstUnderstanding",
				"ctaPromise",
				"contentPriority",
				"sourceInterpretation",
			],
		});
		expect(getJsonSchema("composition-plan")).toMatchObject({
			$id: "composition-plan.v0.1",
			additionalProperties: false,
			properties: {
				density: { enum: ["low", "medium", "high"] },
				rejectedPatterns: { type: "array" },
			},
			required: [
				"schemaVersion",
				"screenLayout",
				"layoutStrategy",
				"sections",
				"visualHierarchy",
				"primaryUserAction",
				"sectionRhythm",
				"density",
				"patternRationale",
				"rejectedPatterns",
			],
		});
		expect(getJsonSchema("decoration-plan")).toMatchObject({
			$id: "decoration-plan.v0.1",
			additionalProperties: false,
			required: ["schemaVersion", "screenId", "sourceScreenRef", "displayRules", "areas"],
		});
		expect(getJsonSchema("quality-inspection")).toMatchObject({
			$id: "quality-inspection.v0.1",
			additionalProperties: false,
			required: ["schemaVersion", "inspection", "findings", "summary"],
		});
	});

	it("types SourceSpec against the schema package contract", () => {
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
					name: "샘플",
					regions: [],
					route: "/sample",
					screenCode: "SAMPLE",
				},
			},
		};

		expect(sourceSpec.schemaVersion).toBe("source-spec.v0.1");
	});

	it("exposes schema contracts from the package root", () => {
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
					name: "샘플",
					regions: [],
					route: "/sample",
					screenCode: "SAMPLE",
				},
			},
		};
		const renderTree: RenderTreeContract = {
			children: [],
			metadata: {
				id: "sample-screen",
			},
			version: SCHEMA_VERSION.renderTree,
		};

		expect(sourceSpec.schemaVersion).toBe(SCHEMA_VERSION.sourceSpec);
		expect(renderTree.version).toBe(SCHEMA_VERSION.renderTree);
	});

	it("exposes output contracts as inference SSOT objects", () => {
		const contract = resolveOutputContractForInference("composition-plan");

		expect(contract).toMatchObject({
			kind: "output-contract",
			id: "composition-plan",
			owner: "@cx/schema",
			sourceRef: "json-schema/composition-plan",
			schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
			data: {
				dtoName: "CompositionPlanContract",
				jsonSchema: {
					$id: SCHEMA_VERSION.compositionPlan,
				},
			},
		});
	});

	it("exposes stage skillsets as inference references", () => {
		const skillset: StageSkillsetObject = {
			kind: "stage-skillset",
			id: "understand.screen-intent",
			owner: "@cx/agent",
			sourceRef: "../docs/skills/stage-skillsets/understand.screen-intent",
			schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
			data: {
				stage: "understand",
				task: "screen-intent",
				documents: [
					{
						body: "# Screen Intent",
						id: "screen-intent",
						kind: "prompt",
						priority: "required",
						role: "intent-extraction",
						sourceRef: "../docs/prompts/screen-intent.md",
						stage: "understand",
						task: "screen-intent",
					},
				],
			},
		};

		expect(skillset.kind).toBe("stage-skillset");
		expect(skillset.data.documents[0]?.sourceRef).toBe("../docs/prompts/screen-intent.md");
	});

	it("exposes RenderTree node type constants and guards from the package root", () => {
		expect(RENDER_TREE_NODE_TYPE.screenContents).toBe("Screen.Contents");
		expect(isRenderTreeAreaNodeType(RENDER_TREE_NODE_TYPE.areaStatic)).toBe(true);
		expect(isRenderTreeAreaNodeType("Screen.Contents")).toBe(false);
		expect(isRenderTreeScreenRegionNodeType(RENDER_TREE_NODE_TYPE.screenBottom)).toBe(true);
		expect(isRenderTreeScreenRegionNodeType("area.static")).toBe(false);
		expect(
			isRenderTreeAreaNode({
				componentVersion: "1.0.0",
				metadata: { id: "area-1", title: "Area" },
				type: RENDER_TREE_NODE_TYPE.areaStatic,
			}),
		).toBe(true);
		expect(
			isRenderTreeScreenRegionNode({
				componentVersion: "0.1.0",
				metadata: { id: "screen.contents", title: "Contents" },
				type: RENDER_TREE_NODE_TYPE.screenContents,
			}),
		).toBe(true);
	});

	it("exposes design-context bundle refs as schema-owned DTOs", () => {
		const bundleRef: DesignContextBundleRef = {
			id: "layout-composition",
			reason: "screen composition guidance",
			sourceDocs: ["packages/agent/docs/skills/references/design/COMPOSITION_LAYERS.md"],
			version: "2026-05-29",
		};

		expect(bundleRef.id).toBe("layout-composition");
	});

	it("exposes DesignContextBundleContent with ref provenance and body", () => {
		const content: DesignContextBundleContent = {
			id: "visual-foundation",
			version: "2026-05-29",
			reason: "test",
			sourceDocs: ["packages/agent/docs/skills/references/design/VISUAL_FOUNDATION_OBSERVATIONS.md"],
			body: "rule lines",
		};

		expect(content.id).toBe("visual-foundation");
		expect(content.body.length).toBeGreaterThan(0);
	});

	it("exposes design skill selection as a schema-owned trace contract", () => {
		const selection: DesignSkillSelectionContract = {
			candidateSkills: [],
			fallback: false,
			rationale: "Detail confirmation screen has summary evidence and a bottom action.",
			schemaVersion: SCHEMA_VERSION.designSkillSelection,
			selectedSkill: {
				appliesTo: ["detail-confirmation"],
				id: "detail-confirmation-screen",
				qualityGates: ["visual-hierarchy", "action-clarity", "pattern-fit"],
				reason: "Summary and CTA source evidence match detail confirmation composition.",
				requiredDesignDocs: [
					"packages/agent/docs/skills/references/design/COMPOSITION_LAYERS.md",
					"packages/agent/docs/skills/references/design/SCREEN_PATTERN_SUMMARY.md",
					"packages/agent/docs/skills/references/design/INTERACTION_PATTERNS.md",
				],
				version: "2026-06-01",
			},
		};

		expect(selection.schemaVersion).toBe("design-skill-selection.v0.1");
		expect(selection.selectedSkill.id).toBe("detail-confirmation-screen");
		expect(selection.selectedSkill.requiredDesignDocs).toContain(
			"packages/agent/docs/skills/references/design/INTERACTION_PATTERNS.md",
		);
	});

	it("exposes composition plan design decisions as schema-owned fields", () => {
		const plan: CompositionPlanContract = {
			density: "medium",
			layoutStrategy: "Use a detail screen with a stable content rail.",
			patternRationale: "Detail composition keeps the primary facts ahead of the action slot.",
			primaryUserAction: "confirm-selection",
			rejectedPatterns: [
				{
					pattern: "main-browse",
					reason: "The source has no repeated discovery sections.",
				},
			],
			schemaVersion: SCHEMA_VERSION.compositionPlan,
			screenLayout: "layout.screen.mobileScreen",
			sectionRhythm: "Header, content summary, and bottom action.",
			sections: [
				{
					priority: 1,
					role: "content",
					sourceRefs: ["area-1"],
					strategy: "Place primary content in the contents region.",
					targetRegion: "contents",
				},
			],
			visualHierarchy: "Primary summary first, supporting rows second, action last.",
		};

		expect(plan.visualHierarchy).toContain("Primary summary");
		expect(plan.rejectedPatterns[0].pattern).toBe("main-browse");
	});

	it("exposes component-proposal schema and version", () => {
		const proposal: ComponentProposalContract = {
			schemaVersion: SCHEMA_VERSION.componentProposal,
			proposals: [
				{
					id: "proposal-1",
					proposedComponentType: "PriceCallout",
					rationale: "Source emphasizes total price",
					sourceEvidence: ["area.price"],
					nearestCatalogMatch: "Callout",
					suggestedProps: { emphasis: "strong" },
				},
			],
		};

		expect(proposal.proposals[0].proposedComponentType).toBe("PriceCallout");
		expect(SCHEMA_VERSION.componentProposal).toBe("component-proposal.v0.1");
		expect(getJsonSchema("component-proposal").$id).toBe(SCHEMA_VERSION.componentProposal);
		expect(SCHEMA_VERSION_BY_ARTIFACT_KIND["component-proposal"]).toBe(
			SCHEMA_VERSION.componentProposal,
		);
	});

	it("includes design dimension scores in quality inspection", () => {
		const quality: QualityInspectionContract = {
			schemaVersion: SCHEMA_VERSION.qualityInspection,
			inspection: {
				compositionAligned: true,
				sourceFaithful: true,
				visualHierarchyClear: true,
			},
			scores: {
				actionClarity: 4,
				densityFit: 4,
				fidelity: 5,
				hierarchy: 4,
				patternFit: 3,
				separation: 3,
			},
			findings: [
				{ code: "density-too-high", layer: "compose", message: "Dense", severity: "info" },
			],
			summary: { errorCount: 0, warningCount: 0 },
		};

		expect(quality.scores?.hierarchy).toBe(4);
		expect(quality.findings[0].layer).toBe("compose");
		expect(getJsonSchema("quality-inspection")).toMatchObject({
			properties: {
				scores: {
					properties: {
						actionClarity: { type: "integer" },
						densityFit: { type: "integer" },
						patternFit: { type: "integer" },
					},
					type: "object",
				},
			},
		});
	});

	it("exposes decoration plan as a schema-owned intermediate artifact", () => {
		const decorationPlan: DecorationPlanContract = {
			areas: [
				{
					componentRefs: ["ListTextTerms"],
					displayTitle: "약관 목록 조회",
					id: "decor.area.1.content-list",
					layoutIntent: { areaPatternRole: "list-stack" },
					role: "content-list",
					sourceAreaId: "1",
					splitFrom: "1",
					targetRegion: "contents",
				},
			],
			displayRules: { hideInternalSourceNames: true },
			schemaVersion: SCHEMA_VERSION.decorationPlan,
			screenId: "NOVA-MBR-PG-001-0",
			sourceScreenRef: "NOVA-MBR-PG-001-0",
		};

		expect(decorationPlan.areas[0].displayTitle).toBe("약관 목록 조회");
	});
});
