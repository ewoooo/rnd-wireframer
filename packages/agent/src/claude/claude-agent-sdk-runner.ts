import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { AgentRunner } from "../contract";
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
	return async (request) => {
		const prompt = [
			request.prompt.user,
			"",
			"Context JSON:",
			JSON.stringify(request.prompt.metadata ?? {}, null, 2),
		].join("\n");
		const args = [
			"--print",
			"--output-format",
			"json",
			"--no-session-persistence",
			"--tools",
			"",
			"--system-prompt",
			request.prompt.system,
			...(options.model ? ["--model", options.model] : []),
			prompt,
		];
		const { stdout } = await execFileAsync(options.claudeBin ?? "claude", args, {
			maxBuffer: options.maxBuffer ?? 1024 * 1024 * 10,
		});
		const rawText = extractClaudeResultText(stdout);
		const parsed = parseClaudeJsonResult(rawText);

		return {
			payload: parsed.payload,
			session: {
				mode: request.session?.mode ?? "new",
				sessionId: request.session?.sessionId,
			},
			taskKind: request.taskKind,
		};
	};
}

function extractClaudeResultText(stdout: string): string {
	const output = JSON.parse(stdout.trim()) as { result?: unknown };
	if (typeof output.result === "string") return output.result;
	return stdout.trim();
}
