import {
	type ComponentCatalogEntry,
	type ComponentCatalogObject,
	type ComponentCatalogStatus,
	SSOT_OBJECT_SCHEMA_VERSION,
} from "@cx/schema";
import { externalCatalog } from "./catalog.generated";

export const componentCatalog = externalCatalog;

export function getComponentCatalogEntry(type: string): ComponentCatalogEntry | undefined {
	return externalCatalog[type];
}

export function getComponentCatalogTypes(): string[] {
	return Object.keys(externalCatalog).sort();
}

/** source(barrel/draft)에서 status(stable/candidate)를 유도한다. */
export function getComponentCatalogStatus(type: string): ComponentCatalogStatus | undefined {
	const entry = getComponentCatalogEntry(type);
	if (!entry) return undefined;
	return entry.source === "kiki-barrel" ? "stable" : "candidate";
}

/** candidate = kiki-draft 엔트리. */
export function listCandidateComponentEntries(): ComponentCatalogEntry[] {
	return Object.values(externalCatalog).filter((entry) => entry.source === "kiki-draft");
}

export function resolveComponentCatalogForInference(): ComponentCatalogObject {
	return {
		kind: "component-catalog",
		id: "default",
		owner: "@cx/external",
		sourceRef: "catalog",
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			entries: Object.values(externalCatalog),
		},
	};
}
