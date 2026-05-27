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

export type SourceSpecArea = {
	name: string;
	slotHint: "bottom" | "contents" | "header" | "unknown";
	sourceAreaNo: number;
};

export type SourceSpecComponent = {
	label: string;
	sourceAreaNo?: number;
	sourceComponentId: string;
	text?: string;
	variant?: string;
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
		components: SourceSpecComponent[];
		screen: {
			areas: SourceSpecArea[];
			name: string;
			route: string;
			screenCode: string;
		};
	};
};
