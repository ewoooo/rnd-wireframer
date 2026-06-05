import type { AgentRunnerRequest } from "@cx/agent/contract";
import { SCHEMA_VERSION, type SourceSpec } from "@cx/schema";
import { describe, expect, it } from "vitest";
import { createFakeScreenIntent, runScreenIntentNode } from "../screen-generation";

describe("screen intent node", () => {
	it("builds the screen-intent agent input and runs the provided agent runner", async () => {
		const sourceSpec = createSourceSpec();
		let seenRequest: AgentRunnerRequest | undefined;

		const result = await runScreenIntentNode({
			onRunnerRequest: (request) => {
				seenRequest = request;
			},
			runner: async (request) => ({
				payload: createFakeScreenIntent(sourceSpec),
				session: {
					mode: request.session?.mode ?? "new",
					sessionId: request.session?.sessionId,
				},
				taskKind: request.taskKind,
			}),
			sourceSpec,
		});

		expect(result.agentInput.context.sourceSpec).toBe(sourceSpec);
		expect(result.agentInput.context.targetArtifact.kind).toBe("screen-intent");
		expect(result.agentResult.taskKind).toBe("screen-intent");
		expect(result.agentResult.payload).toMatchObject({
			schemaVersion: SCHEMA_VERSION.screenIntent,
			contentPriority: ["main-area", "HeroCard"],
		});
		expect(result.runnerRequest).toBe(seenRequest);
		expect(seenRequest?.input.context).toBe(result.agentInput.context);
	});
});

function createSourceSpec(): SourceSpec {
	return {
		schemaVersion: SCHEMA_VERSION.sourceSpec,
		sourceImport: {
			files: [
				{
					checksum: "sha256:test",
					id: "file-1",
					kind: "screen",
					path: "screen.md",
					screenCode: "TEST-SCREEN",
					title: "Test screen",
				},
			],
			importId: "test-import",
			receivedAt: "2026-06-05T00:00:00.000Z",
			sourceKind: "prdd-markdown-bundle",
		},
		sourceShape: {
			screen: {
				name: "테스트 화면",
				regions: [
					{
						children: [
							{
								children: [
									{
										kind: "component",
										label: "Hero card",
										sourceComponentId: "HeroCard",
									},
								],
								kind: "area",
								sourceAreaId: "main-area",
							},
						],
						slot: "contents",
					},
				],
				route: "/test",
				screenCode: "TEST-SCREEN",
			},
		},
	};
}
