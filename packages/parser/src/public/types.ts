import type { parserBoundary } from "./contract";

export type {
	SourceFileKind,
	SourceSpec,
	SourceSpecArea,
	SourceSpecComponent,
	SourceSpecFile,
} from "@cx/schema";

import type { SourceFileKind, SourceSpec } from "@cx/schema";

export type ParserBoundary = typeof parserBoundary;
export type ParserBoundaryName = ParserBoundary["name"];
export type ParserOperation = ParserBoundary["owns"][number];
export type ParserPackageName = ParserBoundary["packageName"];

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
