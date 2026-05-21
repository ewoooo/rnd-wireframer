import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDatabaseDir } from "@/data/database-paths";

const CLIENT_IMPORTS_DIR = path.join(getDatabaseDir(), "client-imports");

export async function POST(request: Request) {
	const formData = await request.formData();
	const paths = parseUploadPaths(formData.get("paths"));
	const files = formData.getAll("files").filter(isFile);

	if (files.length === 0) {
		return NextResponse.json({ error: "No files were uploaded." }, { status: 400 });
	}

	const firstPath = paths[0] ?? files[0]?.name ?? "client-import";
	const sourceRoot = getSourceRoot(firstPath);
	const requestedImportId = getTextField(formData.get("importId")) || sourceRoot || "client-import";
	const importId = await getUniqueImportId(sanitizeSegment(requestedImportId));
	const importDir = path.join(CLIENT_IMPORTS_DIR, importId);
	let writtenFiles = 0;

	for (const [index, file] of files.entries()) {
		const uploadPath = paths[index] ?? file.name;
		const relativePath = getSafeImportRelativePath(uploadPath, sourceRoot);
		if (!relativePath?.endsWith(".md")) continue;

		const targetPath = path.join(importDir, relativePath);
		if (!isInsideDirectory(importDir, targetPath)) continue;

		await mkdir(path.dirname(targetPath), { recursive: true });
		await writeFile(targetPath, Buffer.from(await file.arrayBuffer()));
		writtenFiles += 1;
	}

	if (writtenFiles === 0) {
		return NextResponse.json(
			{ error: "No markdown files were found in the uploaded folder." },
			{ status: 400 },
		);
	}

	const [screenFiles, organismFiles] = await Promise.all([
		countMarkdownFiles(path.join(importDir, "screen")),
		countMarkdownFiles(path.join(importDir, "organism")),
	]);

	return NextResponse.json({
		import: {
			id: importId,
			screenFiles,
			organismFiles,
		},
		writtenFiles,
	});
}

function parseUploadPaths(value: FormDataEntryValue | null) {
	if (typeof value !== "string") return [];

	try {
		const parsed = JSON.parse(value) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item): item is string => typeof item === "string");
	} catch {
		return [];
	}
}

function getTextField(value: FormDataEntryValue | null) {
	return typeof value === "string" ? value.trim() : "";
}

function getSourceRoot(uploadPath: string) {
	const [firstSegment] = uploadPath.split(/[\\/]/).filter(Boolean);
	return firstSegment ? sanitizeSegment(firstSegment) : "";
}

function getSafeImportRelativePath(uploadPath: string, sourceRoot: string) {
	const segments = uploadPath
		.split(/[\\/]/)
		.map((segment) => sanitizeSegment(segment))
		.filter(Boolean);

	if (segments[0] === sourceRoot) {
		segments.shift();
	}

	const sourceFolderIndex = segments.findIndex(
		(segment) => segment === "screen" || segment === "organism",
	);
	const relativeSegments = sourceFolderIndex >= 0 ? segments.slice(sourceFolderIndex) : segments;

	return relativeSegments.length > 0 ? path.join(...relativeSegments) : "";
}

function sanitizeSegment(value: string) {
	return value
		.trim()
		.replace(/^\.+$/, "")
		.replace(/[^\w가-힣.-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

async function getUniqueImportId(baseId: string) {
	const safeBaseId = baseId || "client-import";
	const entries = await readdir(CLIENT_IMPORTS_DIR, { withFileTypes: true }).catch(() => []);
	const existingIds = new Set(
		entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
	);

	if (!existingIds.has(safeBaseId)) return safeBaseId;

	let index = 2;
	while (existingIds.has(`${safeBaseId}-${index}`)) {
		index += 1;
	}
	return `${safeBaseId}-${index}`;
}

async function countMarkdownFiles(directory: string) {
	const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
	return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).length;
}

function isInsideDirectory(parentDirectory: string, targetPath: string) {
	const relativePath = path.relative(parentDirectory, targetPath);
	return relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function isFile(value: FormDataEntryValue): value is File {
	return typeof value === "object" && "arrayBuffer" in value && "name" in value;
}
