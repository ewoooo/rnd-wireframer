import { runGenerationSmoke } from "./generation";

type SmokeCliOptions = {
	outDir?: string;
	runId?: string;
	target: string;
	useAI: boolean;
};

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const result = await runGenerationSmoke(options.target, {
		outDir: options.outDir,
		runId: options.runId,
		useAI: options.useAI,
	});

	console.log(JSON.stringify(result.summary, null, 2));

	if (!result.parseCommandResult.parseResult.ok) {
		throw new Error(`Parse smoke failed. See ${result.outDir}/01-parse-result.json`);
	}
}

function parseArgs(args: string[]): SmokeCliOptions {
	const options: Partial<SmokeCliOptions> = {};

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (!arg) continue;

		if (arg === "--target") {
			options.target = readRequiredValue(args, index, "--target");
			index += 1;
			continue;
		}

		if (arg === "--run-id") {
			options.runId = readRequiredValue(args, index, "--run-id");
			index += 1;
			continue;
		}

		if (arg === "--out-dir") {
			options.outDir = readRequiredValue(args, index, "--out-dir");
			index += 1;
			continue;
		}

		if (arg === "--use-ai" || arg === "--real-agent") {
			options.useAI = true;
			continue;
		}

		if (arg === "--help" || arg === "-h") {
			printUsage();
			process.exit(0);
		}

		if (arg.startsWith("--")) {
			throw new Error(`Unknown option: ${arg}`);
		}

		options.target = arg;
	}

	if (!options.target) {
		printUsage();
		throw new Error("Missing required client import target.");
	}

	return {
		outDir: options.outDir,
		runId: options.runId,
		target: options.target,
		useAI: options.useAI ?? false,
	};
}

function readRequiredValue(args: string[], index: number, optionName: string): string {
	const value = args[index + 1];
	if (!value || value.startsWith("--")) throw new Error(`Missing value for ${optionName}.`);
	return value;
}

function printUsage() {
	console.log(`Usage:
  npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md
  npm run smoke:pipeline -- data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md
  npm --workspace @cx/smoke run generation -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md

Options:
  --target <path>   Client import markdown file to smoke.
  --run-id <id>     Stable output id. Defaults to <target-basename>-<timestamp>.
  --out-dir <path>  Output directory. Defaults to tmp/generation-runs/<run-id>.
  --use-ai          Call the real local Claude runner instead of the fake smoke runner.
  --real-agent      Alias for --use-ai.
`);
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
