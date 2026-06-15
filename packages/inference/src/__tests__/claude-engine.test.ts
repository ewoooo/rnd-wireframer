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

	it("promotes skillset prompt docs to system, skill docs to user blocks, and keeps catalogs in context", async () => {
		let captured: AgentRunnerRequest | undefined;
		const runtime = createAgentRuntime({
			runner: async (request) => {
				captured = request;
				return { taskKind: request.taskKind, session: { mode: "new" }, payload: {} };
			},
		});
		const engine = createClaudeEngine(runtime);

		const skillset = {
			kind: "skillset",
			id: "screen-generation",
			owner: "@cx/agent",
			sourceRef: "../docs/skills/skillsets/screen-generation.md",
			schemaVersion: "ssot-object.v1",
			data: {
				task: "screen-generation",
				documents: [
					{
						id: "screen-generation",
						body: "PROMPT_DOC_BODY",
						kind: "prompt",
						sourceRef: "../docs/prompts/screen-generation.md",
						task: "screen-generation",
					},
					{
						id: "divider-usage-rules",
						body: "SKILL_DOC_BODY",
						kind: "skill",
						sourceRef: "../docs/skills/generate-skills/divider-usage-rules/README.md",
						task: "screen-generation",
					},
				],
			},
		};
		const componentCatalog = {
			kind: "component-catalog",
			id: "component-catalog",
			owner: "@cx/external",
			sourceRef: "catalog",
			schemaVersion: "ssot-object.v1",
			data: { entries: [] },
		};

		await engine.execute({
			task: "screen-generation",
			inputs: { sourceSpec: { a: 1 } },
			// biome-ignore lint/suspicious/noExplicitAny: minimal fixture shapes
			references: { skillset, componentCatalog } as any,
			outputContract: resolveOutputContractForInference("render-tree"),
		});

		// prompt 문서는 system으로 승격된다.
		expect(captured?.prompt.system).toContain("PROMPT_DOC_BODY");
		expect(captured?.prompt.user).not.toContain("PROMPT_DOC_BODY");
		// skill 문서는 user의 Mounted Skills 블록으로 들어간다.
		expect(captured?.prompt.user).toContain("## Mounted Skills");
		expect(captured?.prompt.user).toContain("SKILL_DOC_BODY");
		// 고정 블록: 단계 목적, 불변 제약, 출력 계약.
		expect(captured?.prompt.user).toContain("## Stage Objective");
		expect(captured?.prompt.user).toContain("## Hard Constraints");
		expect(captured?.prompt.user).toContain("same cardinality");
		expect(captured?.prompt.user).toContain("## Output Contract");
		// 카탈로그는 Knowledge Mounts로 안내되고 Context JSON에 남는다.
		expect(captured?.prompt.user).toContain("context.references.componentCatalog");
		const context = captured?.prompt.metadata?.context as {
			references: Record<string, { data?: { documents?: Array<Record<string, unknown>> } }>;
		};
		expect(Object.keys(context.references).sort()).toEqual(["componentCatalog", "skillset"]);
		// skillset은 body 없는 manifest로만 남는다 (중복 주입 방지 + usedSkills 추적용).
		for (const document of context.references.skillset.data?.documents ?? []) {
			expect(document.body).toBeUndefined();
			expect(document.sourceRef).toBeDefined();
		}
	});

	it("selects the strict source-fidelity constraint by default", async () => {
		let captured: AgentRunnerRequest | undefined;
		const engine = createClaudeEngine(
			createAgentRuntime({
				runner: async (request) => {
					captured = request;
					return { taskKind: request.taskKind, session: { mode: "new" }, payload: {} };
				},
			}),
		);

		await engine.execute({
			task: "screen-generation",
			inputs: {},
			references: {},
			outputContract: resolveOutputContractForInference("render-tree"),
		});

		// strict: 카디널리티 보존, merge 금지. consolidation 허용 문구는 없다.
		expect(captured?.prompt.user).toContain("same cardinality");
		expect(captured?.prompt.user).not.toContain("consolidate multiple source items");
	});

	it("selects the free constraint that allows catalogGap-directed consolidation", async () => {
		let captured: AgentRunnerRequest | undefined;
		const engine = createClaudeEngine(
			createAgentRuntime({
				runner: async (request) => {
					captured = request;
					return { taskKind: request.taskKind, session: { mode: "new" }, payload: {} };
				},
			}),
		);

		await engine.execute({
			task: "screen-generation",
			inputs: {},
			references: {},
			outputContract: resolveOutputContractForInference("render-tree"),
			constraint: "free",
		});

		// free: catalogGaps 지목 시 merge 허용. 정보 보존·카탈로그 밖 발명 금지는 유지.
		expect(captured?.prompt.user).toContain("consolidate multiple source items");
		expect(captured?.prompt.user).toContain("catalogGaps");
		expect(captured?.prompt.user).toContain("INFORMATION must survive");
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
