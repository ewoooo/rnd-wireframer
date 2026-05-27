import { getJsonSchema, SCHEMA_VERSION, type SourceSpec } from "@cx/schema";
import type { ScreenGenerationAgentInput } from "./types";

export function buildScreenGenerationAgentInput(
	sourceSpec: SourceSpec,
): ScreenGenerationAgentInput {
	const screen = sourceSpec.sourceShape.screen;
	const areaCount = countSourceAreas(sourceSpec);
	const componentIds = listSourceComponentIds(sourceSpec).join(", ");
	const componentCount = listSourceComponentIds(sourceSpec).length;

	return {
		query: [
			"Generate a RenderTree candidate from the provided SourceSpec.",
			"Use only the structured SourceSpec context as the source of truth.",
			"Respect sourceShape.screen.regions: each region contains area nodes, and each area contains component nodes.",
			"Map header, contents, and bottom regions to Screen.Header, Screen.Contents, and Screen.Bottom.",
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
				areaCount,
				componentCount,
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

function countSourceAreas(sourceSpec: SourceSpec): number {
	return sourceSpec.sourceShape.screen.regions.reduce(
		(count, region) => count + region.children.length,
		0,
	);
}

function listSourceComponentIds(sourceSpec: SourceSpec): string[] {
	return sourceSpec.sourceShape.screen.regions.flatMap((region) =>
		region.children.flatMap((area) =>
			area.children.map((component) => component.sourceComponentId),
		),
	);
}
