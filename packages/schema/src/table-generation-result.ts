import type { SCHEMA_VERSION } from "./versions";

export type TableChildRef = {
	id: string;
	kind: "area" | "component";
};

export type TableGenerationMetadata = {
	author?: string;
	createdAt?: string;
	description?: string;
	title: string;
	updatedAt?: string;
};

export type TableGenerationRegion = {
	children: TableChildRef[];
	layout: string;
	metadata: Pick<TableGenerationMetadata, "title">;
	type: "Screen.Header" | "Screen.Contents" | "Screen.Bottom";
};

export type TableGenerationScreen = {
	id: string;
	metadata: TableGenerationMetadata;
	minRendererVersion?: string;
	layout: string;
	screen: {
		regions: {
			bottom: TableGenerationRegion;
			contents: TableGenerationRegion;
			header: TableGenerationRegion;
		};
		type: "screen.page";
	};
	screenVariantId: string;
	version: string;
};

export type TableGenerationArea = {
	children: TableChildRef[];
	id: string;
	layout: string;
	metadata: TableGenerationMetadata;
	props?: Record<string, unknown>;
	type: "area.dynamic" | "area.static";
	version: string;
};

export type TableGenerationComponentChild = {
	component: {
		type: string;
		variant?: string;
	};
	props?: Record<string, unknown>;
};

export type TableGenerationComponent = {
	children: TableGenerationComponentChild[];
	hooks?: unknown[];
	id: string;
	layout: string;
	metadata: TableGenerationMetadata;
	type: string;
	version: string;
};

export type TableGenerationResultContract = {
	areas: TableGenerationArea[];
	components: TableGenerationComponent[];
	schemaVersion: typeof SCHEMA_VERSION.tableGenerationResult;
	screen: TableGenerationScreen;
};
