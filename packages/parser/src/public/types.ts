import type { parserBoundary } from "./contract";

export type ParserBoundary = typeof parserBoundary;
export type ParserBoundaryName = ParserBoundary["name"];
export type ParserOperation = ParserBoundary["owns"][number];
export type ParserPackageName = ParserBoundary["packageName"];

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
	schemaVersion: "generation-v2.source-spec.v0.1";
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

export type MarkdownSourceFileInput = {
	areaCode?: string;
	content: string;
	id?: string;
	kind?: SourceFileKind;
	path: string;
	screenCode?: string;
	title?: string;
};

export type ParseMarkdownSourceBundleInput = {
	files: MarkdownSourceFileInput[];
	importId: string;
	receivedAt?: string;
};

export type ParserIssue = {
	code: "empty-content" | "missing-screen-source" | "missing-title";
	message: string;
	path?: Array<string | number>;
	severity: "error" | "warning";
};

export type ParseMarkdownSourceBundleResult =
	| {
			issues: ParserIssue[];
			ok: true;
			sourceSpec: SourceSpec;
	  }
	| {
			issues: ParserIssue[];
			ok: false;
			sourceSpec?: SourceSpec;
	  };
