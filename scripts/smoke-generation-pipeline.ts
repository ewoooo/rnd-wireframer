import { readFile } from "node:fs/promises";
import path from "node:path";

import { createAgentRuntime } from "@cx/agent";
import { runAgentQuery } from "@cx/agent/adapters";
import type { AgentRunnerRequest } from "@cx/agent/contract";
import { buildScreenGenerationAgentInput } from "@cx/orchestration";
import { createNodePipelineAdapters, runSideEffects } from "@cx/pipeline";
import { runParseMarkdownSourceCommand } from "@cx/pipeline/parser";
import type { SideEffectCommand } from "@cx/pipeline/types";

type SmokeOptions = {
	outDir?: string;
	runId?: string;
	target: string;
};

const CLIENT_IMPORT_ROOT = "data/client-imports";

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const targetPath = normalizeTargetPath(options.target);
	const content = await readFile(targetPath, "utf8");
	const runId = options.runId ?? createTimestampedRunIdFromTarget(targetPath);
	const outDir = options.outDir ?? path.join("tmp", "generation-runs", runId);

	const parseCommandResult = runParseMarkdownSourceCommand({
		files: [
			{
				content,
				kind: resolveSourceKind(targetPath),
				path: targetPath,
			},
		],
		importId: runId,
		receivedAt: "1970-01-01T00:00:00.000Z",
	});

	if (!parseCommandResult.parseResult.ok) {
		await writeSmokeArtifacts({
			agentInput: undefined,
			agentResult: undefined,
			outDir,
			parseCommandResult,
			pipelineRunId: runId,
			runnerRequest: undefined,
			sourceSpec: parseCommandResult.parseResult.sourceSpec,
		});
		throw new Error(`Parse smoke failed. See ${outDir}/parse-result.json`);
	}

	const sourceSpec = parseCommandResult.parseResult.sourceSpec;
	const agentInput = buildScreenGenerationAgentInput(sourceSpec);
	let runnerRequest: AgentRunnerRequest | undefined;
	const runtime = createAgentRuntime({
		runner: async (request) => {
			runnerRequest = request;
			return {
				payload: {
					receivedTaskKind: request.taskKind,
					smoke: true,
					sourceSummary: agentInput.context.sourceSummary,
				},
				rawText: JSON.stringify({ smoke: true }),
				session: {
					mode: request.session?.mode ?? "new",
					sessionId: request.session?.sessionId,
				},
				taskKind: request.taskKind,
			};
		},
	});

	const agentResult = await runAgentQuery(runtime, {
		context: agentInput.context,
		query: agentInput.query,
		taskKind: "screen-generation",
	});

	await writeSmokeArtifacts({
		agentInput,
		agentResult,
		outDir,
		parseCommandResult,
		pipelineRunId: runId,
		runnerRequest,
		sourceSpec,
	});

	printSummary({
		agentResult,
		outDir,
		parseCommandResult,
		sourcePath: targetPath,
	});
}

function parseArgs(args: string[]): SmokeOptions {
	const options: Partial<SmokeOptions> = {};

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
	};
}

function readRequiredValue(args: string[], index: number, optionName: string): string {
	const value = args[index + 1];
	if (!value || value.startsWith("--")) throw new Error(`Missing value for ${optionName}.`);
	return value;
}

function normalizeTargetPath(target: string): string {
	return target.startsWith(CLIENT_IMPORT_ROOT) ? target : path.join(CLIENT_IMPORT_ROOT, target);
}

function resolveSourceKind(targetPath: string): "area" | "component" | "screen" | "unknown" {
	if (targetPath.includes("/screen/")) return "screen";
	if (targetPath.includes("/area/")) return "area";
	if (targetPath.includes("/component/")) return "component";
	return "unknown";
}

function createTimestampedRunIdFromTarget(targetPath: string): string {
	return `${path.basename(targetPath).replace(/\.[^.]+$/, "")}-${createTimestamp()}`;
}

function createTimestamp(): string {
	return new Date().toISOString().replace(/\D/g, "").slice(0, 14);
}

async function writeSmokeArtifacts(input: {
	agentInput: unknown;
	agentResult: unknown;
	outDir: string;
	parseCommandResult: unknown;
	pipelineRunId: string;
	runnerRequest: unknown;
	sourceSpec: unknown;
}) {
	const commands: SideEffectCommand[] = [
		createWriteCommand(
			"write-parse-result",
			input.outDir,
			"parse-result.json",
			input.parseCommandResult,
		),
		createWriteCommand("write-source-spec", input.outDir, "source-spec.json", input.sourceSpec),
		createWriteCommand("write-agent-input", input.outDir, "agent-input.json", input.agentInput),
		createWriteCommand(
			"write-agent-runner-request",
			input.outDir,
			"agent-runner-request.json",
			input.runnerRequest,
		),
		createWriteCommand("write-agent-result", input.outDir, "agent-result.json", input.agentResult),
	];

	const pipelineResult = await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands,
		mode: "commit",
		runId: input.pipelineRunId,
	});

	await runSideEffects({
		adapters: createNodePipelineAdapters(),
		commands: [
			createWriteCommand(
				"write-pipeline-result",
				input.outDir,
				"pipeline-result.json",
				pipelineResult,
			),
		],
		mode: "commit",
		runId: input.pipelineRunId,
	});
}

function createWriteCommand(
	id: string,
	outDir: string,
	fileName: string,
	content: unknown,
): SideEffectCommand {
	return {
		id,
		input: {
			content: content ?? null,
			targetPath: path.join(outDir, fileName),
		},
		operation: "versioned-artifact-write",
	};
}

function printSummary(input: {
	agentResult: { payload: unknown; session: { mode: string; sessionId?: string } };
	outDir: string;
	parseCommandResult: ReturnType<typeof runParseMarkdownSourceCommand>;
	sourcePath: string;
}) {
	const sourceSpec = input.parseCommandResult.parseResult.sourceSpec;
	const screen = sourceSpec?.sourceShape.screen;

	console.log(
		JSON.stringify(
			{
				agentPayload: input.agentResult.payload,
				areaCount: screen?.areas.length ?? 0,
				componentCount: sourceSpec?.sourceShape.components.length ?? 0,
				ok: input.parseCommandResult.ok,
				outDir: input.outDir,
				screenCode: screen?.screenCode,
				session: input.agentResult.session,
				sourcePath: input.sourcePath,
			},
			null,
			2,
		),
	);
}

function printUsage() {
	console.log(`Usage:
  npm run smoke:pipeline -- --target data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md
  npm run smoke:pipeline -- data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md

Options:
  --target <path>   Client import markdown file to smoke.
  --run-id <id>     Stable output id. Defaults to <target-basename>-<timestamp>.
  --out-dir <path>  Output directory. Defaults to tmp/generation-runs/<run-id>.
`);
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
