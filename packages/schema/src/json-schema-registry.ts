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
			renderTreeNode: {
				type: "object",
				additionalProperties: false,
				required: ["type", "componentVersion", "metadata"],
				properties: {
					type: { type: "string", minLength: 1 },
					componentVersion: { type: "string", minLength: 1 },
					metadata: { $ref: "#/$defs/renderTreeNodeMetadata" },
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
