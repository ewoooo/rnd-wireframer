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
				components: [],
				screen: {
					areas: [],
					name: "샘플",
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
				components: [],
				screen: {
					areas: [],
					name: "샘플",
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
