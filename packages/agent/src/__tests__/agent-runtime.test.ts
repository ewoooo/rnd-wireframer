import { resolveSkillsetForInference } from "@cx/agent";
import { resolveSkillsetForInference as resolveSkillsetFromSubpath } from "@cx/agent/skillset-catalog";
import { describe, expect, it } from "vitest";
import type { AgentRunnerRequest } from "../contract";
import { createAgentRuntime } from "../runtime/create-agent-runtime";

describe("@cx/agent runtime", () => {
	it("delegates run requests to the configured runner", async () => {
		let seenRequest: AgentRunnerRequest | undefined;
		const runtime = createAgentRuntime({
			runner: async (request) => {
				seenRequest = request;
				return {
					taskKind: request.taskKind,
					session: {
						mode: request.session?.mode ?? "new",
						sessionId: request.session?.sessionId,
					},
					payload: { ok: true },
				};
			},
		});

		const result = await runtime.run({
			taskKind: "screen-generation",
			input: { query: "가입 완료 화면을 생성해줘" },
			prompt: {
				system: "system",
				user: "가입 완료 화면을 생성해줘",
				metadata: { taskKind: "screen-generation" },
			},
			session: { mode: "new" },
		});

		expect(result.session.mode).toBe("new");
		expect(seenRequest?.prompt.user).toBe("가입 완료 화면을 생성해줘");
		expect(seenRequest?.prompt.metadata).toMatchObject({ taskKind: "screen-generation" });
	});

	it("throws a configuration error when no runner is provided", async () => {
		const runtime = createAgentRuntime();
		await expect(
			runtime.run({
				taskKind: "screen-generation",
				input: { query: "q" },
				prompt: { system: "s", user: "q" },
			}),
		).rejects.toThrow(/runner is not configured/i);
	});

	it("resolves skillsets with source refs and frontmatter", () => {
		const skillset = resolveSkillsetForInference("screen-intent");

		expect(skillset).toMatchObject({
			kind: "skillset",
			id: "screen-intent",
			owner: "@cx/agent",
			sourceRef: "../docs/skills/skillsets/screen-intent.md",
			schemaVersion: "ssot-object.v1",
			data: {
				task: "screen-intent",
			},
		});
		expect(skillset.data.documents.map((document) => document.id)).toEqual([
			"screen-intent",
			"source-fidelity-review",
			"state-coverage-review",
		]);
		expect(skillset.data.documents[0]).toMatchObject({
			kind: "prompt",
			priority: "required",
			role: "intent-extraction",
			sourceRef: "../docs/prompts/screen-intent.md",
			task: "screen-intent",
		});
		expect(resolveSkillsetFromSubpath("quality-review").data.documents.length).toBeGreaterThan(1);
		expect(() => resolveSkillsetForInference("missing")).toThrow("Unknown skillset: missing");
	});
});
