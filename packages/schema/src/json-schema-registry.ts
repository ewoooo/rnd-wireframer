import type { GenerationArtifactKind } from "./artifact-kind";
import { SCHEMA_VERSION_BY_ARTIFACT_KIND } from "./artifact-kind";
import { RENDER_TREE_AREA_NODE_TYPES } from "./render-tree";
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
	"component-proposal": createComponentProposalJsonSchema(),
	"composition-plan": createCompositionPlanJsonSchema(),
	"decoration-plan": createDecorationPlanJsonSchema(),
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

function createComponentProposalJsonSchema(): JsonSchemaDocument {
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: SCHEMA_VERSION.componentProposal,
		additionalProperties: false,
		required: ["schemaVersion", "proposals"],
		title: "component-proposal",
		type: "object",
		properties: {
			schemaVersion: { const: SCHEMA_VERSION.componentProposal },
			proposals: {
				type: "array",
				items: { $ref: "#/$defs/proposal" },
			},
		},
		$defs: {
			proposal: {
				type: "object",
				additionalProperties: false,
				required: [
					"id",
					"proposedComponentType",
					"rationale",
					"sourceEvidence",
					"nearestCatalogMatch",
				],
				properties: {
					id: { type: "string", minLength: 1 },
					proposedComponentType: { type: "string", minLength: 1 },
					rationale: { type: "string", minLength: 1 },
					sourceEvidence: {
						type: "array",
						minItems: 1,
						items: { type: "string", minLength: 1 },
					},
					nearestCatalogMatch: { type: "string", minLength: 1 },
					suggestedProps: { type: "object", additionalProperties: true },
				},
			},
		},
	};
}

function createDecorationPlanJsonSchema(): JsonSchemaDocument {
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: SCHEMA_VERSION.decorationPlan,
		additionalProperties: false,
		properties: {
			areas: {
				type: "array",
				items: { $ref: "#/$defs/area" },
			},
			diagnostics: {
				type: "array",
				items: { $ref: "#/$defs/diagnostic" },
			},
			displayRules: {
				type: "object",
				additionalProperties: false,
				required: ["hideInternalSourceNames"],
				properties: {
					hideInternalSourceNames: { type: "boolean" },
				},
			},
			schemaVersion: { const: SCHEMA_VERSION.decorationPlan },
			screenId: { type: "string", minLength: 1 },
			sourceScreenRef: { type: "string", minLength: 1 },
		},
		required: ["schemaVersion", "screenId", "sourceScreenRef", "displayRules", "areas"],
		title: "decoration-plan",
		type: "object",
		$defs: {
			area: {
				type: "object",
				additionalProperties: false,
				required: ["id", "sourceAreaId", "displayTitle", "role", "targetRegion", "componentRefs"],
				properties: {
					componentRefs: {
						type: "array",
						items: { type: "string", minLength: 1 },
					},
					displayTitle: { type: "string", minLength: 1 },
					id: { type: "string", minLength: 1 },
					layoutIntent: {
						type: "object",
						additionalProperties: false,
						required: ["areaPatternRole"],
						properties: {
							areaPatternRole: {
								enum: [
									"app-bar",
									"bottom-action",
									"checkbox-stack",
									"field-stack",
									"list-stack",
									"message-stack",
								],
							},
						},
					},
					repeatedItems: {
						type: "array",
						items: { $ref: "#/$defs/repeatedItem" },
					},
					role: {
						enum: [
							"agreement-controls",
							"bottom-action",
							"content-list",
							"form",
							"message",
							"navigation",
						],
					},
					sourceAreaId: { type: "string", minLength: 1 },
					splitFrom: { type: "string", minLength: 1 },
					targetRegion: { enum: ["bottom", "contents", "header"] },
				},
			},
			diagnostic: {
				type: "object",
				additionalProperties: false,
				required: ["code", "message", "severity"],
				properties: {
					code: { type: "string", minLength: 1 },
					message: { type: "string", minLength: 1 },
					severity: { enum: ["error", "warning"] },
					sourceRef: { type: "string", minLength: 1 },
				},
			},
			repeatedItem: {
				type: "object",
				additionalProperties: false,
				required: ["sourceComponentRef", "label"],
				properties: {
					label: { type: "string", minLength: 1 },
					propsHint: {
						type: "object",
						additionalProperties: true,
					},
					required: { type: "boolean" },
					sourceComponentRef: { type: "string", minLength: 1 },
				},
			},
		},
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
			audience: { type: "string", minLength: 1 },
			missingDecisions: {
				type: "array",
				items: { type: "string", minLength: 1 },
			},
			primaryUserAction: { type: "string", minLength: 1 },
			primaryTask: { type: "string", minLength: 1 },
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
			stateCoverageHints: {
				type: "array",
				items: { $ref: "#/$defs/stateCoverageHint" },
			},
			successMoment: { type: "string", minLength: 1 },
			usedSkills: {
				type: "array",
				items: { $ref: "#/$defs/usedSkill" },
			},
		},
		required: ["schemaVersion", "screenPurpose", "contentPriority", "sourceInterpretation"],
		title: "screen-intent",
		type: "object",
		$defs: {
			usedSkill: {
				type: "object",
				additionalProperties: false,
				required: ["id", "sourceRef", "stage", "task"],
				properties: {
					id: { type: "string", minLength: 1 },
					role: { type: "string", minLength: 1 },
					sourceRef: { type: "string", minLength: 1 },
					stage: { enum: ["compose", "revise", "understand"] },
					task: { type: "string", minLength: 1 },
				},
			},
			stateCoverageHint: {
				type: "object",
				additionalProperties: false,
				required: ["surface", "states", "reason"],
				properties: {
					reason: { type: "string", minLength: 1 },
					states: {
						type: "array",
						minItems: 1,
						items: {
							enum: ["disabled", "empty", "error", "loading", "populated", "validation"],
						},
					},
					surface: {
						enum: ["async", "detail", "form", "list", "search"],
					},
				},
			},
		},
	};
}

function createCompositionPlanJsonSchema(): JsonSchemaDocument {
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: SCHEMA_VERSION.compositionPlan,
		additionalProperties: false,
		properties: {
			density: { enum: ["low", "medium", "high"] },
			layoutStrategy: { type: "string", minLength: 1 },
			patternRationale: { type: "string", minLength: 1 },
			primaryUserAction: { type: "string", minLength: 1 },
			rationale: { type: "string", minLength: 1 },
			rejectedPatterns: {
				type: "array",
				items: { $ref: "#/$defs/rejectedPattern" },
			},
			schemaVersion: { const: SCHEMA_VERSION.compositionPlan },
			screenLayout: layoutIdSchema("screen"),
			sectionRhythm: { type: "string", minLength: 1 },
			sections: {
				type: "array",
				minItems: 1,
				items: { $ref: "#/$defs/section" },
			},
			visualHierarchy: { type: "string", minLength: 1 },
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
		title: "composition-plan",
		type: "object",
		$defs: {
			rejectedPattern: {
				type: "object",
				additionalProperties: false,
				required: ["pattern", "reason"],
				properties: {
					pattern: { type: "string", minLength: 1 },
					reason: { type: "string", minLength: 1 },
				},
			},
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
					targetRegion: { enum: ["bottom", "contents", "header"] },
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
			scores: {
				type: "object",
				additionalProperties: false,
				required: [
					"hierarchy",
					"separation",
					"fidelity",
					"actionClarity",
					"densityFit",
					"patternFit",
				],
				properties: {
					actionClarity: { type: "integer", minimum: 0, maximum: 5 },
					densityFit: { type: "integer", minimum: 0, maximum: 5 },
					fidelity: { type: "integer", minimum: 0, maximum: 5 },
					hierarchy: { type: "integer", minimum: 0, maximum: 5 },
					patternFit: { type: "integer", minimum: 0, maximum: 5 },
					separation: { type: "integer", minimum: 0, maximum: 5 },
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
					layer: { enum: ["understand", "compose", "revise"] },
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
					type: { enum: [...RENDER_TREE_AREA_NODE_TYPES] },
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
