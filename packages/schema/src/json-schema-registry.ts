import type { GenerationArtifactKind } from "./artifact-kind";
import { SCHEMA_VERSION_BY_ARTIFACT_KIND } from "./artifact-kind";
import { SCHEMA_VERSION } from "./versions";

export type JsonSchemaDocument = Record<string, unknown> & {
	$schema: "https://json-schema.org/draft/2020-12/schema";
	$id: string;
	title: string;
	type: "object";
};

export const JSON_SCHEMA_BY_ARTIFACT_KIND = {
	...Object.fromEntries(
		Object.entries(SCHEMA_VERSION_BY_ARTIFACT_KIND).map(([kind, version]) => [
			kind,
			createJsonSchema(kind, version),
		]),
	),
	"render-tree": createRenderTreeJsonSchema(),
	"table-generation-result": createTableGenerationResultJsonSchema(),
} as Record<GenerationArtifactKind, JsonSchemaDocument>;

export function getJsonSchema(kind: GenerationArtifactKind): JsonSchemaDocument {
	return JSON_SCHEMA_BY_ARTIFACT_KIND[kind];
}

function createJsonSchema(kind: string, version: string): JsonSchemaDocument {
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: version,
		additionalProperties: true,
		properties: {
			schemaVersion: {
				const: version,
			},
		},
		required: ["schemaVersion"],
		title: kind,
		type: "object",
	};
}

function createRenderTreeJsonSchema(): JsonSchemaDocument {
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: SCHEMA_VERSION.renderTree,
		title: "render-tree",
		type: "object",
		additionalProperties: false,
		required: ["version", "metadata", "children"],
		properties: {
			version: { const: SCHEMA_VERSION.renderTree },
			minRendererVersion: { type: "string" },
			metadata: { $ref: "#/$defs/renderTreeMetadata" },
			theme: {
				type: "object",
				additionalProperties: false,
				properties: {
					mode: { enum: ["light", "dark", "system"] },
					primaryColor: { type: "string" },
					fontFamily: { type: "string" },
				},
			},
			data: { type: "object" },
			children: {
				type: "array",
				items: { $ref: "#/$defs/renderTreeNode" },
			},
		},
		$defs: {
			renderTreeMetadata: {
				type: "object",
				additionalProperties: false,
				required: ["id"],
				properties: {
					id: { type: "string", minLength: 1 },
					author: { type: "string" },
					createdAt: { type: "string" },
					description: { type: "string" },
					updatedAt: { type: "string" },
				},
			},
			renderTreeNodeMetadata: {
				type: "object",
				additionalProperties: false,
				required: ["id", "title"],
				properties: {
					id: { type: "string", minLength: 1 },
					title: { type: "string", minLength: 1 },
					author: { type: "string" },
					createdAt: { type: "string" },
					description: { type: "string" },
					updatedAt: { type: "string" },
				},
			},
			propBinding: {
				type: "object",
				additionalProperties: false,
				required: ["bind"],
				properties: {
					bind: { type: "string", minLength: 1 },
					default: {
						type: ["string", "number", "boolean", "null"],
					},
				},
			},
			propValue: {
				anyOf: [
					{ type: ["string", "number", "boolean", "null"] },
					{ $ref: "#/$defs/propBinding" },
					{
						type: "array",
						items: { $ref: "#/$defs/propValue" },
					},
					{
						type: "object",
						additionalProperties: { $ref: "#/$defs/propValue" },
					},
				],
			},
			props: {
				type: "object",
				additionalProperties: { $ref: "#/$defs/propValue" },
			},
			display: {
				type: "object",
				additionalProperties: false,
				properties: {
					when: {
						anyOf: [{ type: "boolean" }, { $ref: "#/$defs/propBinding" }],
					},
					stateRole: {
						enum: ["base", "loading", "empty", "error", "success", "disabled", "expanded"],
					},
				},
			},
			patternRef: {
				type: "object",
				additionalProperties: false,
				required: ["id"],
				properties: {
					id: { type: "string", minLength: 1 },
					variant: { type: "string", minLength: 1 },
				},
			},
			renderTreeNode: {
				type: "object",
				additionalProperties: false,
				required: ["type", "componentVersion", "metadata"],
				properties: {
					type: { type: "string", minLength: 1 },
					componentVersion: { type: "string", minLength: 1 },
					metadata: { $ref: "#/$defs/renderTreeNodeMetadata" },
					pattern: { $ref: "#/$defs/patternRef" },
					props: { $ref: "#/$defs/props" },
					className: { type: "string" },
					style: {
						type: "object",
						additionalProperties: false,
						properties: {
							background: { type: "string" },
							opacity: { type: "number" },
						},
					},
					display: { $ref: "#/$defs/display" },
					children: {
						type: "array",
						items: { $ref: "#/$defs/renderTreeNode" },
					},
				},
			},
		},
	};
}

function createTableGenerationResultJsonSchema(): JsonSchemaDocument {
	const patternRef = { $ref: "#/$defs/patternRef" };
	const childRef = { $ref: "#/$defs/childRef" };

	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: SCHEMA_VERSION.tableGenerationResult,
		title: "table-generation-result",
		type: "object",
		additionalProperties: false,
		required: ["schemaVersion", "screen", "areas", "components"],
		properties: {
			schemaVersion: { const: SCHEMA_VERSION.tableGenerationResult },
			screen: { $ref: "#/$defs/screenRecord" },
			areas: {
				type: "array",
				items: { $ref: "#/$defs/areaRecord" },
			},
			components: {
				type: "array",
				items: { $ref: "#/$defs/componentRecord" },
			},
		},
		$defs: {
			patternRef: {
				type: "object",
				additionalProperties: false,
				required: ["id"],
				properties: {
					id: { type: "string", minLength: 1 },
					variant: { type: "string", minLength: 1 },
				},
			},
			metadata: {
				type: "object",
				additionalProperties: true,
				required: ["title"],
				properties: {
					title: { type: "string", minLength: 1 },
					author: { type: "string" },
					createdAt: { type: "string" },
					description: { type: "string" },
					updatedAt: { type: "string" },
				},
			},
			childRef: {
				type: "object",
				additionalProperties: false,
				required: ["kind", "id"],
				properties: {
					kind: { enum: ["area", "component"] },
					id: { type: "string", minLength: 1 },
				},
			},
			regionRecord: {
				type: "object",
				additionalProperties: false,
				required: ["type", "metadata", "pattern", "children"],
				properties: {
					type: { enum: ["Screen.Header", "Screen.Contents", "Screen.Bottom"] },
					metadata: {
						type: "object",
						additionalProperties: true,
						required: ["title"],
						properties: { title: { type: "string", minLength: 1 } },
					},
					pattern: patternRef,
					children: { type: "array", items: childRef },
				},
			},
			screenRecord: {
				type: "object",
				additionalProperties: false,
				required: ["id", "version", "metadata", "screenVariantId", "pattern", "screen"],
				properties: {
					id: { type: "string", minLength: 1 },
					version: { type: "string", minLength: 1 },
					metadata: { $ref: "#/$defs/metadata" },
					screenVariantId: { type: "string", minLength: 1 },
					minRendererVersion: { type: "string" },
					pattern: patternRef,
					screen: {
						type: "object",
						additionalProperties: false,
						required: ["type", "regions"],
						properties: {
							type: { const: "screen.page" },
							regions: {
								type: "object",
								additionalProperties: false,
								required: ["header", "contents", "bottom"],
								properties: {
									header: { $ref: "#/$defs/regionRecord" },
									contents: { $ref: "#/$defs/regionRecord" },
									bottom: { $ref: "#/$defs/regionRecord" },
								},
							},
						},
					},
				},
			},
			areaRecord: {
				type: "object",
				additionalProperties: false,
				required: ["id", "version", "metadata", "pattern", "type", "children"],
				properties: {
					id: { type: "string", minLength: 1 },
					version: { type: "string", minLength: 1 },
					metadata: { $ref: "#/$defs/metadata" },
					pattern: patternRef,
					type: { enum: ["area.static", "area.dynamic"] },
					props: { type: "object" },
					children: { type: "array", items: childRef },
				},
			},
			componentChild: {
				type: "object",
				additionalProperties: false,
				required: ["component"],
				properties: {
					component: {
						type: "object",
						additionalProperties: false,
						required: ["type"],
						properties: {
							type: { type: "string", minLength: 1 },
							variant: { type: "string", minLength: 1 },
						},
					},
					props: { type: "object" },
				},
			},
			componentRecord: {
				type: "object",
				additionalProperties: false,
				required: ["id", "version", "metadata", "pattern", "type", "children"],
				properties: {
					id: { type: "string", minLength: 1 },
					version: { type: "string", minLength: 1 },
					metadata: { $ref: "#/$defs/metadata" },
					pattern: patternRef,
					type: { type: "string", minLength: 1 },
					children: { type: "array", items: { $ref: "#/$defs/componentChild" } },
					hooks: { type: "array" },
				},
			},
		},
	};
}
