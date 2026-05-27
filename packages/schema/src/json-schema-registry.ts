import type { GenerationArtifactKind } from "./artifact-kind";
import { SCHEMA_VERSION_BY_ARTIFACT_KIND } from "./artifact-kind";

export type JsonSchemaDocument = {
	$schema: "https://json-schema.org/draft/2020-12/schema";
	$id: string;
	additionalProperties: boolean;
	properties: {
		schemaVersion: {
			const: string;
		};
	};
	required: ["schemaVersion"];
	title: string;
	type: "object";
};

export const JSON_SCHEMA_BY_ARTIFACT_KIND = Object.fromEntries(
	Object.entries(SCHEMA_VERSION_BY_ARTIFACT_KIND).map(([kind, version]) => [
		kind,
		createJsonSchema(kind, version),
	]),
) as Record<GenerationArtifactKind, JsonSchemaDocument>;

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
