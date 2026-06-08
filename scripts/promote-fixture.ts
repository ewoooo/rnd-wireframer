import { cp, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

type PromoteFixtureOptions = {
	fixturesDir: string;
	runDir: string;
	runId?: string;
};

const DEFAULT_FIXTURES_DIR = "apps/web/fixtures/smoke-runs";

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const runDir = path.resolve(process.cwd(), options.runDir);
	const manifest = await readManifest(runDir);
	const runId = options.runId ?? manifest.runId;
	const targetDir = path.resolve(process.cwd(), options.fixturesDir, assertSafeRunId(runId));

	await mkdir(path.dirname(targetDir), { recursive: true });
	await cp(runDir, targetDir, { recursive: true });

	console.log(
		JSON.stringify(
			{
				from: runDir,
				runId,
				to: targetDir,
			},
			null,
			2,
		),
	);
}

function parseArgs(args: string[]): PromoteFixtureOptions {
	const options: Partial<PromoteFixtureOptions> = {};

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (!arg) continue;

		if (arg === "--run-dir") {
			options.runDir = readRequiredValue(args, index, "--run-dir");
			index += 1;
			continue;
		}

		if (arg === "--fixtures-dir") {
			options.fixturesDir = readRequiredValue(args, index, "--fixtures-dir");
			index += 1;
			continue;
		}

		if (arg === "--run-id") {
			options.runId = readRequiredValue(args, index, "--run-id");
			index += 1;
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
		fixturesDir: options.fixturesDir ?? DEFAULT_FIXTURES_DIR,
		runDir: options.runDir,
		runId: options.runId,
	};
}

async function readManifest(runDir: string): Promise<{ runId: string }> {
	return JSON.parse(await readFile(path.join(runDir, "manifest.json"), "utf8")) as {
		runId: string;
	};
}

function assertSafeRunId(runId: string): string {
	if (!/^[a-zA-Z0-9._-]+$/.test(runId)) {
		throw new Error("Invalid smoke run id.");
	}
	return runId;
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
  npm run smoke:promote-fixture -- --run-dir data/runs/screen-generation/<run-id>

Options:
  --run-dir <path>       Smoke run directory containing manifest.json.
  --fixtures-dir <path>  Target fixture root. Default: apps/web/fixtures/smoke-runs.
  --run-id <id>          Override fixture run id. Default: manifest.runId.
`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
