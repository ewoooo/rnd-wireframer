import type {
	ComponentCatalog,
	ComponentCatalogStatus,
	InternalComponentCatalog,
} from "../public/types";
import { candidateCatalogEntries } from "./candidate-entries";
import { componentCatalogEntries } from "./component-entries";

export function withStatus(
	entries: ComponentCatalog,
	status: ComponentCatalogStatus,
): InternalComponentCatalog {
	return Object.fromEntries(
		Object.entries(entries).map(([type, entry]) => [type, { ...entry, status }]),
	);
}

export const componentRegistryEntries = withStatus(componentCatalogEntries, "stable");
export const candidateRegistryEntries = withStatus(candidateCatalogEntries, "candidate");

export const internalComponentCatalog = {
	...componentRegistryEntries,
	...candidateRegistryEntries,
} satisfies InternalComponentCatalog;
