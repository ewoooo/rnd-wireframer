import { formatBatchReport, runGenerationBatch, runGenerationSmoke } from "./generation";

type SmokeCliOptions = {
	artifactRoot?: string;
	artifactStore?: "data-run" | "local-transient" | "web-fixture";
	batchId?: string;
	disableDesignContext?: boolean;
	glob?: string;
	outDir?: string;
	runId?: string;
	target?: string;
	targetDir?: string;
	useAI: boolean;
};

async function main() {
	const options = parseArgs(process.argv.slice(2));

	if (options.targetDir) {
		await runBatch(options);
		return;
	}

	if (!options.target) {
		printUsage();
		throw new Error("Missing required client import target.");
	}

	const result = await runGenerationSmoke(options.target, {
		artifactRoot: options.artifactRoot,
		artifactStore: options.artifactStore,
		disableDesignContext: options.disableDesignContext,
		outDir: options.outDir,
		runId: options.runId,
		useAI: options.useAI,
	});

	console.log(JSON.stringify(result.summary, null, 2));

	if (!result.parseCommandResult.parseResult.ok) {
		throw new Error(`Parse smoke failed. See ${result.outDir}/01-parse-result.json`);
	}
}

async function runBatch(options: SmokeCliOptions) {
	const result = await runGenerationBatch({
		artifactRoot: options.artifactRoot,
		artifactStore: options.artifactStore,
		batchId: options.batchId,
		disableDesignContext: options.disableDesignContext,
		glob: options.glob,
		targetDir: options.targetDir as string,
		useAI: options.useAI,
	});

	console.log(formatBatchReport(result));

	if (result.results.length === 0) {
		throw new Error(
			`No screens matched in ${options.targetDir}${options.glob ? ` (glob ${options.glob})` : ""}.`,
		);
	}
	if (result.failCount > 0) {
		throw new Error(`${result.failCount} of ${result.results.length} screen(s) failed.`);
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

		if (arg === "--artifact-store") {
			const value = readRequiredValue(args, index, "--artifact-store");
			if (value !== "data-run" && value !== "local-transient" && value !== "web-fixture") {
				throw new Error(`Unknown artifact store: ${value}`);
			}
			options.artifactStore = value;
			index += 1;
			continue;
		}

		if (arg === "--artifact-root") {
			options.artifactRoot = readRequiredValue(args, index, "--artifact-root");
			index += 1;
			continue;
		}

		if (arg === "--target-dir") {
			options.targetDir = readRequiredValue(args, index, "--target-dir");
			index += 1;
			continue;
		}

		if (arg === "--glob") {
			options.glob = readRequiredValue(args, index, "--glob");
			index += 1;
			continue;
		}

		if (arg === "--batch-id") {
			options.batchId = readRequiredValue(args, index, "--batch-id");
			index += 1;
			continue;
		}

		if (arg === "--use-ai" || arg === "--real-agent") {
			options.useAI = true;
			continue;
		}

		if (arg === "--no-design-context") {
			options.disableDesignContext = true;
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

	if (!options.target && !options.targetDir) {
		printUsage();
		throw new Error("Missing required target. Use --target <file> or --target-dir <dir>.");
	}

	return {
		artifactRoot: options.artifactRoot,
		artifactStore: options.artifactStore,
		batchId: options.batchId,
		disableDesignContext: options.disableDesignContext ?? false,
		glob: options.glob,
		outDir: options.outDir,
		runId: options.runId,
		target: options.target,
		targetDir: options.targetDir,
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
  Single screen:
    npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md
  Batch (directory):
    npm run smoke:pipeline -- --target-dir data/client-imports/{id}/260527_prdd --glob '*-0.md'

Options:
  --target <path>   Client import markdown file to smoke (single screen).
  --target-dir <dir>  Directory of markdown screens to smoke as a batch.
  --glob <pattern>  Batch only: filter files in --target-dir by basename (e.g. '*-0.md').
  --batch-id <id>   Batch only: run id prefix + manifest tag. Defaults to batch-<timestamp>.
  --run-id <id>     Single only. Stable output id. Defaults to <target-basename>-<timestamp>.
  --out-dir <path>  Legacy output directory override (single only).
  --no-design-context  Eval 전용: design-context bundle 본문 주입을 끈다(A/B 비교).
  --artifact-store <data-run|local-transient|web-fixture>
                   Output store. Defaults to data-run.
  --artifact-root <path>
                   Root directory for run folders. Defaults to data/runs/screen-generation.
  --use-ai          Call the real local Claude runner instead of the fake smoke runner.
  --real-agent      Alias for --use-ai.
`);
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
