import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type TableEnvelope<T> = {
	areas?: T[];
	components?: T[];
	screenRoutes?: T[];
	screenVariants?: T[];
	screens?: T[];
};

type LocalScreenRoute = {
	id: string;
	moduleId?: string | null;
	name: string;
	order: number;
	processId?: string | null;
};

type LocalScreenVariant = {
	id: string;
	screenRouteId: string;
	name: string;
	order: number;
	variantType?: string | null;
};

type LocalScreen = {
	id: string;
	version?: string;
	metadata?: LocalMetadata;
	screenVariantId: string;
	screen?: {
		type?: string;
		regions?: Record<string, LocalRegion>;
	};
	layout?: string;
};

type LocalRegion = {
	children?: LocalChildRef[];
	layout?: string;
};

type LocalArea = {
	id: string;
	version?: string;
	metadata?: LocalMetadata;
	type?: string;
	props?: Record<string, unknown>;
	children?: LocalChildRef[];
	layout?: string;
};

type LocalComponent = {
	id: string;
	version?: string;
	metadata?: LocalMetadata;
	type?: string;
	children?: LocalComponentChild[];
	hooks?: unknown;
	display?: unknown;
	layout?: string;
};

type LocalMetadata = {
	author?: string;
	description?: string;
	title?: string;
};

type LocalChildRef = {
	id: string;
	kind: string;
};

type LocalComponentChild = {
	component?: {
		type?: string;
		variant?: string;
	};
	props?: unknown;
};

type CliOptions = {
	envFile: string;
	outFile?: string;
	tablesDir: string;
	write: boolean;
};

const DEFAULT_TABLES_DIR = "data/tables";
const DEFAULT_ENV_FILE = "env.shared";
const WRITE_TABLE_ORDER = [
	"render_screen_routes",
	"render_screen_variants",
	"render_screens",
	"render_screen_regions",
	"render_areas",
	"render_components",
	"render_screen_region_children",
	"render_area_children",
	"render_component_children",
] as const;
const DELETE_TABLE_ORDER = [...WRITE_TABLE_ORDER].reverse();

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const tablesDir = path.resolve(process.cwd(), options.tablesDir);
	const tables = await readLocalTables(tablesDir);
	const projection = projectRenderRows(tables);
	const sql = buildSql(projection);

	if (options.outFile) {
		await writeFile(path.resolve(process.cwd(), options.outFile), sql, "utf8");
	}

	if (options.write) {
		await loadEnvFile(path.resolve(process.cwd(), options.envFile));
		await pushProjectionViaRest(projection);
	}

	console.log(
		JSON.stringify(
			{
				mode: options.write ? "write" : "dry-run",
				outFile: options.outFile ? path.resolve(process.cwd(), options.outFile) : undefined,
				rowCounts: projection.rowCounts,
				tablesDir,
			},
			null,
			2,
		),
	);
}

type RenderProjection = {
	areaChildren: Array<Record<string, unknown>>;
	areas: Array<Record<string, unknown>>;
	componentChildren: Array<Record<string, unknown>>;
	components: Array<Record<string, unknown>>;
	rowCounts: Record<string, number>;
	screenRegionChildren: Array<Record<string, unknown>>;
	screenRegions: Array<Record<string, unknown>>;
	screenRoutes: Array<Record<string, unknown>>;
	screenVariants: Array<Record<string, unknown>>;
	screens: Array<Record<string, unknown>>;
};

function projectRenderRows(tables: {
	areas: LocalArea[];
	components: LocalComponent[];
	screenRoutes: LocalScreenRoute[];
	screenVariants: LocalScreenVariant[];
	screens: LocalScreen[];
}): RenderProjection {
	const screenRoutes = tables.screenRoutes.map((route) => ({
		id: route.id,
		module_id: route.moduleId ?? null,
		name: route.name,
		order_index: route.order,
		process_id: route.processId ?? null,
	}));

	const screenVariants = tables.screenVariants.map((variant) => ({
		id: variant.id,
		name: variant.name,
		order_index: variant.order,
		screen_route_id: variant.screenRouteId,
		type: normalizeVariantType(variant.variantType),
	}));

	const screens = tables.screens.map((screen) => ({
		author: screen.metadata?.author ?? null,
		description: screen.metadata?.description ?? null,
		id: screen.id,
		layout_id: requireValue(screen.layout, `screens/${screen.id}.layout`),
		name: requireValue(screen.metadata?.title, `screens/${screen.id}.metadata.title`),
		order_index: 0,
		screen_variant_id: screen.screenVariantId,
		type: normalizeScreenType(screen.screen?.type),
		version: screen.version ?? "0.1.0",
	}));

	const screenRegions: Array<Record<string, unknown>> = [];
	const screenRegionChildren: Array<Record<string, unknown>> = [];

	for (const screen of tables.screens) {
		const regions = screen.screen?.regions ?? {};
		for (const regionType of ["header", "contents", "bottom"]) {
			const region = regions[regionType];
			if (!region) throw new Error(`Missing ${regionType} region for ${screen.id}`);
			const screenRegionId = `${screen.id}.${regionType}`;
			screenRegions.push({
				id: screenRegionId,
				layout_id: requireValue(region.layout, `screens/${screen.id}.${regionType}.layout`),
				screen_id: screen.id,
				type: regionType,
			});
			for (const [index, child] of (region.children ?? []).entries()) {
				if (child.kind !== "area") {
					throw new Error(
						`Unsupported region child kind ${child.kind} at ${screen.id}.${regionType}[${index}]`,
					);
				}
				screenRegionChildren.push({
					area_id: child.id,
					order_index: index,
					screen_region_id: screenRegionId,
				});
			}
		}
	}

	const areas = tables.areas.map((area) => ({
		author: area.metadata?.author ?? null,
		description: area.metadata?.description ?? null,
		id: area.id,
		layout_id: requireValue(area.layout, `areas/${area.id}.layout`),
		name: area.metadata?.title ?? area.props?.name ?? area.id,
		props: area.props ?? null,
		type: normalizeAreaType(area.type),
		version: area.version ?? "0.1.0",
	}));

	const areaChildren: Array<Record<string, unknown>> = [];
	for (const area of tables.areas) {
		for (const [index, child] of (area.children ?? []).entries()) {
			if (child.kind !== "component") {
				throw new Error(`Unsupported area child kind ${child.kind} at ${area.id}[${index}]`);
			}
			areaChildren.push({
				area_id: area.id,
				component_id: child.id,
				order_index: index,
			});
		}
	}

	const components = tables.components.map((component) => ({
		author: component.metadata?.author ?? null,
		description: component.metadata?.description ?? null,
		display: component.display ?? null,
		hooks: component.hooks ?? null,
		id: component.id,
		layout_id: requireValue(component.layout, `components/${component.id}.layout`),
		name: component.metadata?.title ?? component.id,
		type: requireValue(component.type, `components/${component.id}.type`),
		version: component.version ?? "0.1.0",
	}));

	const componentChildren: Array<Record<string, unknown>> = [];
	for (const component of tables.components) {
		for (const [index, child] of (component.children ?? []).entries()) {
			componentChildren.push({
				catalog_component_type: requireValue(
					child.component?.type,
					`components/${component.id}.children[${index}].component.type`,
				),
				component_id: component.id,
				order_index: index,
				props: child.props ?? null,
				variant: child.component?.variant ?? null,
			});
		}
	}

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

function buildSql(projection: RenderProjection): string {
	return [
		"begin;",
		"delete from render_component_children;",
		"delete from render_area_children;",
		"delete from render_screen_region_children;",
		"delete from render_components;",
		"delete from render_areas;",
		"delete from render_screen_regions;",
		"delete from render_screens;",
		"delete from render_screen_variants;",
		"delete from render_screen_routes;",
		insertRows("render_screen_routes", projection.screenRoutes),
		insertRows("render_screen_variants", projection.screenVariants),
		insertRows("render_screens", projection.screens),
		insertRows("render_screen_regions", projection.screenRegions),
		insertRows("render_areas", projection.areas),
		insertRows("render_components", projection.components),
		insertRows("render_screen_region_children", projection.screenRegionChildren),
		insertRows("render_area_children", projection.areaChildren),
		insertRows("render_component_children", projection.componentChildren),
		"commit;",
		"",
	].join("\n");
}

function insertRows(tableName: string, rows: Array<Record<string, unknown>>): string {
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

async function pushProjectionViaRest(projection: RenderProjection): Promise<void> {
	const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
	const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
	const tableRows: Record<(typeof WRITE_TABLE_ORDER)[number], Array<Record<string, unknown>>> = {
		render_area_children: projection.areaChildren,
		render_areas: projection.areas,
		render_component_children: projection.componentChildren,
		render_components: projection.components,
		render_screen_region_children: projection.screenRegionChildren,
		render_screen_regions: projection.screenRegions,
		render_screen_routes: projection.screenRoutes,
		render_screen_variants: projection.screenVariants,
		render_screens: projection.screens,
	};

	for (const tableName of DELETE_TABLE_ORDER) {
		await requestSupabaseRest({
			method: "DELETE",
			query: "id=not.is.null",
			serviceRoleKey,
			supabaseUrl,
			tableName,
		});
	}

	for (const tableName of WRITE_TABLE_ORDER) {
		await insertRowsViaRest({
			rows: tableRows[tableName],
			serviceRoleKey,
			supabaseUrl,
			tableName,
		});
	}
}

async function insertRowsViaRest({
	rows,
	serviceRoleKey,
	supabaseUrl,
	tableName,
}: {
	rows: Array<Record<string, unknown>>;
	serviceRoleKey: string;
	supabaseUrl: string;
	tableName: string;
}): Promise<void> {
	const chunkSize = 100;
	for (let index = 0; index < rows.length; index += chunkSize) {
		const chunk = rows.slice(index, index + chunkSize);
		if (chunk.length === 0) continue;
		await requestSupabaseRest({
			body: JSON.stringify(chunk),
			method: "POST",
			serviceRoleKey,
			supabaseUrl,
			tableName,
		});
	}
}

async function requestSupabaseRest({
	body,
	method,
	query,
	serviceRoleKey,
	supabaseUrl,
	tableName,
}: {
	body?: string;
	method: "DELETE" | "POST";
	query?: string;
	serviceRoleKey: string;
	supabaseUrl: string;
	tableName: string;
}): Promise<void> {
	const url = new URL(`/rest/v1/${tableName}`, supabaseUrl);
	if (query) url.search = query;
	const response = await fetch(url, {
		body,
		headers: {
			apikey: serviceRoleKey,
			Authorization: `Bearer ${serviceRoleKey}`,
			"Content-Type": "application/json",
			Prefer: "return=minimal",
		},
		method,
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`${method} ${tableName} failed: ${response.status} ${text}`);
	}
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

async function readLocalTables(tablesDir: string) {
	return {
		areas: await readEnvelope<LocalArea>(tablesDir, "areas.json", "areas"),
		components: await readEnvelope<LocalComponent>(tablesDir, "components.json", "components"),
		screenRoutes: await readEnvelope<LocalScreenRoute>(
			tablesDir,
			"screen_routes.json",
			"screenRoutes",
		),
		screenVariants: await readEnvelope<LocalScreenVariant>(
			tablesDir,
			"screen_variants.json",
			"screenVariants",
		),
		screens: await readEnvelope<LocalScreen>(tablesDir, "screens.json", "screens"),
	};
}

async function readEnvelope<T>(
	tablesDir: string,
	fileName: string,
	key: keyof TableEnvelope<T>,
): Promise<T[]> {
	const input = JSON.parse(
		await readFile(path.join(tablesDir, fileName), "utf8"),
	) as TableEnvelope<T>;
	const rows = input[key];
	if (!Array.isArray(rows)) throw new Error(`Missing ${String(key)} array in ${fileName}`);
	return rows;
}

function normalizeVariantType(value: string | null | undefined): "base" | "edge" {
	if (value === "edge") return "edge";
	return "base";
}

function normalizeScreenType(value: string | undefined): "bottomsheet" | "page" | "popup" {
	const normalized = value?.replace(/^screen\./, "");
	if (normalized === "bottomsheet" || normalized === "popup") return normalized;
	return "page";
}

function normalizeAreaType(value: string | undefined): "area_dynamic" | "area_static" {
	if (value === "area.dynamic") return "area_dynamic";
	return "area_static";
}

function requireValue(value: string | null | undefined, label: string): string {
	if (!value) throw new Error(`Missing required value: ${label}`);
	return value;
}

function parseArgs(args: string[]): CliOptions {
	const options: Partial<CliOptions> = {};
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (!arg) continue;
		if (arg === "--tables-dir") {
			options.tablesDir = readRequiredArg(args, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--out-file") {
			options.outFile = readRequiredArg(args, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--env-file") {
			options.envFile = readRequiredArg(args, index, arg);
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
		tablesDir: options.tablesDir ?? DEFAULT_TABLES_DIR,
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
  npm run render-db:push-tables
  npm run render-db:push-tables -- --out-file tmp/render-db.sql
  npm run render-db:push-tables -- --write

Options:
  --env-file <path>    Env file with Supabase URL and service role key. Default: env.shared.
  --tables-dir <path>  Local table directory. Default: data/tables.
  --out-file <path>   Write generated SQL for inspection.
  --write             Push rows to Supabase render_* tables using PostgREST.
`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
