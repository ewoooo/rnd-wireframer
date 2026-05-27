import { describe, expect, it } from "vitest";
import {
	DEFAULT_CLAUDE_GENERATION_MODEL,
	parseClaudeJsonResult,
	resolveClaudeAvailability,
	resolveClaudeGenerationModel,
} from "../claude";
import { assertClaudeResumeAllowed } from "../claude/claude-session-policy";
import { normalizeAgentError } from "../result";
import { createMemorySessionStore } from "../session";

describe("@cx/agent Claude internals", () => {
	it("detects local Claude availability without opening a real session", async () => {
		await expect(
			resolveClaudeAvailability({
				hasLocalClaude: () => true,
				hasRemoteClaudeApi: () => true,
			}),
		).resolves.toEqual({
			local: true,
			remote: true,
			mode: "local",
		});
	});

	it("falls back to remote availability when local Claude is unavailable", async () => {
		await expect(
			resolveClaudeAvailability({
				hasLocalClaude: () => false,
				hasRemoteClaudeApi: () => true,
			}),
		).resolves.toMatchObject({
			local: false,
			remote: true,
			mode: "remote",
		});
	});

	it("requires a session id for explicit Claude resume", () => {
		expect(() =>
			assertClaudeResumeAllowed({
				taskKind: "screen-revision",
				input: {
					query: "이어서 수정해줘",
				},
				session: {
					mode: "resume",
				},
			}),
		).toThrow("Claude resume requires a session id.");
	});

	it("parses JSON fenced Claude output", () => {
		expect(parseClaudeJsonResult('```json\n{"ok":true}\n```')).toEqual({
			payload: {
				ok: true,
			},
		});
	});

	it("resolves the Claude generation model from explicit, env, and package defaults", () => {
		const previousModel = process.env.CLAUDE_GENERATION_MODEL;
		process.env.CLAUDE_GENERATION_MODEL = " claude-env-model ";

		try {
			expect(resolveClaudeGenerationModel(" claude-explicit-model ")).toBe("claude-explicit-model");
			expect(resolveClaudeGenerationModel()).toBe("claude-env-model");

			delete process.env.CLAUDE_GENERATION_MODEL;
			expect(resolveClaudeGenerationModel()).toBe(DEFAULT_CLAUDE_GENERATION_MODEL);
		} finally {
			if (previousModel === undefined) {
				delete process.env.CLAUDE_GENERATION_MODEL;
			} else {
				process.env.CLAUDE_GENERATION_MODEL = previousModel;
			}
		}
	});

	it("stores local session metadata in memory for package-level tests", () => {
		const store = createMemorySessionStore();
		store.write("session-1", {
			mode: "resume",
			sessionId: "session-1",
			reason: "explicit-resume",
		});

		expect(store.read("session-1")).toEqual({
			mode: "resume",
			sessionId: "session-1",
			reason: "explicit-resume",
		});
	});

	it("normalizes thrown values into agent errors", () => {
		expect(normalizeAgentError(new Error("boom"))).toEqual({
			name: "Error",
			message: "boom",
		});
		expect(normalizeAgentError("failed")).toEqual({
			name: "UnknownAgentError",
			message: "failed",
		});
	});
});
