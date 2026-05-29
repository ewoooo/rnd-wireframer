import {
	buildPipeline,
	createNodePipelineAdapters,
	mergeTableGenerationResultIntoTables,
	runPipeline,
	runSideEffects,
	sideEffectBoundary,
} from "@cx/pipeline";
import { runParseMarkdownSourceCommand } from "@cx/pipeline/parser";
import { createTestPipelineAdapters } from "@cx/pipeline/testing";
import type { SideEffectExecutionResult, SideEffectOperation } from "@cx/pipeline/types";
import { describe, expect, it } from "vitest";
import { createGenerationSmokeArtifactCommands } from "../pipelines/screen-generation/artifact-commands";

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

	it("writes the final result as a standalone RenderTree artifact", () => {
		const finalResult = {
			children: [
				{
					children: [],
					componentVersion: "0.1.0",
					metadata: { id: "screen", title: "Screen" },
					type: "Screen",
				},
			],
			metadata: { id: "sample" },
			version: "render-tree.v0.1",
		};

		const commands = createGenerationSmokeArtifactCommands({
			agentInput: {},
			agentResult: { payload: { renderTree: finalResult } },
			finalResult,
			outDir: "runs/sample",
			parseCommandResult: {},
			runnerRequest: {},
			sourceSpec: {},
			validationReport: {},
		});

		expect(commands).toContainEqual(
			expect.objectContaining({
				id: "write-final-result",
				input: expect.objectContaining({
					content: finalResult,
					targetPath: expect.stringContaining("final-result.json"),
				}),
				operation: "versioned-artifact-write",
			}),
		);
	});

	it("merges table generation results into table data without mutating input", () => {
		const tables = {
			areas: {
				areas: [
					tableArea("old-area", [{ kind: "component" as const, id: "old-component" }]),
					tableArea("unrelated-area", []),
				],
			},
			components: {
				components: [tableComponent("old-component"), tableComponent("unrelated-component")],
			},
			screenRoutes: {
				screenRoutes: [
					{
						id: "sample-route",
						moduleId: "preview",
						name: "Old",
						order: 1,
						processId: null,
					},
				],
			},
			screenVariants: {
				screenVariants: [
					{
						followUp: null,
						id: "sample",
						name: "Old",
						order: 1,
						screenRouteId: "sample-route",
						variantType: "base",
					},
				],
			},
			screens: {
				screens: [tableScreen("sample", "sample", ["old-area"])],
			},
		};
		const tableGenerationResult = {
			areas: [tableArea("new-area", [{ kind: "component" as const, id: "new-component" }])],
			components: [tableComponent("new-component")],
			schemaVersion: "table-generation-result.v0.1" as const,
			screen: tableScreen("sample", "sample", ["new-area"]),
		};

		const result = mergeTableGenerationResultIntoTables(tables, tableGenerationResult);

		expect(tables.areas.areas.map((area) => area.id)).toEqual(["old-area", "unrelated-area"]);
		expect(result.tables.screens.screens.map((screen) => screen.id)).toEqual(["sample"]);
		expect(result.tables.areas.areas.map((area) => area.id)).toEqual([
			"unrelated-area",
			"new-area",
		]);
		expect(result.tables.components.components.map((component) => component.id)).toEqual([
			"unrelated-component",
			"new-component",
		]);
		expect(result.tables.screenRoutes?.screenRoutes).toContainEqual(
			expect.objectContaining({ id: "sample-route", name: "Sample" }),
		);
	});
});

function tableScreen(id: string, screenVariantId: string, areaIds: string[]) {
	return {
		id,
		layout: "layout.screen.commerceDetailScreen",
		metadata: { title: "Sample" },
		screen: {
			regions: {
				bottom: tableRegion("Screen.Bottom", []),
				contents: tableRegion(
					"Screen.Contents",
					areaIds.map((areaId) => ({ kind: "area" as const, id: areaId })),
				),
				header: tableRegion("Screen.Header", []),
			},
			type: "screen.page" as const,
		},
		screenVariantId,
		version: "0.1.0",
	};
}

function tableRegion(
	type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header",
	children: Array<{ id: string; kind: "area" | "component" }>,
) {
	return {
		children,
		layout: "layout.region.plainStack",
		metadata: { title: type },
		type,
	};
}

function tableArea(id: string, children: Array<{ id: string; kind: "area" | "component" }>) {
	return {
		children,
		id,
		layout: "layout.area.productHeroSummary",
		metadata: { title: id },
		type: "area.dynamic" as const,
		version: "0.1.0",
	};
}

function tableComponent(id: string) {
	return {
		children: [{ component: { type: "AppBar" }, props: { title: id } }],
		id,
		layout: "layout.composite.componentAppBar",
		metadata: { title: id },
		type: "AppBar",
		version: "0.1.0",
	};
}
