import type { SourceSpec } from "@cx/schema";
import type { SourceReferenceCatalog } from "./types";

/**
 * Builds the compact source summary shared by orchestration agent inputs.
 * This is deterministic context extraction only; it does not infer screen intent.
 */
export function createSourceSummary(sourceSpec: SourceSpec) {
	const screen = sourceSpec.sourceShape.screen;

	return {
		areaCount: countSourceAreas(sourceSpec),
		componentCount: listSourceComponentIds(sourceSpec).length,
		route: screen.route,
		screenCode: screen.screenCode,
		screenName: screen.name,
	};
}

/**
 * Lists SourceSpec component refs in source order for prompt traceability.
 * The values are evidence ids, not renderer component contracts.
 */
export function listSourceComponentIds(sourceSpec: SourceSpec): string[] {
	return sourceSpec.sourceShape.screen.regions.flatMap((region) =>
		region.children.flatMap((area) =>
			area.children.map((component) => component.sourceId ?? component.sourceComponentId),
		),
	);
}

/**
 * Builds the only source-ref vocabulary agents may cite in generated artifacts.
 * Keeping this catalog deterministic prevents invented refs from becoming hidden contracts.
 */
export function buildSourceReferenceCatalog(sourceSpec: SourceSpec): SourceReferenceCatalog {
	const entries = sourceSpec.sourceShape.screen.regions.flatMap((region) =>
		region.children.flatMap((area) =>
			area.children.map((component) => {
				const sourceId = component.sourceId ?? component.sourceComponentId;
				const refs = uniqueStrings([
					sourceId,
					component.roleAlias,
					component.sourceComponentId,
					component.componentType,
				]);

				return {
					componentType: component.componentType ?? component.sourceComponentId,
					label: component.label,
					description: component.description,
					props: component.props,
					refs,
					region: region.slot,
					raw: component.raw,
					roleAlias: component.roleAlias,
					sourceAreaId: area.sourceAreaId,
					sourceAreaName: area.sourceAreaName,
					sourceComponentId: component.sourceComponentId,
					sourceId,
					variant: component.variant,
				};
			}),
		),
	);
	const areaRefs = sourceSpec.sourceShape.screen.regions.flatMap((region) =>
		region.children.flatMap((area) => [area.sourceAreaId, area.sourceAreaName]),
	);

	return {
		allowedRefs: uniqueStrings([
			sourceSpec.sourceShape.screen.screenCode,
			sourceSpec.sourceShape.screen.route,
			...areaRefs,
			...entries.flatMap((entry) => entry.refs),
		]),
		entries,
	};
}

function countSourceAreas(sourceSpec: SourceSpec): number {
	return sourceSpec.sourceShape.screen.regions.reduce(
		(count, region) => count + region.children.length,
		0,
	);
}

function uniqueStrings(values: Array<string | undefined>): string[] {
	return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
