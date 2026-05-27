import type { SCHEMA_VERSION } from "./versions";

export type SourceFileKind = "area" | "component" | "screen" | "unknown";

export type SourceSpecFile = {
	areaCode?: string;
	checksum: string;
	id: string;
	kind: SourceFileKind;
	path: string;
	screenCode?: string;
	title: string;
};

export type SourceSpecRegionSlot = "bottom" | "contents" | "header" | "unknown";

export type SourceSpecComponentNode = {
	kind: "component";
	label: string;
	raw?: {
		bindingSource?: string;
		displayText?: string;
		note?: string;
	};
	sourceComponentId: string;
	text?: string;
	variant?: string;
};

export type SourceSpecAreaNode = {
	children: SourceSpecComponentNode[];
	kind: "area";
	sourceAreaId: string;
};

export type SourceSpecRegion = {
	children: SourceSpecAreaNode[];
	slot: SourceSpecRegionSlot;
};

export type SourceSpec = {
	schemaVersion: typeof SCHEMA_VERSION.sourceSpec;
	sourceImport: {
		files: SourceSpecFile[];
		importId: string;
		receivedAt: string;
		sourceKind: "prdd-markdown-bundle";
	};
	sourceShape: {
		screen: {
			name: string;
			regions: SourceSpecRegion[];
			route: string;
			screenCode: string;
		};
	};
};
