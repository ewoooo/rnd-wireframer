import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type UploadedScreenSource = {
	batchId: string;
	importId: string;
	latestRunId?: string;
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
	const absolutePath = path.join(directoryPath, `${screenId}${readSourceExtension(input.fileName)}`);

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

/** 지원 소스 확장자 — Markdown과 PRDD JSON. */
const SOURCE_FILE_EXTENSION_PATTERN = /\.(md|json)$/i;

export function isSupportedSourceFileName(fileName: string): boolean {
	return SOURCE_FILE_EXTENSION_PATTERN.test(fileName);
}

/** 업로드 파일명에서 원본 확장자(.md/.json)를 보존한다. 미지정이면 .md로 둔다. */
export function readSourceExtension(fileName: string): string {
	const match = fileName.match(SOURCE_FILE_EXTENSION_PATTERN);
	return match ? `.${match[1]?.toLowerCase()}` : ".md";
}

export function readScreenIdFromFileName(fileName: string): string {
	const withoutExtension = fileName.replace(SOURCE_FILE_EXTENSION_PATTERN, "");
	return sanitizePathPart(withoutExtension) || "screen-source";
}

export function sanitizePathPart(value: string): string {
	return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, MAX_PATH_PART_LENGTH);
}

export async function listUploadedScreenSources(input: {
	clientImportRoot: string;
	importIds?: string[];
	repoRoot: string;
	runRoot: string;
}): Promise<UploadedScreenSource[]> {
	const allowedImportIds = input.importIds ? new Set(input.importIds) : undefined;
	const [sourceFiles, latestRunIdBySourcePath] = await Promise.all([
		listSupportedSourceFiles(input.clientImportRoot),
		readLatestRunIdBySourcePath({
			repoRoot: input.repoRoot,
			runRoot: input.runRoot,
		}),
	]);

	return sourceFiles
		.map((filePath) => {
			const relativePath = normalizePath(path.relative(input.repoRoot, filePath));
			const relativeParts = normalizePath(path.relative(input.clientImportRoot, filePath)).split(
				"/",
			);
			const [importId = "", batchId = ""] = relativeParts;

			return {
				batchId,
				importId,
				latestRunId: latestRunIdBySourcePath.get(relativePath),
				path: relativePath,
				screenId: readScreenIdFromFileName(path.basename(filePath)),
				type: "file" as const,
			};
		})
		.filter((source) => !allowedImportIds || allowedImportIds.has(source.importId))
		.sort((first, second) => second.path.localeCompare(first.path));
}

function normalizePath(value: string): string {
	return value.replaceAll(path.sep, "/");
}

async function listSupportedSourceFiles(rootDir: string): Promise<string[]> {
	const entries = await readDirectorySafe(rootDir);
	const results: string[] = [];

	for (const entry of entries) {
		const entryPath = path.join(rootDir, entry.name);
		if (entry.isDirectory()) {
			results.push(...(await listSupportedSourceFiles(entryPath)));
			continue;
		}
		if (entry.isFile() && isSupportedSourceFileName(entry.name)) {
			results.push(entryPath);
		}
	}

	return results;
}

async function readDirectorySafe(dirPath: string) {
	try {
		return await readdir(dirPath, { withFileTypes: true });
	} catch (error) {
		if (isNodeError(error) && error.code === "ENOENT") return [];
		throw error;
	}
}

async function readLatestRunIdBySourcePath(input: {
	repoRoot: string;
	runRoot: string;
}): Promise<Map<string, string>> {
	const runDirs = await readDirectorySafe(input.runRoot);
	const entries: Array<{ createdAt: string; runId: string; sourcePath: string }> = [];

	for (const entry of runDirs) {
		if (!entry.isDirectory()) continue;
		const manifest = await readJsonFileSafe<{
			createdAt?: unknown;
			runId?: unknown;
			sourcePath?: unknown;
		}>(path.join(input.runRoot, entry.name, "manifest.json"));
		if (typeof manifest?.sourcePath !== "string") continue;
		entries.push({
			createdAt: typeof manifest.createdAt === "string" ? manifest.createdAt : "",
			runId: typeof manifest.runId === "string" ? manifest.runId : entry.name,
			sourcePath: normalizePath(
				path.relative(input.repoRoot, path.resolve(input.repoRoot, manifest.sourcePath)),
			),
		});
	}

	entries.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
	const latestRunIdBySourcePath = new Map<string, string>();
	for (const entry of entries) {
		if (!latestRunIdBySourcePath.has(entry.sourcePath)) {
			latestRunIdBySourcePath.set(entry.sourcePath, entry.runId);
		}
	}
	return latestRunIdBySourcePath;
}

async function readJsonFileSafe<T>(filePath: string): Promise<T | undefined> {
	try {
		return JSON.parse(await readFile(filePath, "utf8")) as T;
	} catch (error) {
		if (isNodeError(error) && error.code === "ENOENT") return undefined;
		throw error;
	}
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}
