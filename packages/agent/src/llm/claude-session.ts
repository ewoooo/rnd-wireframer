import { execFileSync } from "node:child_process";
import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";

/**
 * 공유 Claude Agent SDK 호출 wrapper.
 *
 * AI를 호출하는 단계(현재 Extract / Compose AI / DesignReview AI)는 보일러플레이트가
 * 거의 동일하므로 한 곳으로 모은다. 각 단계는 prompt와 JSON schema만 책임진다.
 *
 * Opus 4.7가 기본. 단순 호출만 필요하면 `model` 옵션을 비워서 호출.
 */

export interface RunClaudeQueryInput {
	prompt: string;
	/** structured output JSON schema. Claude는 이 schema에 맞는 객체를 반환. */
	jsonSchema: Record<string, unknown>;
}

export interface RunClaudeQueryOptions {
	claudeExecutablePath?: string;
	continueSession?: boolean;
	cwd?: string;
	debug?: boolean;
	logger?: Pick<Console, "error" | "info" | "warn">;
	maxTurns?: number;
	/** 기본: claude-opus-4-7 */
	model?: string;
}

export interface RunClaudeQueryResult {
	/** structured_output(JSON) 또는 fallback으로 result 문자열 */
	structured: unknown;
	rawResult: string;
	sessionId?: string;
	numTurns: number;
}

const DEFAULT_MODEL = "claude-opus-4-7";

export async function runClaudeQuery(
	input: RunClaudeQueryInput,
	options: RunClaudeQueryOptions = {},
): Promise<RunClaudeQueryResult> {
	const logger = options.logger ?? console;
	const debug = options.debug ?? false;
	const claudeExecutablePath = options.claudeExecutablePath ?? resolveClaudeExecutablePath();
	const continueSession = options.continueSession ?? false;
	const maxTurns = options.maxTurns ?? 5;
	const model = options.model ?? DEFAULT_MODEL;

	const startedAt = Date.now();
	let resultMessage: SDKResultMessage | undefined;

	if (debug) {
		logger.info("[cx-agent:llm] query-start", {
			model,
			continueSession,
			maxTurns,
			promptLength: input.prompt.length,
			hasClaudeExecutablePath: Boolean(claudeExecutablePath),
		});
	}

	for await (const message of query({
		prompt: input.prompt,
		options: {
			continue: continueSession,
			cwd: options.cwd,
			disallowedTools: ["Bash", "Edit", "Write", "NotebookEdit", "WebFetch", "WebSearch"],
			maxTurns,
			model,
			outputFormat: {
				type: "json_schema",
				schema: input.jsonSchema,
			},
			pathToClaudeCodeExecutable: claudeExecutablePath,
			permissionMode: "dontAsk",
			tools: [],
		},
	})) {
		if (message.type === "result") {
			resultMessage = message;
		}
	}

	if (!resultMessage) {
		throw new ClaudeSessionError("Claude Agent SDK finished without a result message.");
	}

	if (resultMessage.subtype !== "success" || resultMessage.is_error) {
		throw new ClaudeSessionError(
			`Claude Agent SDK failed: ${resultMessage.subtype}`,
			"errors" in resultMessage ? (resultMessage.errors as unknown) : undefined,
		);
	}

	const elapsedMs = Date.now() - startedAt;
	if (debug) {
		logger.info("[cx-agent:llm] query-done", {
			elapsedMs,
			numTurns: resultMessage.num_turns,
			rawResultLength: resultMessage.result.length,
			hasStructuredOutput: resultMessage.structured_output !== undefined,
			sessionId: resultMessage.session_id,
		});
	}

	return {
		structured: resultMessage.structured_output ?? resultMessage.result,
		rawResult: resultMessage.result,
		sessionId: resultMessage.session_id,
		numTurns: resultMessage.num_turns,
	};
}

export function resolveClaudeExecutablePath(): string | undefined {
	if (process.env.CLAUDE_CODE_PATH) return process.env.CLAUDE_CODE_PATH;
	try {
		return execFileSync("command -v claude", {
			encoding: "utf8",
			shell: true,
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return undefined;
	}
}

export class ClaudeSessionError extends Error {
	constructor(
		message: string,
		readonly details?: unknown,
	) {
		super(message);
		this.name = "ClaudeSessionError";
	}
}
