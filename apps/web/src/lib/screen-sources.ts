import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type ScreenSummary = {
	id: string;
	title: string;
	description?: string;
	route?: string;
	status?: string;
	sourcePath: string;
	type?: string;
};

const MBR_SOURCE_DIR = path.join(process.cwd(), "data/client-imports/{id}/260528_mbr");

export async function listMbrScreenSummaries(): Promise<ScreenSummary[]> {
	const fileNames = await readMarkdownFileNames(MBR_SOURCE_DIR);
	const summaries = await Promise.all(
		fileNames.map(async (fileName) => readScreenSummary(path.join(MBR_SOURCE_DIR, fileName))),
	);

	return summaries.sort((a, b) => a.id.localeCompare(b.id));
}

async function readMarkdownFileNames(dirPath: string): Promise<string[]> {
	try {
		const entries = await readdir(dirPath, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
			.map((entry) => entry.name);
	} catch {
		return [];
	}
}

async function readScreenSummary(filePath: string): Promise<ScreenSummary> {
	const markdown = await readFile(filePath, "utf8");
	const frontmatter = readFrontmatter(markdown);
	const fallbackId = path.basename(filePath, ".md");

	return {
		id: frontmatter["화면 ID"] ?? fallbackId,
		title: frontmatter["화면 명"] ?? fallbackId,
		description: frontmatter["화면 설명"],
		route: frontmatter["화면 경로"],
		sourcePath: filePath,
		status: frontmatter.상태,
		type: frontmatter["구현 유형"],
	};
}

function readFrontmatter(markdown: string): Record<string, string> {
	const match = markdown.match(/^---\n([\s\S]*?)\n---/u);
	if (!match) return {};

	return Object.fromEntries(
		match[1]
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean)
			.flatMap((line) => {
				const separatorIndex = line.indexOf(":");
				if (separatorIndex < 0) return [];
				const key = line.slice(0, separatorIndex).trim();
				const value = line.slice(separatorIndex + 1).trim();
				return key ? [[key, value]] : [];
			}),
	);
}
