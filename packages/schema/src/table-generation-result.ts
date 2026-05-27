import type { SCHEMA_VERSION } from "./versions";

export type TablePatternRef = {
	id: string;
	variant?: string;
};

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
	metadata: Pick<TableGenerationMetadata, "title">;
	pattern: TablePatternRef;
	type: "Screen.Header" | "Screen.Contents" | "Screen.Bottom";
};

export type TableGenerationScreen = {
	id: string;
	metadata: TableGenerationMetadata;
	minRendererVersion?: string;
	pattern: TablePatternRef;
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
	metadata: TableGenerationMetadata;
	pattern: TablePatternRef;
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
	metadata: TableGenerationMetadata;
	pattern: TablePatternRef;
	type: string;
	version: string;
};

export type TableGenerationResultContract = {
	areas: TableGenerationArea[];
	components: TableGenerationComponent[];
	schemaVersion: typeof SCHEMA_VERSION.tableGenerationResult;
	screen: TableGenerationScreen;
};
