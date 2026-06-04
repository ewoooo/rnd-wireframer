import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	canonicalizeRenderProjection,
	type RenderDbRow,
	type RenderProjection,
} from "./render-db-canonical";

type CliOptions = {
	envFile: string;
	outFile?: string;
	reportFile?: string;
	write: boolean;
};

const DEFAULT_ENV_FILE = "env.shared";
const WRITE_TABLE_ORDER = [
	"render_areas",
	"render_components",
	"render_screen_region_children",
	"render_area_children",
	"render_component_children",
] as const;
const DELETE_TABLE_ORDER = [...WRITE_TABLE_ORDER].reverse();

async function main() {
	const options = parseArgs(process.argv.slice(2));
	await loadEnvFile(path.resolve(process.cwd(), options.envFile));
	const projection = await readRemoteProjection();
	const result = canonicalizeRenderProjection(projection);
	const sql = buildMigrationSql(result.projection);

	if (options.outFile) {
		await writeFile(path.resolve(process.cwd(), options.outFile), sql, "utf8");
	}
	if (options.reportFile) {
		await writeFile(
			path.resolve(process.cwd(), options.reportFile),
			JSON.stringify(result.report, null, 2),
			"utf8",
		);
	}
	if (options.write) {
		await writeCanonicalProjection(result.projection);
	}

	console.log(
		JSON.stringify(
			{
				areaDuplicateGroups: result.report.areaDuplicateGroups.length,
				componentDuplicateGroups: result.report.componentDuplicateGroups.length,
				mode: options.write ? "write" : "dry-run",
				outFile: options.outFile ? path.resolve(process.cwd(), options.outFile) : undefined,
				reportFile: options.reportFile
					? path.resolve(process.cwd(), options.reportFile)
					: undefined,
				rowCounts: result.report.rowCounts,
			},
			null,
			2,
		),
	);
}

async function readRemoteProjection(): Promise<RenderProjection> {
	const [
		areaChildren,
		areas,
		componentChildren,
		components,
		screenRegionChildren,
		screenRegions,
		screenRoutes,
		screenVariants,
		screens,
	] = await Promise.all([
		readRestRows("render_area_children", "select=id,area_id,component_id,order_index"),
		readRestRows(
			"render_areas",
			"select=id,type,version,layout_id,name,description,author,props",
		),
		readRestRows(
			"render_component_children",
			"select=id,component_id,order_index,catalog_component_type,variant,props",
		),
		readRestRows(
			"render_components",
			"select=id,type,version,layout_id,name,description,author,display,hooks",
		),
		readRestRows("render_screen_region_children", "select=id,screen_region_id,area_id,order_index"),
		readRestRows("render_screen_regions", "select=id,screen_id,type,layout_id"),
		readRestRows("render_screen_routes", "select=id,module_id,process_id,name,order_index"),
		readRestRows("render_screen_variants", "select=id,screen_route_id,name,order_index,type"),
		readRestRows(
			"render_screens",
			"select=id,screen_variant_id,version,type,layout_id,order_index,name,description,author",
		),
	]);

	return {
		areaChildren,
		areas,
		componentChildren,
		components,
		rowCounts: {
			render_area_children: areaChildren.length,
			render_areas: areas.length,
			render_component_children: componentChildren.length,
			render_components: components.length,
			render_screen_region_children: screenRegionChildren.length,
			render_screen_regions: screenRegions.length,
			render_screen_routes: screenRoutes.length,
			render_screen_variants: screenVariants.length,
			render_screens: screens.length,
		},
		screenRegionChildren,
		screenRegions,
		screenRoutes,
		screenVariants,
		screens,
	};
}

async function writeCanonicalProjection(projection: RenderProjection): Promise<void> {
	const tableRows: Record<(typeof WRITE_TABLE_ORDER)[number], RenderDbRow[]> = {
		render_area_children: projection.areaChildren,
		render_areas: projection.areas,
		render_component_children: projection.componentChildren,
		render_components: projection.components,
		render_screen_region_children: projection.screenRegionChildren,
	};

	for (const tableName of DELETE_TABLE_ORDER) {
		await requestSupabaseRest({
			method: "DELETE",
			query: "id=not.is.null",
			tableName,
		});
	}

	for (const tableName of WRITE_TABLE_ORDER) {
		await insertRowsViaRest(tableName, tableRows[tableName]);
	}
}

async function readRestRows(tableName: string, query: string): Promise<RenderDbRow[]> {
	const response = await requestSupabaseRest({ method: "GET", query, tableName });
	return (await response.json()) as RenderDbRow[];
}

async function insertRowsViaRest(tableName: string, rows: RenderDbRow[]): Promise<void> {
	const chunkSize = 100;
	for (let index = 0; index < rows.length; index += chunkSize) {
		const chunk = rows.slice(index, index + chunkSize);
		if (chunk.length === 0) continue;
		await requestSupabaseRest({
			body: JSON.stringify(chunk),
			method: "POST",
			tableName,
		});
	}
}

async function requestSupabaseRest({
	body,
	method,
	query,
	tableName,
}: {
	body?: string;
	method: "DELETE" | "GET" | "POST";
	query?: string;
	tableName: string;
}): Promise<Response> {
	const url = new URL(`/rest/v1/${tableName}`, requireEnv("NEXT_PUBLIC_SUPABASE_URL"));
	if (query) url.search = query;
	const response = await fetch(url, {
		body,
		headers: {
			apikey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
			Authorization: `Bearer ${requireEnv("SUPABASE_SERVICE_ROLE_KEY")}`,
			"Content-Type": "application/json",
			Prefer: "return=minimal",
		},
		method,
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`${method} ${tableName} failed: ${response.status} ${text}`);
	}
	return response;
}

function buildMigrationSql(projection: RenderProjection): string {
	return [
		"begin;",
		"delete from render_component_children;",
		"delete from render_area_children;",
		"delete from render_screen_region_children;",
		"delete from render_components;",
		"delete from render_areas;",
		insertRows("render_areas", projection.areas),
		insertRows("render_components", projection.components),
		insertRows("render_screen_region_children", projection.screenRegionChildren),
		insertRows("render_area_children", projection.areaChildren),
		insertRows("render_component_children", projection.componentChildren),
		"commit;",
		"",
	].join("\n");
}

function insertRows(tableName: string, rows: RenderDbRow[]): string {
	if (rows.length === 0) return `-- ${tableName}: no rows`;
	const columns = Object.keys(rows[0] ?? {});
	const values = rows.map(
		(row) => `(${columns.map((column) => sqlValue(row[column])).join(", ")})`,
	);
	return [`insert into ${tableName} (${columns.join(", ")}) values`, values.join(",\n"), ";"].join(
		"\n",
	);
}

function sqlValue(value: unknown): string {
	if (value === null || value === undefined) return "null";
	if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
	if (typeof value === "boolean") return value ? "true" : "false";
	if (typeof value === "object") return `${sqlString(JSON.stringify(value))}::jsonb`;
	return sqlString(String(value));
}

function sqlString(value: string): string {
	return `'${value.replaceAll("'", "''")}'`;
}

async function loadEnvFile(filePath: string): Promise<void> {
	let content: string;
	try {
		content = await readFile(filePath, "utf8");
	} catch {
		return;
	}
	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const separatorIndex = trimmed.indexOf("=");
		if (separatorIndex < 0) continue;
		const key = trimmed.slice(0, separatorIndex).trim();
		const value = trimmed.slice(separatorIndex + 1).trim();
		process.env[key] ??= value;
	}
}

function requireEnv(key: string): string {
	const value = process.env[key];
	if (!value) throw new Error(`Missing required env var: ${key}`);
	return value;
}

function parseArgs(args: string[]): CliOptions {
	const options: Partial<CliOptions> = {};
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (!arg) continue;
		if (arg === "--") continue;
		if (arg === "--env-file") {
			options.envFile = readRequiredArg(args, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--out-file") {
			options.outFile = readRequiredArg(args, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--report-file") {
			options.reportFile = readRequiredArg(args, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--write") {
			options.write = true;
			continue;
		}
		if (arg === "--help" || arg === "-h") {
			printUsage();
			process.exit(0);
		}
		throw new Error(`Unknown option: ${arg}`);
	}
	return {
		envFile: options.envFile ?? DEFAULT_ENV_FILE,
		outFile: options.outFile,
		reportFile: options.reportFile,
		write: options.write ?? false,
	};
}

function readRequiredArg(args: string[], index: number, optionName: string): string {
	const value = args[index + 1];
	if (!value || value.startsWith("--")) throw new Error(`Missing value for ${optionName}`);
	return value;
}

function printUsage() {
	console.log(`Usage:
  tsx apps/smoke/src/canonicalize-render-db-cli.ts --report-file tmp/render-db-canonical-report.json
  tsx apps/smoke/src/canonicalize-render-db-cli.ts --out-file tmp/render-db-canonical-migration.sql
  tsx apps/smoke/src/canonicalize-render-db-cli.ts --write

Options:
  --env-file <path>    Env file with Supabase URL and service role key. Default: env.shared.
  --out-file <path>    Write migration SQL for inspection.
  --report-file <path> Write duplicate signature audit and dry-run relation remap report.
  --write              Apply canonicalized rows to Supabase render_* tables.
`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
