import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseMarkdownSourceBundle } from "@cx/adapters/markdown";
import type { SourceSpec } from "@cx/schema";
import { CLIENT_IMPORT_ROOT, REPO_ROOT } from "@/lib/server-paths";

export type SourceFileInput = {
	path: string;
};

export type PreparedSourceFile = {
	rawMarkdown: string;
	source: SourceFileInput;
	sourceSpec: SourceSpec;
};

export async function prepareSourceFile(input: unknown): Promise<PreparedSourceFile | undefined> {
	const source = readSourceFileInput(input);
	if (!source) return undefined;

	const absolutePath = resolveClientImportMarkdownPath(source.path);
	const rawMarkdown = await readFile(absolutePath, "utf8");
	const relativePath = normalizePath(path.relative(REPO_ROOT, absolutePath));
	const result = parseMarkdownSourceBundle({
		files: [
			{
				content: rawMarkdown,
				kind: "screen",
				path: relativePath,
			},
		],
		importId: readImportIdFromPath(absolutePath),
		receivedAt: new Date().toISOString(),
	});

	if (!result.ok || !result.sourceSpec) {
		const message = result.issues.map((issue) => issue.message).join("; ");
		throw new Error(message || "Failed to parse source markdown.");
	}

	return {
		rawMarkdown,
		source: { path: relativePath },
		sourceSpec: result.sourceSpec,
	};
}

function readSourceFileInput(input: unknown): SourceFileInput | undefined {
	if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
	const source = "source" in input ? (input as Record<string, unknown>).source : undefined;
	if (!source || typeof source !== "object" || Array.isArray(source)) return undefined;
	const sourcePath = (source as Record<string, unknown>).path;
	return typeof sourcePath === "string" && sourcePath ? { path: sourcePath } : undefined;
}

function resolveClientImportMarkdownPath(sourcePath: string): string {
	const absolutePath = path.resolve(REPO_ROOT, sourcePath);
	const relativePath = path.relative(CLIENT_IMPORT_ROOT, absolutePath);

	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		throw new Error("source.path must be under data/client-imports/.");
	}
	if (!/\.md$/i.test(absolutePath)) {
		throw new Error("source.path must point to a Markdown file.");
	}

	return absolutePath;
}

function readImportIdFromPath(absolutePath: string): string {
	const relativeParts = normalizePath(path.relative(CLIENT_IMPORT_ROOT, absolutePath)).split("/");
	return relativeParts[0] || "web-upload";
}

function normalizePath(value: string): string {
	return value.replaceAll(path.sep, "/");
}
