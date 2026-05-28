import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { RenderTreeScreenNode } from "@cx/renderer";
import { materializeTableScreen, type TableScreenData } from "@cx/table-materializer";

export type ScreenSummary = {
	id: string;
	title: string;
	description?: string;
	moduleId?: string;
	order?: number;
	renderTree?: RenderTreeScreenNode;
	route?: string;
	screenRouteId?: string;
	screenVariantId?: string;
	screenVariantName?: string;
	screenVariantOrder?: number;
	status?: string;
	sourcePath: string;
	type?: string;
	variantType?: string;
};

const MBR_SOURCE_DIR = path.join(process.cwd(), "data/client-imports/{id}/260528_mbr");
const PRDD_SOURCE_DIR = path.join(process.cwd(), "data/client-imports/{id}/260527_prdd");
const TABLES_DIR = path.join(process.cwd(), "data/tables");
const MODULE_SORT_ORDER: Record<string, number> = {
	preview: 0,
	mbr: 1,
};

export async function listMbrScreenSummaries(): Promise<ScreenSummary[]> {
	const tableSummaries = await readTableScreenSummaries(TABLES_DIR);
	if (tableSummaries.length > 0) return tableSummaries;

	const sourceDirs = [PRDD_SOURCE_DIR, MBR_SOURCE_DIR];
	const summariesByDir = await Promise.all(
		sourceDirs.map(async (sourceDir) => {
			const fileNames = await readMarkdownFileNames(sourceDir);
			return Promise.all(
				fileNames.map((fileName) => readScreenSummary(path.join(sourceDir, fileName))),
			);
		}),
	);

	return summariesByDir.flat().sort(compareScreenSummary);
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

async function readTableScreenSummaries(tablesDir: string): Promise<ScreenSummary[]> {
	try {
		const [tables, routeTable, variantTable] = await Promise.all([
			readTableData(tablesDir),
			readJson<{ screenRoutes: TableScreenRoute[] }>(path.join(tablesDir, "screen_routes.json")),
			readJson<{ screenVariants: TableScreenVariant[] }>(
				path.join(tablesDir, "screen_variants.json"),
			),
		]);
		const routeById = new Map(routeTable.screenRoutes.map((route) => [route.id, route]));
		const variantById = new Map(
			variantTable.screenVariants.map((variant) => [variant.id, variant]),
		);

		return tables.screens.screens
			.map((screen) => {
				const tableScreen = screen as unknown as TableScreenMetadata;
				const variant = variantById.get(tableScreen.screenVariantId);
				const route = routeById.get(variant?.screenRouteId ?? "");

				return {
					id: screen.id,
					title: screen.metadata?.title ?? screen.id,
					description: screen.metadata?.description,
					moduleId: route?.moduleId,
					order: tableScreen.order,
					renderTree: materializeTableScreen({ screen, tables }),
					route: route?.name,
					screenRouteId: variant?.screenRouteId,
					screenVariantId: tableScreen.screenVariantId,
					screenVariantName: variant?.name,
					screenVariantOrder: variant?.order,
					sourcePath: path.join(tablesDir, "screens.json"),
					status: "table",
					type: readScreenKind(screen.id),
					variantType: variant?.variantType,
				};
			})
			.sort(compareScreenSummary);
	} catch {
		return [];
	}
}

async function readTableData(tablesDir: string): Promise<TableScreenData> {
	const [screens, areas, components] = await Promise.all([
		readJson<TableScreenData["screens"]>(path.join(tablesDir, "screens.json")),
		readJson<TableScreenData["areas"]>(path.join(tablesDir, "areas.json")),
		readJson<TableScreenData["components"]>(path.join(tablesDir, "components.json")),
	]);

	return { areas, components, screens };
}

async function readJson<T>(filePath: string): Promise<T> {
	return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function compareScreenSummary(left: ScreenSummary, right: ScreenSummary) {
	return (
		readModuleSortOrder(left.moduleId) - readModuleSortOrder(right.moduleId) ||
		(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
		left.id.localeCompare(right.id)
	);
}

function readModuleSortOrder(moduleId?: string) {
	return MODULE_SORT_ORDER[moduleId ?? ""] ?? Number.MAX_SAFE_INTEGER;
}

function readScreenKind(screenId: string): string | undefined {
	return screenId.split("-")[2];
}

type TableScreenRoute = {
	id: string;
	moduleId?: string;
	name: string;
	order?: number;
};

type TableScreenVariant = {
	id: string;
	name: string;
	order?: number;
	screenRouteId: string;
	variantType?: string;
};

type TableScreenMetadata = {
	order?: number;
	screenVariantId: string;
};
