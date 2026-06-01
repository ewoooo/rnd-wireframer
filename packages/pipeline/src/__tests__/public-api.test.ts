import {
	buildPipeline,
	createNodePipelineAdapters,
	mergeRenderTreeIntoTables,
	mergeTableGenerationResultIntoTables,
	renderTreeToTableGenerationResult,
	runPipeline,
	runSideEffects,
	sideEffectBoundary,
} from "@cx/pipeline";
import { runParseMarkdownSourceCommand } from "@cx/pipeline/parser";
import { createTestPipelineAdapters } from "@cx/pipeline/testing";
import type { SideEffectExecutionResult, SideEffectOperation } from "@cx/pipeline/types";
import type { RenderTreeContract, RenderTreeNodeContract } from "@cx/schema";
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
			designContextBundleSelection: { bundleRefs: [] },
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
		expect(commands).toContainEqual(
			expect.objectContaining({
				id: "write-decoration-plan",
				input: expect.objectContaining({
					targetPath: expect.stringContaining("decoration-plan.json"),
				}),
			}),
		);
		// Intermediate scaffolding (e.g. design-context bundle selection) is consolidated into trace.json.
		const trace = commands.find((command) => command.id === "write-trace");
		const traceInput = trace?.input as { content: { designContextBundleSelection?: unknown }; targetPath: string };
		expect(traceInput.targetPath).toContain("trace.json");
		expect(traceInput.content.designContextBundleSelection).toEqual({ bundleRefs: [] });
	});

	it("writes the component proposal as a standalone artifact", () => {
		const componentProposal = {
			schemaVersion: "component-proposal.v0.1",
			proposals: [],
		};

		const commands = createGenerationSmokeArtifactCommands({
			agentInput: {},
			agentResult: {},
			componentProposal,
			designContextBundleSelection: { bundleRefs: [] },
			finalResult: {},
			outDir: "runs/sample",
			parseCommandResult: {},
			runnerRequest: {},
			sourceSpec: {},
			validationReport: {},
		});

		expect(commands).toContainEqual(
			expect.objectContaining({
				id: "write-component-proposal",
				input: expect.objectContaining({
					content: componentProposal,
					targetPath: expect.stringContaining("component-proposal.json"),
				}),
			}),
		);
	});

	it("writes the quality review as a standalone artifact", () => {
		const designCritique = {
			schemaVersion: "quality-inspection.v0.1",
			scores: { hierarchy: 4, separation: 3, fidelity: 5 },
			findings: [],
		};

		const commands = createGenerationSmokeArtifactCommands({
			agentInput: {},
			agentResult: {},
			designCritique,
			designContextBundleSelection: { bundleRefs: [] },
			finalResult: {},
			outDir: "runs/sample",
			parseCommandResult: {},
			runnerRequest: {},
			sourceSpec: {},
			validationReport: {},
		});

		expect(commands).toContainEqual(
			expect.objectContaining({
				id: "write-quality-review",
				input: expect.objectContaining({
					content: designCritique,
					targetPath: expect.stringContaining("quality-review.json"),
				}),
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

	it("decomposes final RenderTree into table rows for apply", () => {
		const renderTree: RenderTreeContract = {
			children: [
				{
					children: [
						{
							children: [
								{
									children: [
										{
											componentVersion: "0.1.0",
											layout: "layout.composite.componentAppBar",
											metadata: { id: "component-appbar", title: "AppBar" },
											props: { title: "약관 동의" },
											type: "AppBar",
										},
									],
									componentVersion: "0.1.0",
									layout: "layout.area.areaAppBar",
									metadata: { id: "area-header", title: "Header area" },
									type: "area.static",
								},
							],
							componentVersion: "0.1.0",
							layout: "layout.region.header",
							metadata: { id: "screen.header", title: "Header" },
							type: "Screen.Header",
						},
						{
							children: [],
							componentVersion: "0.1.0",
							layout: "layout.region.contents",
							metadata: { id: "screen.contents", title: "Contents" },
							type: "Screen.Contents",
						},
						{
							children: [],
							componentVersion: "0.1.0",
							layout: "layout.region.bottom",
							metadata: { id: "screen.bottom", title: "Bottom" },
							type: "Screen.Bottom",
						},
					],
					componentVersion: "0.1.0",
					layout: "layout.screen.commerceDetailScreen",
					metadata: { id: "screen", title: "Screen" },
					type: "Screen",
				},
			],
			metadata: { id: "screen" },
			version: "render-tree.v0.1",
		};

		const result = renderTreeToTableGenerationResult(renderTree);

		expect(result.tableGenerationResult.screen.screen.regions.header.children).toEqual([
			{ id: "area-header", kind: "area" },
		]);
		expect(result.tableGenerationResult.areas).toHaveLength(1);
		expect(result.tableGenerationResult.components).toContainEqual(
			expect.objectContaining({
				children: [{ component: { type: "AppBar" }, props: { title: "약관 동의" } }],
				id: "component-appbar",
				layout: "layout.composite.componentAppBar",
				type: "AppBar",
			}),
		);
	});

	it("drops non-base state nodes from default table projection", () => {
		const renderTree: RenderTreeContract = {
			children: [
				{
					children: [
						screenRegionNode("Screen.Header", "layout.region.header", []),
						screenRegionNode("Screen.Contents", "layout.region.contents", [
							{
								children: [
									{
										componentVersion: "0.1.0",
										display: { stateRole: "base" },
										layout: "layout.composite.componentListText",
										metadata: { id: "list-base", title: "Base row" },
										props: { subText: "Base row", table: "dot" },
										type: "ListText",
									},
									{
										componentVersion: "0.1.0",
										display: {
											stateRole: "loading",
											when: { bind: "terms.loading", default: false },
										},
										layout: "layout.composite.componentListText",
										metadata: { id: "list-loading", title: "Loading row" },
										props: { subText: "Loading row", table: "dot" },
										type: "ListText",
									},
								],
								componentVersion: "0.1.0",
								layout: "layout.area.listStack",
								metadata: { id: "terms-list", title: "약관 목록 조회" },
								type: "area.dynamic",
							},
						]),
						screenRegionNode("Screen.Bottom", "layout.region.bottom", [
							{
								children: [
									{
										componentVersion: "0.1.0",
										display: { stateRole: "disabled" },
										layout: "layout.composite.componentActionButton",
										metadata: { id: "cta-disabled", title: "Disabled CTA" },
										props: { label: "다음" },
										type: "ActionButton",
									},
								],
								componentVersion: "0.1.0",
								layout: "layout.area.bottomActionArea",
								metadata: { id: "bottom-area", title: "하단 액션" },
								type: "area.dynamic",
							},
						]),
					],
					componentVersion: "0.1.0",
					layout: "layout.screen.commerceDetailScreen",
					metadata: { id: "screen", title: "Screen" },
					type: "Screen",
				},
			],
			metadata: { id: "screen" },
			version: "render-tree.v0.1",
		};

		const result = renderTreeToTableGenerationResult(renderTree);

		expect(result.tableGenerationResult.components.map((component) => component.id)).toEqual([
			"list-base",
		]);
		expect(
			result.tableGenerationResult.areas.find((area) => area.id === "bottom-area")?.children,
		).toEqual([]);
		expect(result.warnings).toContain(
			"Dropped non-base state node from default table projection: list-loading",
		);
		expect(result.warnings).toContain(
			"Dropped non-base state node from default table projection: cta-disabled",
		);
	});

	it("merges final RenderTree rows into table data", () => {
		const tables = {
			areas: { areas: [tableArea("old-area", [])] },
			components: { components: [tableComponent("old-component")] },
			screenRoutes: { screenRoutes: [] },
			screenVariants: { screenVariants: [] },
			screens: { screens: [tableScreen("screen", "screen", ["old-area"])] },
		};
		const renderTree: RenderTreeContract = {
			children: [
				{
					children: [
						screenRegionNode("Screen.Header", "layout.region.header", []),
						screenRegionNode("Screen.Contents", "layout.region.contents", [
							{
								children: [],
								componentVersion: "0.1.0",
								layout: "layout.area.productHeroSummary",
								metadata: { id: "new-area", title: "New area" },
								type: "area.dynamic",
							},
						]),
						screenRegionNode("Screen.Bottom", "layout.region.bottom", []),
					],
					componentVersion: "0.1.0",
					layout: "layout.screen.commerceDetailScreen",
					metadata: { id: "screen", title: "Screen" },
					type: "Screen",
				},
			],
			metadata: { id: "screen" },
			version: "render-tree.v0.1",
		};

		const result = mergeRenderTreeIntoTables(tables, renderTree);

		expect(result.tables.screens.screens).toHaveLength(1);
		expect(result.tables.areas.areas.map((area) => area.id)).toEqual(["new-area"]);
		expect(result.tables.components.components.map((component) => component.id)).toEqual([
			"old-component",
		]);
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
		layout: readRegionLayout(type),
		metadata: { title: type },
		type,
	};
}

function readRegionLayout(type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header") {
	if (type === "Screen.Header") return "layout.region.header";
	if (type === "Screen.Contents") return "layout.region.contents";
	return "layout.region.bottom";
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

function screenRegionNode(
	type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header",
	layout: string,
	children: RenderTreeNodeContract[],
) {
	return {
		children,
		componentVersion: "0.1.0",
		layout,
		metadata: { id: type, title: type },
		type,
	};
}
