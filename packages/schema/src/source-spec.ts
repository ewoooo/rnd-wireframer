import type { RenderTreeAreaNodeType } from "./render-tree";
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
	componentType?: string;
	description?: string;
	kind: "component";
	label: string;
	props?: Record<string, string | number | boolean>;
	raw?: {
		bindingSource?: string;
		description?: string;
		displayText?: string;
		note?: string;
		propsText?: string;
	};
	roleAlias?: string;
	sourceComponentId: string;
	sourceId?: string;
	text?: string;
	variant?: string;
};

export type SourceSpecAreaNode = {
	areaType?: "dynamic" | "static";
	children: SourceSpecComponentNode[];
	description?: string;
	errorPolicy?: string;
	kind: "area";
	layout?: string;
	maxCount?: string;
	minCount?: string;
	renderNodeType?: RenderTreeAreaNodeType;
	sourceAreaId: string;
	sourceAreaName?: string;
	visibility?: string;
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
		sourceKind: "json" | "markdown";
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
