import { type AgentRunRequest, createAgentRuntime } from "@cx/agent";
import { resolveOutputContractForInference } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { createClaudeEngine } from "../engine/claude-engine";

describe("createClaudeEngine", () => {
	it("maps prompt.id to taskKind and returns payload as raw", async () => {
		let captured: AgentRunRequest | undefined;
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
			prompt: { id: "screen-intent" },
			inputs: { sourceSpec: { a: 1 } },
			references: {},
			outputContract: resolveOutputContractForInference("screen-intent"),
		});

		expect(captured?.taskKind).toBe("screen-intent");
		expect(result.raw).toEqual({ hello: "world" });
	});

	it("throws when prompt.id is missing", async () => {
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
		).rejects.toThrow(/prompt\.id/);
	});
});
