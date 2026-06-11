import { describe, expect, it } from "vitest";
import {
	DEFAULT_CLAUDE_GENERATION_MODEL,
	parseClaudeJsonResult,
	resolveClaudeAvailability,
	resolveClaudeGenerationModel,
} from "../claude";

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

	it("parses JSON fenced Claude output", () => {
		expect(parseClaudeJsonResult('```json\n{"ok":true}\n```')).toEqual({
			payload: {
				ok: true,
			},
		});
	});

	it("parses the first balanced JSON value when Claude appends prose", () => {
		expect(parseClaudeJsonResult('{"ok":true}\n검토 완료')).toEqual({
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
});
