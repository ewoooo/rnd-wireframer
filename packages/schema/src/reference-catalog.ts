import type { SsotObject } from "./inference-reference";

export type ReferenceCatalogEntry = {
	id: string;
	situation: string;
	tags: string[];
	sotNodeRef?: string;
	sourceRef: string;
};

export type ReferenceCatalogDocument = ReferenceCatalogEntry & {
	body?: string;
};

export type ReferenceCatalogData = {
	category: string;
	mode: "catalog" | "index";
	documents: ReferenceCatalogDocument[];
};

export type ReferenceCatalogObject = SsotObject<"reference-catalog", ReferenceCatalogData>;
