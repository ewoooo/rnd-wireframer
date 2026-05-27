import type {
	DatabaseAreaRow,
	DatabaseComponentRow,
	DatabaseScreenRouteRow,
	DatabaseScreenRow,
	DatabaseScreenVariantRow,
} from "./database-tables";

export type DraftTablesBundle = {
	screenRoutes: DatabaseScreenRouteRow[];
	screenVariants: DatabaseScreenVariantRow[];
	screens: DatabaseScreenRow[];
	areas: DatabaseAreaRow[];
	components: DatabaseComponentRow[];
	warnings?: string[];
};

export type DraftTablesSource = {
	importJobId?: string;
	sourceKind: "prdd" | "read-model" | "manual";
	sourceId?: string;
	generatedAt: string;
};

export type DraftTablesArtifact = {
	schemaVersion: "draft-tables.v1";
	source: DraftTablesSource;
	tables: DraftTablesBundle;
};
