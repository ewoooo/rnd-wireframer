import type { SourceSpec } from "@cx/parser/types";
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
			"Return JSON only.",
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
		},
	};
}
