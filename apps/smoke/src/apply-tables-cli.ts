import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { type GenerationTableData, mergeRenderTreeIntoTables } from "@cx/pipeline";
import type { RenderTreeContract, SourceSpec } from "@cx/schema";

type ApplyTablesCliOptions = {
	allowInvalid: boolean;
	moduleId?: string;
	runDir: string;
	tablesDir: string;
	write: boolean;
};

const DEFAULT_TABLES_DIR = "data/tables";

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const runDir = path.resolve(process.cwd(), options.runDir);
	const tablesDir = path.resolve(process.cwd(), options.tablesDir);
	const runArtifacts = await resolveRunArtifacts(runDir);
	const renderTree = (await readJson(runArtifacts.finalResultPath)) as RenderTreeContract;
	const validationReport = await readOptionalJson(runArtifacts.validationReportPath);
	const sourceSpec = (await readOptionalJson(runArtifacts.sourceSpecPath)) as
		| SourceSpec
		| undefined;

	if (!options.allowInvalid && hasValidationErrors(validationReport)) {
		throw new Error(
			[
				"Smoke validation report has errors.",
				"Pass --allow-invalid to apply anyway after manual inspection.",
				`Report: ${runArtifacts.validationReportPath}`,
			].join(" "),
		);
	}

	const tables = await readTables(tablesDir);
	const result = mergeRenderTreeIntoTables(tables, renderTree, {
		moduleId: options.moduleId,
		screenId: readRenderTreeScreenId(renderTree),
		screenVariantId: readRenderTreeScreenId(renderTree),
		sourceSpec,
	});

	if (options.write) {
		await writeTables(tablesDir, result.tables);
	}

	console.log(
		JSON.stringify(
			{
				changed: result.changed,
				mode: options.write ? "write" : "dry-run",
				screenId: readRenderTreeScreenId(renderTree),
				tablesDir,
				warnings: result.warnings,
			},
			null,
			2,
		),
	);
}

type ResolvedRunArtifacts = {
	finalResultPath: string;
	sourceSpecPath: string;
	validationReportPath: string;
};

async function resolveRunArtifacts(runDir: string): Promise<ResolvedRunArtifacts> {
	const manifestPath = path.join(runDir, "manifest.json");
	const manifest = (await readOptionalJson(manifestPath)) as
		| {
				artifactRoot?: string;
				finalResult?: string;
				sourceSpec?: string;
				validationReport?: string;
		  }
		| undefined;

	if (manifest?.finalResult) {
		const artifactRoot = manifest.artifactRoot ?? "artifacts";
		return {
			finalResultPath: await resolveExistingArtifactPath(
				runDir,
				manifest.finalResult,
				"final-result.json",
			),
			sourceSpecPath: await resolveExistingArtifactPath(
				runDir,
				manifest.sourceSpec ?? path.join(artifactRoot, "source-spec.json"),
				"source-spec.json",
			),
			validationReportPath: await resolveExistingArtifactPath(
				runDir,
				manifest.validationReport ?? path.join(artifactRoot, "validation-report.json"),
				"validation-report.json",
			),
		};
	}

	return {
		finalResultPath: path.join(runDir, "final-result.json"),
		sourceSpecPath: path.join(runDir, "source-spec.json"),
		validationReportPath: path.join(runDir, "validation-report.json"),
	};
}

async function resolveExistingArtifactPath(
	runDir: string,
	manifestRelativePath: string,
	flatFileName: string,
): Promise<string> {
	const manifestPath = path.resolve(runDir, manifestRelativePath);
	if (await fileExists(manifestPath)) return manifestPath;
	return path.join(runDir, flatFileName);
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

function parseArgs(args: string[]): ApplyTablesCliOptions {
	const options: Partial<ApplyTablesCliOptions> = {};

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (!arg) continue;

		if (arg === "--run-dir") {
			options.runDir = readRequiredValue(args, index, "--run-dir");
			index += 1;
			continue;
		}

		if (arg === "--tables-dir") {
			options.tablesDir = readRequiredValue(args, index, "--tables-dir");
			index += 1;
			continue;
		}

		if (arg === "--module-id") {
			options.moduleId = readRequiredValue(args, index, "--module-id");
			index += 1;
			continue;
		}

		if (arg === "--write") {
			options.write = true;
			continue;
		}

		if (arg === "--allow-invalid") {
			options.allowInvalid = true;
			continue;
		}

		if (arg === "--help" || arg === "-h") {
			printUsage();
			process.exit(0);
		}

		if (arg.startsWith("--")) {
			throw new Error(`Unknown option: ${arg}`);
		}

		options.runDir = arg;
	}

	if (!options.runDir) {
		printUsage();
		throw new Error("Missing required smoke run directory.");
	}

	return {
		allowInvalid: options.allowInvalid ?? false,
		moduleId: options.moduleId,
		runDir: options.runDir,
		tablesDir: options.tablesDir ?? DEFAULT_TABLES_DIR,
		write: options.write ?? false,
	};
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

async function readJson(filePath: string): Promise<unknown> {
	return JSON.parse(await readFile(filePath, "utf8"));
}

async function readOptionalJson(filePath: string): Promise<unknown | undefined> {
	try {
		return await readJson(filePath);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			return undefined;
		}
		throw error;
	}
}

async function writeJson(filePath: string, content: unknown): Promise<void> {
	await writeFile(filePath, `${JSON.stringify(content, null, "\t")}\n`, "utf8");
}

function hasValidationErrors(input: unknown): boolean {
	if (!input || typeof input !== "object" || !("summary" in input)) return false;
	const summary = (input as { summary?: { errorCount?: unknown } }).summary;
	return typeof summary?.errorCount === "number" && summary.errorCount > 0;
}

function readRenderTreeScreenId(renderTree: RenderTreeContract): string {
	const screen = renderTree.children.find((node) => node.type === "Screen");
	return screen?.metadata.id ?? renderTree.metadata.id;
}

function readRequiredValue(args: string[], index: number, optionName: string): string {
	const value = args[index + 1];
	if (!value || value.startsWith("--")) {
		throw new Error(`Missing value for ${optionName}.`);
	}
	return value;
}

function printUsage() {
	console.log(`Usage:
  npm run smoke:apply-tables -- --run-dir data/runs/screen-generation/<run-id>
  npm run smoke:apply-tables -- --run-dir data/runs/screen-generation/<run-id> --write

Options:
  --run-dir <path>      Smoke run directory containing manifest.json or final-result.json.
  --tables-dir <path>   Target tables directory. Default: data/tables.
  --module-id <id>      Module id for generated screen route. Default: preview.
  --allow-invalid       Apply even when validation report has errors.
  --write               Write changes. Without this, only prints a dry-run summary.
`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
