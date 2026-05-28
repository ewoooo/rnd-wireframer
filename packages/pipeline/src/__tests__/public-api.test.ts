import {
	buildPipeline,
	createNodePipelineAdapters,
	runPipeline,
	runSideEffects,
	sideEffectBoundary,
} from "@cx/pipeline";
import { runParseMarkdownSourceCommand } from "@cx/pipeline/parser";
import { createTestPipelineAdapters } from "@cx/pipeline/testing";
import type { SideEffectExecutionResult, SideEffectOperation } from "@cx/pipeline/types";
import { describe, expect, it } from "vitest";

describe("@cx/pipeline public API", () => {
	it("exposes the side effect package boundary", () => {
		expect(sideEffectBoundary.name).toBe("side-effect-conveyor-belt");
		expect(sideEffectBoundary.packageName).toBe("@cx/pipeline");
		expect(sideEffectBoundary.owns).toContain("side-effect-command-conveying");
		expect(sideEffectBoundary.owns).toContain("markdown-source-parse-command");
		expect(sideEffectBoundary.owns).toContain("source-artifact-read");
		expect(sideEffectBoundary.owns).toContain("versioned-artifact-write");
		expect(sideEffectBoundary.owns).toContain("run-log-write");
		expect(sideEffectBoundary.rejects).toContain("claude-agent-run");
		expect(sideEffectBoundary.rejects).toContain("markdown-parsing-rule-ownership");
		expect(sideEffectBoundary.rejects).toContain("pure-stage-orchestration");
		expect(sideEffectBoundary.rejects).toContain("validation-rule-ownership");
		expect(sideEffectBoundary.rejects).toContain("business-workflow-ownership");
	});

	it("types side effect execution results against the public operation contract", () => {
		const operation: SideEffectOperation = "side-effect-command-conveying";
		const result: SideEffectExecutionResult = {
			operation,
			ok: true,
			commands: [
				{
					operation: "approved-catalog-apply",
					status: "succeeded",
					issues: [],
				},
			],
			issues: [],
		};

		expect(result.operation).toBe(operation);
	});

	it("passes already-read markdown source through @cx/parser", () => {
		const result = runParseMarkdownSourceCommand({
			importId: "sample",
			files: [
				{
					kind: "screen",
					path: "screen/SAMPLE-001-0.md",
					content: "# 샘플 화면\nroute: /sample\nActionButton\nlabel: 확인",
				},
			],
		});

		expect(result.ok).toBe(true);
		expect(result.operation).toBe("markdown-source-parse-command");
		expect("issues" in result).toBe(false);
		expect("commands" in result).toBe(false);
		expect(result.parseResult.ok).toBe(true);
		if (!result.parseResult.ok) throw new Error("parse failed");
		expect(result.parseResult.sourceSpec.sourceShape.screen.name).toBe("샘플 화면");
		expect(
			result.parseResult.sourceSpec.sourceShape.screen.regions[0]?.children[0]?.children[0]
				?.sourceComponentId,
		).toBe("ActionButton");
	});

	it("runs MVP side effect commands with injectable adapters", async () => {
		const { adapters, files } = createTestPipelineAdapters({
			"runs/run-001/approved.json": '{"ok":true}\n',
			"runs/run-001/source.md": "# Source",
		});

		const result = await runSideEffects({
			adapters,
			commands: [
				{
					id: "read-source",
					operation: "source-artifact-read",
					input: {
						kind: "screen",
						path: "runs/run-001/source.md",
					},
				},
				{
					id: "write-draft",
					operation: "versioned-artifact-write",
					input: {
						content: { screenId: "screen-001" },
						targetPath: "runs/run-001/draft.json",
					},
				},
				{
					id: "write-log",
					operation: "run-log-write",
					input: {
						content: { runId: "run-001" },
						targetPath: "runs/run-001/run-log.json",
					},
				},
				{
					id: "apply-approved",
					operation: "approved-catalog-apply",
					input: {
						fromPath: "runs/run-001/approved.json",
						toPath: "database/generated/approved.json",
					},
				},
			],
			mode: "commit",
			runId: "run-001",
		});

		expect(result.ok).toBe(true);
		expect(result.operation).toBe("side-effect-command-conveying");
		expect(result.commands).toHaveLength(4);
		expect(result.commands?.[0]?.output).toMatchObject({
			content: "# Source",
			kind: "screen",
			path: "runs/run-001/source.md",
		});
		expect(files.get("runs/run-001/draft.json")).toContain("screen-001");
		expect(files.get("database/generated/approved.json")).toBe('{"ok":true}\n');
	});

	it("exposes node pipeline adapter factory", () => {
		const adapters = createNodePipelineAdapters();

		expect(typeof adapters.fs.writeText).toBe("function");
		expect(typeof adapters.clock.now).toBe("function");
		expect(typeof adapters.id.createId).toBe("function");
	});

	it("exposes pipeline runtime builders", () => {
		const pipeline = buildPipeline({
			id: "screen-generation",
			stages: ["read-source", "parse-source", "write-artifacts"],
		});

		expect(pipeline).toEqual({
			id: "screen-generation",
			stages: ["read-source", "parse-source", "write-artifacts"],
		});
		expect(typeof runPipeline).toBe("function");
	});
});
