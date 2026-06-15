export type {
	SourceFileKind,
	SourceSpec,
	SourceSpecAreaNode,
	SourceSpecComponentNode,
	SourceSpecFile,
	SourceSpecRegion,
	SourceSpecRegionSlot,
} from "@cx/schema";

import type { SourceSpec } from "@cx/schema";

/** PRDD JSON 한 화면 입력 — content는 파싱 전 원문 JSON 문자열이다. */
export type ParseJsonSourceBundleInput = {
	content: string;
	importId: string;
	path?: string;
	receivedAt?: string;
};

export type JsonParserIssue = {
	code:
		| "empty-content"
		| "invalid-json"
		| "missing-metadata"
		| "missing-screen-code"
		| "missing-title";
	message: string;
	path?: Array<string | number>;
	severity: "error" | "warning";
};

export type ParseJsonSourceBundleResult =
	| {
			issues: JsonParserIssue[];
			ok: true;
			sourceSpec: SourceSpec;
	  }
	| {
			issues: JsonParserIssue[];
			ok: false;
			sourceSpec?: SourceSpec;
	  };
