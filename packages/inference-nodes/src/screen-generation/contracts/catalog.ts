import type { SourceSpec } from "@cx/schema";

export type SourceReferenceCatalogEntry = {
	componentType?: string;
	description?: string;
	label: string;
	props?: Record<string, string | number | boolean>;
	refs: string[];
	region: SourceSpec["sourceShape"]["screen"]["regions"][number]["slot"];
	raw?: SourceSpec["sourceShape"]["screen"]["regions"][number]["children"][number]["children"][number]["raw"];
	roleAlias?: string;
	sourceAreaId: string;
	sourceAreaName?: string;
	sourceComponentId: string;
	sourceId: string;
	variant?: string;
};

export type SourceReferenceCatalog = {
	allowedRefs: string[];
	entries: SourceReferenceCatalogEntry[];
};

export type ComponentContractCatalogEntry = {
	componentType: string;
	layoutCandidates: string[];
	props: Record<
		string,
		{
			required?: boolean;
			role?: string;
			type: string;
			values?: readonly string[];
		}
	>;
	sourceRefs: string[];
};

/**
 * A catalog component the agent MAY use that is not tied to a source ref.
 * Exposure is independent of status; `status` only marks stability (candidate is flagged).
 */
export type ComponentContractAvailableEntry = {
	componentType: string;
	status: "candidate" | "stable";
	props: ComponentContractCatalogEntry["props"];
};

export type ComponentContractCatalog = {
	/** Registry components beyond the source refs, each tagged with status. */
	available?: ComponentContractAvailableEntry[];
	entries: ComponentContractCatalogEntry[];
};
