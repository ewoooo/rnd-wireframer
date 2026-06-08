import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { AgentRunner } from "../contract";
import { resolveClaudeGenerationModel } from "./claude-model";
import { parseClaudeJsonResult } from "./claude-result-parser";

const execFileAsync = promisify(execFile);

export type CreateClaudeAgentSdkRunnerOptions = {
	claudeBin?: string;
	localFirst?: boolean;
	maxBuffer?: number;
	model?: string;
};

export function createClaudeAgentSdkRunner(
	options: CreateClaudeAgentSdkRunnerOptions = {},
): AgentRunner {
	const model = resolveClaudeGenerationModel(options.model);

	return async (request) => {
		const prompt = [
			request.prompt.user,
			"",
			"Context JSON:",
			JSON.stringify(request.prompt.metadata ?? {}, null, 2),
		].join("\n");

		const schema = extractOutputSchema(request.input); // meta keys already stripped

		const baseArgs = [
			"--print",
			"--output-format",
			"json",
			"--no-session-persistence",
			"--tools",
			"",
			"--system-prompt",
			request.prompt.system,
			"--model",
			model,
		];

		const runClaude = async (withSchema: boolean): Promise<string> => {
			const args = [...baseArgs];
			if (withSchema && schema) args.push("--json-schema", JSON.stringify(schema));
			args.push(prompt);
			const { stdout } = await execFileAsync(options.claudeBin ?? "claude", args, {
				maxBuffer: options.maxBuffer ?? 1024 * 1024 * 10,
			});
			return stdout.trim();
		};

		const parseEnvelope = (stdout: string) =>
			JSON.parse(stdout) as { result?: unknown; structured_output?: unknown };

		let payload: unknown;
		if (schema) {
			try {
				const stdout = await runClaude(true);
				const envelope = parseEnvelope(stdout);
				// structured_output is the schema-constrained object (preferred). On the
				// rare "accepted but not extracted" case it's null → fall back to result text.
				payload =
					envelope.structured_output !== undefined && envelope.structured_output !== null
						? envelope.structured_output
						: parseClaudeJsonResult(typeof envelope.result === "string" ? envelope.result : stdout)
								.payload;
			} catch {
				// Schema rejected (e.g. recursive render-tree) → CLI stdout is not valid
				// JSON. Re-run WITHOUT --json-schema and text-parse, exactly as before.
				const stdout = await runClaude(false);
				const envelope = parseEnvelope(stdout);
				payload = parseClaudeJsonResult(
					typeof envelope.result === "string" ? envelope.result : stdout,
				).payload;
			}
		} else {
			const stdout = await runClaude(false);
			const envelope = parseEnvelope(stdout);
			payload = parseClaudeJsonResult(
				typeof envelope.result === "string" ? envelope.result : stdout,
			).payload;
		}

		return {
			payload,
			session: {
				mode: request.session?.mode ?? "new",
				sessionId: request.session?.sessionId,
			},
			taskKind: request.taskKind,
		};
	};
}

function extractOutputSchema(input: { context?: unknown }): Record<string, unknown> | undefined {
	const context = input.context;
	if (!context || typeof context !== "object") return undefined;
	const raw = (context as { jsonSchema?: unknown }).jsonSchema;
	if (!raw || typeof raw !== "object") return undefined;
	// $schema/$id/title silently disable the CLI's structured_output extraction — drop them.
	const { $schema, $id, title, ...rest } = raw as Record<string, unknown>;
	void $schema;
	void $id;
	void title;
	return rest;
}
