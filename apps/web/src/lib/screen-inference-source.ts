import path from "node:path";

export type UploadedScreenSource = {
	batchId: string;
	importId: string;
	path: string;
	screenId: string;
	type: "file";
};

export type ScreenSourceTarget = UploadedScreenSource & {
	absolutePath: string;
	directoryPath: string;
};

const DEFAULT_IMPORT_ID = "web-upload";
const MAX_PATH_PART_LENGTH = 80;

export function createBatchId(date = new Date()): string {
	return date.toISOString().slice(0, 10).replaceAll("-", "");
}

export function createScreenSourceTarget(input: {
	batchId?: string;
	clientImportRoot: string;
	fileName: string;
	importId?: string;
	repoRoot: string;
}): ScreenSourceTarget {
	const importId = sanitizePathPart(input.importId ?? DEFAULT_IMPORT_ID) || DEFAULT_IMPORT_ID;
	const fallbackBatchId = createBatchId();
	const batchId = sanitizePathPart(input.batchId ?? fallbackBatchId) || fallbackBatchId;
	const screenId = readScreenIdFromFileName(input.fileName);
	const directoryPath = path.join(input.clientImportRoot, importId, batchId);
	const absolutePath = path.join(directoryPath, `${screenId}.md`);

	return {
		absolutePath,
		batchId,
		directoryPath,
		importId,
		path: normalizePath(path.relative(input.repoRoot, absolutePath)),
		screenId,
		type: "file",
	};
}

export function isMarkdownSourceFileName(fileName: string): boolean {
	return /\.md$/i.test(fileName);
}

export function readScreenIdFromFileName(fileName: string): string {
	const withoutExtension = fileName.replace(/\.md$/i, "");
	return sanitizePathPart(withoutExtension) || "screen-source";
}

export function sanitizePathPart(value: string): string {
	return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, MAX_PATH_PART_LENGTH);
}

function normalizePath(value: string): string {
	return value.replaceAll(path.sep, "/");
}
