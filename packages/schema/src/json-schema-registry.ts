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
	"composition-plan": createCompositionPlanJsonSchema(),
	"quality-inspection": createQualityInspectionJsonSchema(),
	"render-tree": createRenderTreeJsonSchema(),
	"screen-intent": createScreenIntentJsonSchema(),
	"table-generation-result": createTableGenerationResultJsonSchema(),
} as Record<GenerationArtifactKind, JsonSchemaDocument>;

export function getJsonSchema(kind: GenerationArtifactKind): JsonSchemaDocument {
	return JSON_SCHEMA_BY_ARTIFACT_KIND[kind];
}

function layoutIdSchema(target?: "area" | "composite" | "region" | "screen") {
	const targetPattern = target ?? "screen|region|area|composite";
	return {
		type: "string",
		pattern: `^layout\\.(${targetPattern})\\.[A-Za-z0-9]+$`,
	};
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

function createScreenIntentJsonSchema(): JsonSchemaDocument {
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: SCHEMA_VERSION.screenIntent,
		additionalProperties: false,
		properties: {
			contentPriority: {
				type: "array",
				items: { type: "string", minLength: 1 },
			},
			primaryUserAction: { type: "string", minLength: 1 },
			rationale: { type: "string", minLength: 1 },
			schemaVersion: { const: SCHEMA_VERSION.screenIntent },
			screenPurpose: { type: "string", minLength: 1 },
			sourceInterpretation: {
				type: "object",
				additionalProperties: false,
				required: ["defer", "preserve", "summarize"],
				properties: {
					defer: {
						type: "array",
						items: { type: "string", minLength: 1 },
					},
					preserve: {
						type: "array",
						items: { type: "string", minLength: 1 },
					},
					summarize: {
						type: "array",
						items: { type: "string", minLength: 1 },
					},
				},
			},
		},
		required: ["schemaVersion", "screenPurpose", "contentPriority", "sourceInterpretation"],
		title: "screen-intent",
		type: "object",
	};
}

function createCompositionPlanJsonSchema(): JsonSchemaDocument {
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: SCHEMA_VERSION.compositionPlan,
		additionalProperties: false,
		properties: {
			layoutStrategy: { type: "string", minLength: 1 },
			rationale: { type: "string", minLength: 1 },
			schemaVersion: { const: SCHEMA_VERSION.compositionPlan },
			screenLayout: layoutIdSchema("screen"),
			sections: {
				type: "array",
				minItems: 1,
				items: { $ref: "#/$defs/section" },
			},
		},
		required: ["schemaVersion", "screenLayout", "layoutStrategy", "sections"],
		title: "composition-plan",
		type: "object",
		$defs: {
			section: {
				type: "object",
				additionalProperties: false,
				required: ["targetRegion", "role", "priority", "sourceRefs", "strategy"],
				properties: {
					priority: { type: "integer", minimum: 1 },
					role: {
						enum: ["bottom-action", "content", "feedback", "form", "header", "summary"],
					},
					sourceRefs: {
						type: "array",
						minItems: 1,
						items: { type: "string", minLength: 1 },
					},
					strategy: { type: "string", minLength: 1 },
					targetRegion: { enum: ["bottom", "contents", "header", "overlay"] },
				},
			},
		},
	};
}

function createQualityInspectionJsonSchema(): JsonSchemaDocument {
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: SCHEMA_VERSION.qualityInspection,
		additionalProperties: false,
		properties: {
			findings: {
				type: "array",
				items: { $ref: "#/$defs/finding" },
			},
			inspection: {
				type: "object",
				additionalProperties: false,
				required: ["compositionAligned", "sourceFaithful", "visualHierarchyClear"],
				properties: {
					compositionAligned: { type: "boolean" },
					sourceFaithful: { type: "boolean" },
					visualHierarchyClear: { type: "boolean" },
				},
			},
			schemaVersion: { const: SCHEMA_VERSION.qualityInspection },
			summary: {
				type: "object",
				additionalProperties: false,
				required: ["errorCount", "warningCount"],
				properties: {
					errorCount: { type: "integer", minimum: 0 },
					warningCount: { type: "integer", minimum: 0 },
				},
			},
		},
		required: ["schemaVersion", "inspection", "findings", "summary"],
		title: "quality-inspection",
		type: "object",
		$defs: {
			finding: {
				type: "object",
				additionalProperties: false,
				required: ["code", "message", "severity"],
				properties: {
					code: { type: "string", minLength: 1 },
					message: { type: "string", minLength: 1 },
					path: {
						type: "array",
						items: {
							anyOf: [{ type: "string" }, { type: "integer" }],
						},
					},
					severity: { enum: ["error", "info", "warning"] },
					suggestion: { type: "string", minLength: 1 },
				},
			},
		},
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
					layout: {
						...layoutIdSchema(),
					},
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
				required: ["type", "metadata", "layout", "children"],
				properties: {
					type: { enum: ["Screen.Header", "Screen.Contents", "Screen.Bottom"] },
					layout: layoutIdSchema("region"),
					metadata: {
						type: "object",
						additionalProperties: true,
						required: ["title"],
						properties: { title: { type: "string", minLength: 1 } },
					},
					children: { type: "array", items: childRef },
				},
			},
			screenRecord: {
				type: "object",
				additionalProperties: false,
				required: ["id", "version", "metadata", "screenVariantId", "layout", "screen"],
				properties: {
					id: { type: "string", minLength: 1 },
					version: { type: "string", minLength: 1 },
					metadata: { $ref: "#/$defs/metadata" },
					screenVariantId: { type: "string", minLength: 1 },
					minRendererVersion: { type: "string" },
					layout: layoutIdSchema("screen"),
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
				required: ["id", "version", "metadata", "layout", "type", "children"],
				properties: {
					id: { type: "string", minLength: 1 },
					version: { type: "string", minLength: 1 },
					metadata: { $ref: "#/$defs/metadata" },
					layout: layoutIdSchema("area"),
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
				required: ["id", "version", "metadata", "layout", "type", "children"],
				properties: {
					id: { type: "string", minLength: 1 },
					version: { type: "string", minLength: 1 },
					metadata: { $ref: "#/$defs/metadata" },
					layout: layoutIdSchema("composite"),
					type: { type: "string", minLength: 1 },
					children: { type: "array", items: { $ref: "#/$defs/componentChild" } },
					hooks: { type: "array" },
				},
			},
		},
	};
}
