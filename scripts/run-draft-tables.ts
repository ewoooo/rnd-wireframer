/**
 * Active draft tables runner.
 *
 * PRDD를 active deterministic path(register -> compose -> decorate -> materialize)로
 * database/tables shape draft에 변환한다. 기본값은 database/tables를 덮어쓰지 않고
 * database/ai-imports/<screen>.draft-tables/ 아래에 검토용 파일만 쓴다.
 *
 * 사용: pnpm tsx scripts/run-draft-tables.ts [PRDD 경로 또는 파일명] [--out-dir <dir>]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DraftTablesBundle } from "@cx/types";
import { composePrddScreen } from "../packages/agent/src/compose/compose-prdd";
import { materializePrddScreenToTables } from "../packages/agent/src/database/prdd-to-database-tables";
import { runDraftTablesPipeline } from "../packages/agent/src/pipeline/draft-tables-pipeline";
import type { RegisterPrddScreenResult } from "../packages/agent/src/register/register-prdd-screen";
import type {
	ComposedAreaNode,
	ComposedPrddScreen,
	DecoratedAreaNode,
	DecoratedPrddScreen,
	PatternRef,
} from "../packages/agent/src/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PRDD = "NOVA-PRDD-PG-001-0.md";
const DEFAULT_PRDD_DIR = resolve(ROOT, "database/client-imports/PRDD/screen");

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const prddArg = findPrddArg(args) ?? DEFAULT_PRDD;
	const prddPath = resolvePrddPath(prddArg);
	const outDir = resolveOutDir(args, prddPath);
	const prddSource = await readFile(prddPath, "utf8");
	const importJobId = `draft-tables-${Date.now()}`;

	console.log(`[draft-tables] active path runner for ${prddPath}`);

	const result = await runDraftTablesPipeline({
		prddSource,
		importJobId,
		sourceId: basename(prddPath),
		generateDraftTables: ({ register }) => createDraftTables(register),
	});

	await mkdir(outDir, { recursive: true });
	await writeFile(
		resolve(outDir, "register.json"),
		`${JSON.stringify(result.register, null, 2)}\n`,
	);

	if (!result.ok || !result.artifact) {
		console.error(`[draft-tables] failed at stage=${result.stage}`);
		for (const violation of result.invariantViolations) {
			console.error(`  - ${violation.code}: ${violation.message}`);
		}
		process.exit(1);
	}

	await writeFile(
		resolve(outDir, "artifact.json"),
		`${JSON.stringify(result.artifact, null, 2)}\n`,
	);

	const files = createDraftTableFiles(result.artifact.tables);
	for (const [filename, payload] of Object.entries(files)) {
		await writeFile(resolve(outDir, filename), `${JSON.stringify(payload, null, "\t")}\n`);
	}

	console.log(
		`[draft-tables] wrote artifact + ${Object.keys(files).length} table files to ${outDir}`,
	);
	console.log(`[draft-tables] warnings=${result.artifact.tables.warnings?.length ?? 0}`);
	for (const warning of result.artifact.tables.warnings?.slice(0, 5) ?? []) {
		console.log(`  [warn] ${warning}`);
	}
}

function findPrddArg(args: string[]): string | undefined {
	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === "--out-dir") {
			i += 1;
			continue;
		}
		if (!arg.startsWith("--")) return arg;
	}
	return undefined;
}

function resolvePrddPath(arg: string): string {
	if (arg.includes("/") || arg.endsWith(".md")) {
		const direct = resolve(ROOT, arg);
		return arg.includes("/") ? direct : resolve(DEFAULT_PRDD_DIR, arg);
	}
	return resolve(DEFAULT_PRDD_DIR, arg);
}

function resolveOutDir(args: string[], prddPath: string): string {
	const outDirFlagIndex = args.indexOf("--out-dir");
	if (outDirFlagIndex >= 0) {
		const outDir = args[outDirFlagIndex + 1];
		if (!outDir) throw new Error("--out-dir requires a directory path");
		return resolve(ROOT, outDir);
	}

	const stem = basename(prddPath).replace(/\.md$/, "");
	return resolve(ROOT, "database/ai-imports", `${stem}.draft-tables`);
}

function createDraftTables(register: RegisterPrddScreenResult): DraftTablesBundle {
	const screenId = register.screenId;
	const routeId = `${screenId}-route`;
	const variantId = `${screenId}-base`;
	const composed = composePrddScreen({
		...register.runtime,
		warnings: register.warnings,
	});
	const decorated = decorateComposedForDraft(composed);
	const materialized = materializePrddScreenToTables(decorated, { screenVariantId: variantId });

	return {
		screenRoutes: [
			{
				id: routeId,
				moduleId: "draft",
				name: decorated.screen.name ?? screenId,
				order: decorated.screen.order ?? 1,
				processId: null,
			},
		],
		screenVariants: [
			{
				id: variantId,
				screenRouteId: routeId,
				name: decorated.screen.name ?? screenId,
				order: 1,
				variantType: "base",
				followUp: null,
			},
		],
		screens: [materialized.screen],
		areas: materialized.areas,
		components: materialized.components,
		warnings: materialized.warnings,
	};
}

function decorateComposedForDraft(composed: ComposedPrddScreen): DecoratedPrddScreen {
	const components = composed.components.map((component) => ({
		...component,
		pattern: componentPattern(component.type),
	}));
	const areas = composed.areas.map(decorateAreaForDraft);

	return {
		screen: {
			...composed.screen,
			pattern: { id: "screen-shell", variant: "default", reasons: ["deterministic screen shell"] },
		},
		header: {
			...composed.header,
			pattern: regionPattern("header"),
		},
		contents: {
			...composed.contents,
			pattern: regionPattern("contents"),
			children: areas,
		},
		bottom: {
			...composed.bottom,
			pattern: regionPattern("bottom"),
		},
		components,
		areas,
		warnings: composed.warnings,
	};
}

function decorateAreaForDraft(area: ComposedAreaNode): DecoratedAreaNode {
	return {
		...area,
		pattern: {
			id: area.layout ? `area-${normalizePatternId(area.layout)}` : "area-section",
			variant: "default",
			reasons: area.layout ? [`layout: ${area.layout}`] : ["default area pattern"],
		},
	};
}

function componentPattern(type = "unknown"): PatternRef {
	return {
		id: `component-${normalizePatternId(type)}`,
		variant: "default",
		reasons: [`component type: ${type}`],
	};
}

function regionPattern(slot: string): PatternRef {
	return {
		id: `region-${slot}`,
		variant: "default",
		reasons: [`region slot: ${slot}`],
	};
}

function normalizePatternId(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function createDraftTableFiles(tables: DraftTablesBundle): Record<string, unknown> {
	return {
		"areas.json": { areas: tables.areas },
		"components.json": { components: tables.components },
		"screen_routes.json": { screenRoutes: tables.screenRoutes },
		"screen_variants.json": { screenVariants: tables.screenVariants },
		"screens.json": { screens: tables.screens },
	};
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
