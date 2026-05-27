import { getJsonSchema, SCHEMA_VERSION, type SourceSpec } from "@cx/schema";
import type { ScreenGenerationAgentInput } from "./types";

export function buildScreenGenerationAgentInput(
	sourceSpec: SourceSpec,
): ScreenGenerationAgentInput {
	const screen = sourceSpec.sourceShape.screen;
	const componentIds = sourceSpec.sourceShape.components
		.map((component) => component.sourceComponentId)
		.join(", ");

	return {
		query: [
			"Generate a RenderTree candidate from the provided SourceSpec.",
			"Use only the structured SourceSpec context as the source of truth.",
			`Use RenderTree contract version: ${SCHEMA_VERSION.renderTree}.`,
			"Return one JSON object only. It must match context.targetArtifact.jsonSchema.",
			"Use top-level version, metadata, and children. Do not use contractVersion, schemaVersion, root, tree, nodeId, or componentId.",
			"Top-level metadata must not include title. Every render node metadata must include id and title.",
			"Put component-specific values inside node.props.",
			`Screen: ${screen.screenCode} / ${screen.name}`,
			`Route: ${screen.route}`,
			`Components: ${componentIds || "none"}`,
		].join("\n"),
		context: {
			sourceSpec,
			sourceSummary: {
				areaCount: screen.areas.length,
				componentCount: sourceSpec.sourceShape.components.length,
				route: screen.route,
				screenCode: screen.screenCode,
				screenName: screen.name,
			},
			targetArtifact: {
				jsonSchema: getJsonSchema("render-tree"),
				kind: "render-tree",
				schemaVersion: SCHEMA_VERSION.renderTree,
			},
		},
	};
}
