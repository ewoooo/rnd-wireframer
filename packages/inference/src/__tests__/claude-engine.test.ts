import { type AgentRunnerRequest, createAgentRuntime } from "@cx/agent";
import { resolveOutputContractForInference } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { createClaudeEngine } from "../engine/claude-engine";

describe("createClaudeEngine", () => {
	it("maps step.task to taskKind, assembles the prompt, and returns payload as raw", async () => {
		let captured: AgentRunnerRequest | undefined;
		const runtime = createAgentRuntime({
			runner: async (request) => {
				captured = request;
				return {
					taskKind: request.taskKind,
					session: { mode: "new" },
					payload: { hello: "world" },
				};
			},
		});
		const engine = createClaudeEngine(runtime);

		const result = await engine.execute({
			task: "screen-intent",
			inputs: { sourceSpec: { a: 1 } },
			references: {},
			outputContract: resolveOutputContractForInference("screen-intent"),
		});

		expect(captured?.taskKind).toBe("screen-intent");
		expect(captured?.prompt.system).toContain("screen-intent");
		expect(captured?.prompt.user).toContain("ScreenIntent");
		expect(captured?.session?.mode).toBe("new");
		expect(result.raw).toEqual({ hello: "world" });
		// The assembled prompt is returned so the worker can snapshot it to prompt.json.
		expect(result.prompt).toEqual(captured?.prompt);
	});

	it("throws when step.task is missing", async () => {
		const engine = createClaudeEngine(
			createAgentRuntime({
				runner: async () => {
					throw new Error("should not run");
				},
			}),
		);
		await expect(
			engine.execute({
				inputs: {},
				references: {},
				outputContract: resolveOutputContractForInference("screen-intent"),
			}),
		).rejects.toThrow(/step\.task/);
	});
});
