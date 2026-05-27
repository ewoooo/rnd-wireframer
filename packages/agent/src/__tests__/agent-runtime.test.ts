import { describe, expect, it } from "vitest";
import { runAgentQuery } from "../adapters";
import type { AgentRunnerRequest } from "../contract";
import { createAgentRuntime } from "../runtime/create-agent-runtime";
import { runAgentTask } from "../runtime/run-agent-task";
import { agentTaskCatalog } from "../tasks";

describe("@cx/agent runtime", () => {
	it("registers the Claude task kinds", () => {
		expect(Object.keys(agentTaskCatalog)).toEqual([
			"pattern-selection",
			"screen-generation",
			"screen-revision",
			"quality-review",
		]);
	});

	it("builds a prompt and applies the task default session mode", async () => {
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
					payload: {
						ok: true,
					},
				};
			},
		});

		const result = await runAgentTask(runtime, {
			taskKind: "screen-generation",
			input: {
				query: "가입 완료 화면을 생성해줘",
				context: {
					screenCode: "join-complete",
				},
			},
		});

		expect(result.session.mode).toBe("new");
		expect(seenRequest?.prompt.user).toBe("가입 완료 화면을 생성해줘");
		expect(seenRequest?.prompt.metadata).toMatchObject({
			taskKind: "screen-generation",
			context: {
				screenCode: "join-complete",
			},
		});
	});

	it("lets the external adapter share the same query shape for web and scripts", async () => {
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
					payload: request.prompt.metadata,
				};
			},
		});

		const result = await runAgentQuery(runtime, {
			taskKind: "screen-revision",
			query: "검수 의견 반영해서 CTA 문구를 고쳐줘",
			previousResult: {
				screenId: "draft-1",
			},
			sessionId: "claude-session-1",
			resume: true,
		});

		expect(result.session).toEqual({
			mode: "resume",
			sessionId: "claude-session-1",
		});
		expect(seenRequest?.prompt.metadata).toMatchObject({
			taskKind: "screen-revision",
			previousResult: {
				screenId: "draft-1",
			},
		});
	});
});
