import {
	buildPipeline,
	createFilePipelinePersistenceAdapter,
	createNodePipelineAdapters,
	createScreenGenerationStageLayers,
	defineStep,
	getScreenGenerationStageMessage,
	getScreenGenerationStageOrder,
	getScreenGenerationStagesByKind,
	runPipeline,
	runSideEffects,
	SCREEN_GENERATION_PIPELINE_ID,
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

	it("passes already-read markdown source through @cx/adapters/markdown", () => {
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
			steps: [
				defineStep({
					execute: () => ({ content: "# Source" }),
					id: "read-source",
					usesAI: false,
				}),
				defineStep({
					execute: () => ({ sourceSpec: {} }),
					id: "parse-source",
					usesAI: false,
				}),
				defineStep({
					execute: () => ({ ok: true }),
					id: "write-artifacts",
					usesAI: false,
				}),
			],
		});

		expect(pipeline.id).toBe("screen-generation");
		expect(pipeline.steps.map((step) => step.id)).toEqual([
			"read-source",
			"parse-source",
			"write-artifacts",
		]);
		expect(typeof runPipeline).toBe("function");
	});

	it("exposes screen-generation stage metadata as the stage SSOT", () => {
		expect(SCREEN_GENERATION_PIPELINE_ID).toBe("screen-generation");
		expect(getScreenGenerationStageOrder()).toEqual([
			"read-source",
			"parse-source",
			"derive-screen-intent",
			"plan-composition",
			"derive-decoration-plan",
			"select-pattern",
			"generate-render-tree",
			"validate-render-tree",
			"propose-components",
			"review-quality",
			"revise-render-tree-if-invalid",
			"validate-render-tree-after-revision",
			"write-artifacts",
		]);
		expect(getScreenGenerationStagesByKind("ai")).toEqual([
			"derive-screen-intent",
			"plan-composition",
			"select-pattern",
			"generate-render-tree",
			"propose-components",
			"review-quality",
			"revise-render-tree-if-invalid",
		]);
		expect(getScreenGenerationStageMessage("generate-render-tree")).toBe("Generating UI draft…");
		expect(createScreenGenerationStageLayers().map((layer) => [layer.layer, layer.stages])).toEqual(
			[
				["understand", ["read-source", "parse-source", "derive-screen-intent"]],
				[
					"compose",
					["plan-composition", "derive-decoration-plan", "select-pattern", "generate-render-tree"],
				],
				[
					"revise",
					[
						"validate-render-tree",
						"propose-components",
						"review-quality",
						"revise-render-tree-if-invalid",
						"validate-render-tree-after-revision",
						"write-artifacts",
					],
				],
			],
		);
	});

	it("exposes pipeline persistence helpers", () => {
		expect(typeof createFilePipelinePersistenceAdapter).toBe("function");
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
			designSkillSelection: {
				fallback: false,
				selectedSkill: { id: "detail-confirmation-screen" },
			},
			finalResult,
			layers: Object.fromEntries(
				createScreenGenerationStageLayers().map((layer) => [
					layer.layer,
					{ artifacts: layer.artifacts, traceKeys: layer.traceKeys },
				]),
			),
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
		const traceInput = trace?.input as {
			content: { designContextBundleSelection?: unknown; layers?: unknown };
			targetPath: string;
		};
		expect(traceInput.targetPath).toContain("trace.json");
		expect(traceInput.content.designContextBundleSelection).toEqual({ bundleRefs: [] });
		expect(traceInput.content).toMatchObject({
			designSkillSelection: {
				fallback: false,
				selectedSkill: { id: "detail-confirmation-screen" },
			},
		});
		expect(traceInput.content.layers).toMatchObject({
			compose: {
				artifacts: expect.arrayContaining(["composition-plan.json", "agent-result.json"]),
				traceKeys: expect.arrayContaining(["composition", "designSkillSelection", "generation"]),
			},
			revise: {
				artifacts: expect.arrayContaining(["validation-report.json", "final-result.json"]),
				traceKeys: expect.arrayContaining(["qualityReview", "revision"]),
			},
			understand: {
				artifacts: expect.arrayContaining(["source-spec.json", "screen-intent.json"]),
				traceKeys: expect.arrayContaining(["parseResult", "screenIntent"]),
			},
		});
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
			scores: {
				actionClarity: 4,
				densityFit: 4,
				fidelity: 5,
				hierarchy: 4,
				patternFit: 3,
				separation: 3,
			},
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
});
