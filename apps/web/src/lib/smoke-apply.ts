import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { type GenerationTableData, mergeRenderTreeIntoTables } from "@cx/pipeline/apply";
import type { RenderTreeContract, SourceSpec } from "@cx/schema";

import type { SmokeRunManifest, SmokeValidationReport } from "./smoke-runs";

type ApplySmokeRunOptions = {
	allowInvalid?: boolean;
	moduleId?: string;
	runId: string;
	write?: boolean;
};

export type ApplySmokeRunResult = {
	changed: ReturnType<typeof mergeRenderTreeIntoTables>["changed"];
	mode: "dry-run" | "write";
	runId: string;
	screenId: string;
	warnings: string[];
};

const DEFAULT_RUNS_DIR = path.join(
	/* turbopackIgnore: true */ process.cwd(),
	"data/runs/screen-generation",
);
const DEFAULT_TABLES_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "data/tables");

export async function applySmokeRunToTables({
	allowInvalid = false,
	moduleId,
	runId,
	write = false,
}: ApplySmokeRunOptions): Promise<ApplySmokeRunResult> {
	const runDir = path.join(DEFAULT_RUNS_DIR, assertSafeRunId(runId));
	const manifest = await readJson<SmokeRunManifest>(path.join(runDir, "manifest.json"));
	const validationReport = await readOptionalJson<SmokeValidationReport>(
		path.resolve(runDir, manifest.validationReport),
	);

	if (!allowInvalid && hasValidationErrors(validationReport)) {
		throw new Error("Smoke validation report has errors.");
	}

	const renderTree = await readJson<RenderTreeContract>(path.resolve(runDir, manifest.finalResult));
	const sourceSpec = await readOptionalJson<SourceSpec>(
		path.resolve(runDir, manifest.sourceSpec ?? path.join(manifest.artifactRoot, "source-spec.json")),
	);
	const tables = await readTables(DEFAULT_TABLES_DIR);
	const screenId = readRenderTreeScreenId(renderTree);
	const result = mergeRenderTreeIntoTables(tables, renderTree, {
		moduleId,
		screenId,
		screenVariantId: screenId,
		sourceSpec,
	});

	if (write) {
		await writeTables(DEFAULT_TABLES_DIR, result.tables);
	}

	return {
		changed: result.changed,
		mode: write ? "write" : "dry-run",
		runId,
		screenId,
		warnings: result.warnings,
	};
}

function assertSafeRunId(runId: string): string {
	if (!/^[a-zA-Z0-9._-]+$/.test(runId)) {
		throw new Error("Invalid smoke run id.");
	}
	return runId;
}

async function readTables(tablesDir: string): Promise<GenerationTableData> {
	return {
		areas: (await readJson(path.join(tablesDir, "areas.json"))) as GenerationTableData["areas"],
		components: (await readJson(
			path.join(tablesDir, "components.json"),
		)) as GenerationTableData["components"],
		screenRoutes: (await readJson(
			path.join(tablesDir, "screen_routes.json"),
		)) as GenerationTableData["screenRoutes"],
		screenVariants: (await readJson(
			path.join(tablesDir, "screen_variants.json"),
		)) as GenerationTableData["screenVariants"],
		screens: (await readJson(
			path.join(tablesDir, "screens.json"),
		)) as GenerationTableData["screens"],
	};
}

async function writeTables(tablesDir: string, tables: GenerationTableData): Promise<void> {
	await writeJson(path.join(tablesDir, "screens.json"), tables.screens);
	await writeJson(path.join(tablesDir, "areas.json"), tables.areas);
	await writeJson(path.join(tablesDir, "components.json"), tables.components);
	if (tables.screenRoutes) {
		await writeJson(path.join(tablesDir, "screen_routes.json"), tables.screenRoutes);
	}
	if (tables.screenVariants) {
		await writeJson(path.join(tablesDir, "screen_variants.json"), tables.screenVariants);
	}
}

async function readJson<T>(filePath: string): Promise<T> {
	return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function readOptionalJson<T>(filePath: string): Promise<T | undefined> {
	try {
		return await readJson<T>(filePath);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
		throw error;
	}
}

async function writeJson(filePath: string, content: unknown): Promise<void> {
	await writeFile(filePath, `${JSON.stringify(content, null, "\t")}\n`, "utf8");
}

function hasValidationErrors(input: SmokeValidationReport | undefined): boolean {
	return typeof input?.summary?.errorCount === "number" && input.summary.errorCount > 0;
}

function readRenderTreeScreenId(renderTree: RenderTreeContract): string {
	const screen = renderTree.children.find((node) => node.type === "Screen");
	return screen?.metadata.id ?? renderTree.metadata.id;
}
