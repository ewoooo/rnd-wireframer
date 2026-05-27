import type {
	ComponentCatalog,
	ComponentCatalogEntry,
	InternalComponentCatalog,
} from "../public/types";

export function assembleComponentCatalog(registry: InternalComponentCatalog): ComponentCatalog {
	return Object.fromEntries(
		Object.entries(registry).map(([type, entry]) => [type, toPublicCatalogEntry(entry)]),
	);
}

function toPublicCatalogEntry(entry: ComponentCatalogEntry): ComponentCatalogEntry {
	const { type, source, version, description, usage, aliases, kind, props, tokens } = entry;
	return {
		type,
		source,
		version,
		...(description ? { description } : {}),
		...(usage ? { usage } : {}),
		...(aliases ? { aliases } : {}),
		...(kind ? { kind } : {}),
		props,
		...(tokens ? { tokens } : {}),
	};
}
