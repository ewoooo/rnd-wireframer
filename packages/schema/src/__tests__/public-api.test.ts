import {
	type ComponentProposalContract,
	type DecorationPlanContract,
	type DesignContextBundleContent,
	type DesignContextBundleRef,
	getJsonSchema,
	type QualityInspectionContract,
	type RenderTreeContract,
	SCHEMA_VERSION,
	SCHEMA_VERSION_BY_ARTIFACT_KIND,
	type SourceSpec,
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
			$id: "screen-intent.v0.1",
			additionalProperties: false,
			properties: {
				missingDecisions: {
					type: "array",
				},
				stateCoverageHints: {
					type: "array",
				},
			},
			required: ["schemaVersion", "screenPurpose", "contentPriority", "sourceInterpretation"],
		});
		expect(getJsonSchema("composition-plan")).toMatchObject({
			$id: "composition-plan.v0.1",
			additionalProperties: false,
			required: ["schemaVersion", "screenLayout", "layoutStrategy", "sections"],
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

	it("exposes design-context bundle refs as schema-owned DTOs", () => {
		const bundleRef: DesignContextBundleRef = {
			id: "layout-composition",
			reason: "screen composition guidance",
			sourceDocs: ["docs/design/COMPOSITION_LAYERS.md"],
			version: "2026-05-29",
		};

		expect(bundleRef.id).toBe("layout-composition");
	});

	it("exposes DesignContextBundleContent with ref provenance and body", () => {
		const content: DesignContextBundleContent = {
			id: "visual-foundation",
			version: "2026-05-29",
			reason: "test",
			sourceDocs: ["docs/design/VISUAL_FOUNDATION_OBSERVATIONS.md"],
			body: "rule lines",
		};

		expect(content.id).toBe("visual-foundation");
		expect(content.body.length).toBeGreaterThan(0);
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
			scores: { hierarchy: 4, separation: 3, fidelity: 5 },
			findings: [],
			summary: { errorCount: 0, warningCount: 0 },
		};

		expect(quality.scores?.hierarchy).toBe(4);
		expect(getJsonSchema("quality-inspection")).toMatchObject({
			properties: { scores: { type: "object" } },
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
