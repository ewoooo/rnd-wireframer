import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
	extractTableGenerationResultFromAgentPayload,
	type GenerationTableData,
	mergeTableGenerationResultIntoTables,
} from "@cx/pipeline";
import type { SourceSpec } from "@cx/schema";

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
	const agentResult = await readJson(path.join(runDir, "17-agent-result.json"));
	const validationReport = await readOptionalJson(path.join(runDir, "25-validation-report.json"));
	const sourceSpec = (await readOptionalJson(path.join(runDir, "02-source-spec.json"))) as
		| SourceSpec
		| undefined;
	const tableGenerationResult = extractTableGenerationResultFromAgentPayload(agentResult);

	if (!tableGenerationResult) {
		throw new Error(`No tableGenerationResult found in ${runDir}/17-agent-result.json`);
	}

	if (!options.allowInvalid && hasValidationErrors(validationReport)) {
		throw new Error(
			[
				"Smoke validation report has errors.",
				"Pass --allow-invalid to apply anyway after manual inspection.",
				`Report: ${runDir}/25-validation-report.json`,
			].join(" "),
		);
	}

	const tables = await readTables(tablesDir);
	const result = mergeTableGenerationResultIntoTables(tables, tableGenerationResult, {
		moduleId: options.moduleId,
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
				screenId: tableGenerationResult.screen.id,
				screenVariantId: tableGenerationResult.screen.screenVariantId,
				tablesDir,
			},
			null,
			2,
		),
	);
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

function readRequiredValue(args: string[], index: number, optionName: string): string {
	const value = args[index + 1];
	if (!value || value.startsWith("--")) {
		throw new Error(`Missing value for ${optionName}.`);
	}
	return value;
}

function printUsage() {
	console.log(`Usage:
  npm run smoke:apply-tables -- --run-dir tmp/generation-runs/<run-id>
  npm run smoke:apply-tables -- --run-dir tmp/generation-runs/<run-id> --write

Options:
  --run-dir <path>      Smoke output directory containing 17-agent-result.json.
  --tables-dir <path>   Target tables directory. Default: data/tables.
  --module-id <id>      Module id for generated screen route. Default: preview.
  --allow-invalid       Apply even when 25-validation-report.json has errors.
  --write               Write changes. Without this, only prints a dry-run summary.
`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
