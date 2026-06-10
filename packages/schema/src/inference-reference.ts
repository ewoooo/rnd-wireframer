import type { GenerationArtifactKind } from "./artifact-kind";
import type { ComponentCatalogEntry } from "./component-catalog";
import {
	getJsonSchema,
	JSON_SCHEMA_BY_ARTIFACT_KIND,
	type JsonSchemaDocument,
} from "./json-schema-registry";
import type { ReferenceCatalogObject } from "./reference-catalog";

export const SSOT_OBJECT_SCHEMA_VERSION = "ssot-object.v1" as const;

export type SsotObject<TKind extends string, TData extends object> = {
	kind: TKind;
	id: string;
	owner: string;
	sourceRef: string;
	version?: string;
	contentHash?: string;
	schemaVersion: typeof SSOT_OBJECT_SCHEMA_VERSION;
	data: TData;
};

export type TokenCatalogData = {
	variables: Record<string, unknown>;
	tailwindKeys: string[];
};

export type TokenCatalogObject = SsotObject<"token-catalog", TokenCatalogData>;

export type OutputContractData = {
	jsonSchema: JsonSchemaDocument;
	dtoName: string;
};

export type OutputContractObject = SsotObject<"output-contract", OutputContractData>;

export type SkillDocumentData = {
	format: "markdown";
	body: string;
	frontmatter?: Record<string, unknown>;
	sourceRef: string;
};

export type SkillData = {
	format: "json";
	sets: Record<string, SkillDocumentData>;
};

export type SkillObject = SsotObject<"skill", SkillData>;

export type StageSkillsetDocument = {
	id: string;
	body: string;
	frontmatter?: Record<string, unknown>;
	kind: "prompt" | "skill";
	priority?: "optional" | "recommended" | "required";
	role?: string;
	sourceRef: string;
	stage: "compose" | "revise" | "understand";
	task: string;
};

export type StageSkillsetData = {
	documents: StageSkillsetDocument[];
	stage: "compose" | "revise" | "understand";
	task: string;
};

export type StageSkillsetObject = SsotObject<"stage-skillset", StageSkillsetData>;

export type ComponentCatalogData = {
	entries: ComponentCatalogEntry[];
};

export type ComponentCatalogObject = SsotObject<"component-catalog", ComponentCatalogData>;

export type LayoutCatalogData = {
	screen: unknown[];
	region: unknown[];
	area: unknown[];
	composite: unknown[];
};

export type LayoutCatalogObject = SsotObject<"layout-catalog", LayoutCatalogData>;

export type PromptCatalogData = {
	messages?: Array<{ role: string; content: string }>;
	template?: string;
	variables: Record<string, unknown>;
};

export type PromptCatalogObject = SsotObject<"prompt-catalog", PromptCatalogData>;

export type InferenceReference =
	| TokenCatalogObject
	| OutputContractObject
	| SkillObject
	| StageSkillsetObject
	| ComponentCatalogObject
	| LayoutCatalogObject
	| PromptCatalogObject
	| ReferenceCatalogObject;

const DTO_NAME_BY_ARTIFACT_KIND: Record<GenerationArtifactKind, string> = {
	"agent-request": "AgentRequestContract",
	"agent-result": "AgentResultContract",
	"apply-result": "ApplyResultContract",
	"component-proposal": "ComponentProposalContract",
	"composition-plan": "CompositionPlanContract",
	"decoration-plan": "DecorationPlanContract",
	"draft-candidate": "DraftCandidateContract",
	"generation-context": "GenerationContext",
	preview: "PreviewContract",
	"quality-inspection": "QualityInspectionContract",
	"render-tree": "RenderTreeContract",
	"screen-intent": "ScreenIntentContract",
	"source-spec": "SourceSpec",
	"table-generation-result": "TableGenerationResultContract",
	"validation-report": "ValidationReportContract",
};

export function resolveOutputContractForInference(id: string): OutputContractObject {
	if (!isGenerationArtifactKind(id)) {
		throw new Error(`Unknown output contract: ${id}`);
	}
	const jsonSchema = getJsonSchema(id);
	return {
		kind: "output-contract",
		id,
		owner: "@cx/schema",
		sourceRef: `json-schema/${id}`,
		version: jsonSchema.$id,
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			dtoName: DTO_NAME_BY_ARTIFACT_KIND[id],
			jsonSchema,
		},
	};
}

function isGenerationArtifactKind(id: string): id is GenerationArtifactKind {
	return id in JSON_SCHEMA_BY_ARTIFACT_KIND;
}
