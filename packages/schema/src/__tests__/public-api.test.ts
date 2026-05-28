import {
	getJsonSchema,
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
			required: ["schemaVersion", "screenPurpose", "contentPriority", "sourceInterpretation"],
		});
		expect(getJsonSchema("composition-plan")).toMatchObject({
			$id: "composition-plan.v0.1",
			additionalProperties: false,
			required: ["schemaVersion", "screenLayout", "layoutStrategy", "sections"],
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
});
