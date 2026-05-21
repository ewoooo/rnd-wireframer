import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDatabaseDir } from "@/data/database-paths";

const CLIENT_IMPORTS_DIR = path.join(getDatabaseDir(), "client-imports");

export async function GET() {
	const entries = await readdir(CLIENT_IMPORTS_DIR, { withFileTypes: true }).catch(() => []);
	const imports = await Promise.all(
		entries
			.filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
			.map(async (entry) => {
				const importDir = path.join(CLIENT_IMPORTS_DIR, entry.name);
				const [screenFiles, organismFiles] = await Promise.all([
					countMarkdownFiles(path.join(importDir, "screen")),
					countMarkdownFiles(path.join(importDir, "organism")),
				]);

				return {
					id: entry.name,
					screenFiles,
					organismFiles,
				};
			}),
	);

	return NextResponse.json({ imports });
}

async function countMarkdownFiles(directory: string) {
	const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
	return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).length;
}
