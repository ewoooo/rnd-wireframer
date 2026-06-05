import { assembleComponentCatalog } from "../internal/assembly";
import { internalComponentCatalog } from "../internal/registry";
import type { ComponentCatalogEntry, ComponentCatalogStatus, ComponentPropContract } from "./types";

const componentCatalogForResolver = assembleComponentCatalog(internalComponentCatalog);

export type ComponentCatalogType = keyof typeof componentCatalogForResolver;

const componentCatalogEntries = Object.entries(componentCatalogForResolver) as Array<
	[ComponentCatalogType, ComponentCatalogEntry]
>;

export const componentCatalogAliases = componentCatalogEntries.reduce<
	Record<string, ComponentCatalogType>
>((aliases, [type, entry]) => {
	for (const alias of entry.aliases ?? []) {
		aliases[alias] = type;
	}
	return aliases;
}, {});

export function getComponentCatalogEntry(type: string): ComponentCatalogEntry | undefined {
	const canonicalType = componentCatalogForResolver[type as ComponentCatalogType]
		? (type as ComponentCatalogType)
		: componentCatalogAliases[type];

	if (!canonicalType) return undefined;
	return componentCatalogForResolver[canonicalType];
}

export function getComponentPropContract(
	type: string,
	propName: string,
): ComponentPropContract | undefined {
	return getComponentCatalogEntry(type)?.props[propName];
}

export function getComponentCatalogTypes(): ComponentCatalogType[] {
	return Object.keys(componentCatalogForResolver).sort() as ComponentCatalogType[];
}

/** Status (stable | candidate) of a catalog type, resolving aliases. */
export function getComponentCatalogStatus(type: string): ComponentCatalogStatus | undefined {
	const canonicalType = componentCatalogForResolver[type as ComponentCatalogType]
		? (type as ComponentCatalogType)
		: componentCatalogAliases[type];
	if (!canonicalType) return undefined;
	return internalComponentCatalog[canonicalType]?.status;
}

/** Public catalog entries currently staged as candidates (not yet promoted to stable). */
export function listCandidateComponentEntries(): ComponentCatalogEntry[] {
	return Object.values(internalComponentCatalog)
		.filter((entry) => entry.status === "candidate")
		.map((entry) => componentCatalogForResolver[entry.type as ComponentCatalogType]);
}
