import type { ParseMarkdownSourceBundleResult } from "@cx/adapters/markdown";
import { parseMarkdownSourceBundle } from "@cx/adapters/markdown";
import type { PipelineMarkdownSourceFile } from "../public/types";

export type ParseMarkdownSourceCommand = {
	files: PipelineMarkdownSourceFile[];
	importId: string;
	receivedAt?: string;
};

export type ParseMarkdownSourceCommandResult = {
	ok: boolean;
	operation: "markdown-source-parse-command";
	parseResult: ParseMarkdownSourceBundleResult;
};

export function runParseMarkdownSourceCommand(
	command: ParseMarkdownSourceCommand,
): ParseMarkdownSourceCommandResult {
	const parseResult = parseMarkdownSourceBundle(command);

	return {
		operation: "markdown-source-parse-command",
		ok: parseResult.ok,
		parseResult,
	};
}
