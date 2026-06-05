import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getComponentCatalogEntry } from "@cx/components/catalog";
import {
	resolveCompositeLayoutByComponentType,
	resolveRegionLayoutFromScreenLayout,
} from "@cx/layout-pattern-store/resolver";
import { runPipeline } from "@cx/pipeline";
import type { PipelineProgressEvent, ScreenGenerationReferencesInput } from "@cx/pipeline/types";
import { afterAll, describe, expect, it } from "vitest";

const SOURCE = "data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md";
const tempRoots: string[] = [];

afterAll(async () => {
	await Promise.all(tempRoots.map((dir) => rm(dir, { force: true, recursive: true })));
});

async function runFake(
	runId: string,
	tags?: string[],
	references?: ScreenGenerationReferencesInput,
) {
	const rootDir = await mkdtemp(path.join(tmpdir(), "cx-tags-"));
	tempRoots.push(rootDir);
	const progressEvents: PipelineProgressEvent[] = [];
	await runPipeline("screen-generation", {
		agentMode: "fake",
		artifactStore: { rootDir },
		onProgress: (event) => {
			progressEvents.push(event);
		},
		references,
		runId,
		source: { path: SOURCE, type: "file" },
		tags,
	});
	const artifactFiles = await readdir(path.join(rootDir, runId, "artifacts"));
	const manifest = JSON.parse(
		await readFile(path.join(rootDir, runId, "manifest.json"), "utf8"),
	) as { stageLayers: Array<{ layer: string; traceKeys: string[] }>; tags: string[] };
	const pipelineStatus = JSON.parse(
		await readFile(path.join(rootDir, runId, "pipeline-status.json"), "utf8"),
	) as {
		currentStage?: string;
		runId: string;
		status: string;
		stages: Record<string, { status: string }>;
	};
	const pipelineEvents = await readFile(
		path.join(rootDir, runId, "pipeline-events.ndjson"),
		"utf8",
	);
	const trace = JSON.parse(
		await readFile(path.join(rootDir, runId, "artifacts/trace.json"), "utf8"),
	);
	return { artifactFiles, manifest, pipelineEvents, pipelineStatus, progressEvents, trace };
}

describe("screen-generation manifest tags", () => {
	it("writes provided tags into the run manifest", async () => {
		const { manifest } = await runFake("tags-on", ["batch-xyz"]);
		expect(manifest.tags).toEqual(["batch-xyz"]);
	});

	it("defaults to an empty tag list when none are provided", async () => {
		const { manifest } = await runFake("tags-off");
		expect(manifest.tags).toEqual([]);
	});

	it("writes logical inference layer metadata into the run manifest", async () => {
		const { manifest, trace } = await runFake("layered");

		expect(manifest.stageLayers.map((layer) => layer.layer)).toEqual([
			"understand",
			"compose",
			"revise",
		]);
		expect(manifest.stageLayers.find((layer) => layer.layer === "compose")?.traceKeys).toContain(
			"generation",
		);
		expect(trace.layers.compose.traceKeys).toContain("designSkillSelection");
		expect(trace.designSkillSelection.selectedSkill.id).toBeTruthy();
	});

	it("emits stage progress events while running the pipeline", async () => {
		const { progressEvents } = await runFake("progress-events");

		expect(
			progressEvents.filter((event) => event.status === "started").map((event) => event.stage),
		).toEqual([
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
			"write-artifacts",
		]);
		expect(progressEvents.at(-1)).toMatchObject({
			runId: "progress-events",
			stage: "write-artifacts",
			status: "completed",
		});
	});

	it("persists pipeline status and event log while running the pipeline", async () => {
		const { pipelineEvents, pipelineStatus } = await runFake("persisted-status");

		expect(pipelineStatus).toMatchObject({
			runId: "persisted-status",
			schemaVersion: "pipeline-run-status.v0.1",
			status: "completed",
		});
		expect(pipelineStatus.currentStage).toBeUndefined();
		expect(pipelineStatus.stages["read-source"]?.status).toBe("completed");
		expect(pipelineStatus.stages["revise-render-tree-if-invalid"]?.status).toBe("skipped");
		expect(pipelineStatus.stages["validate-render-tree-after-revision"]?.status).toBe("skipped");
		expect(pipelineStatus.stages["write-artifacts"]?.status).toBe("completed");
		expect(pipelineEvents.trim().split("\n")).toHaveLength(22);
		expect(pipelineEvents).toContain('"stage":"read-source"');
		expect(pipelineEvents).toContain('"status":"completed"');
	});

	it("runs screen-generation through the Step runner path by default", async () => {
		const defaultPath = await runFake("default-path");

		expect(defaultPath.pipelineEvents.trim().split("\n")).toHaveLength(22);
		expect(defaultPath.pipelineStatus).toMatchObject({
			runId: "default-path",
			schemaVersion: "pipeline-run-status.v0.1",
			status: "completed",
		});
		expect(defaultPath.pipelineStatus.currentStage).toBeUndefined();
		expect(
			defaultPath.progressEvents
				.filter((event) => event.status === "started")
				.map((event) => event.stage),
		).toEqual([
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
			"write-artifacts",
		]);
		expect(defaultPath.manifest.stageLayers.map((layer) => layer.layer)).toEqual([
			"understand",
			"compose",
			"revise",
		]);
		expect(defaultPath.trace.layers.revise.traceKeys).toContain("initialValidationReport");
	});

	it("runs AI stages through the Step runner agent adapter", async () => {
		const { trace } = await runFake("ai-step-adapter-path");

		expect(trace.screenIntent.runnerRequest.taskKind).toBe("screen-intent");
		expect(trace.composition.runnerRequest.taskKind).toBe("composition-planning");
		expect(trace.patternSelection.runnerRequest.taskKind).toBe("pattern-selection");
		expect(trace.generation.runnerRequest.taskKind).toBe("screen-generation");
		expect(trace.componentProposal.runnerRequest.taskKind).toBe("component-proposal");
		expect(trace.qualityReview.runnerRequest.taskKind).toBe("quality-review");
		expect(trace.generation.runnerRequest.input.context).toEqual(trace.generation.input.context);
		expect(trace.qualityReview.runnerRequest.input.context).toEqual(
			trace.qualityReview.input.context,
		);
	});

	it("uses injected component and layout refs while building screen-generation context", async () => {
		const componentLookups: string[] = [];
		const componentLayoutLookups: string[] = [];
		const regionLayoutLookups: string[] = [];

		await runFake("injected-refs", undefined, {
			componentCatalogs: {
				getEntry: (type) => {
					componentLookups.push(type);
					return getComponentCatalogEntry(type);
				},
			},
			layoutCatalogs: {
				resolveComponentLayout: (input) => {
					componentLayoutLookups.push(input.componentType ?? input.sourceComponentId);
					return resolveCompositeLayoutByComponentType(
						input.componentType ?? input.sourceComponentId,
					);
				},
				resolveRegionLayout: (input) => {
					regionLayoutLookups.push(input.type);
					return resolveRegionLayoutFromScreenLayout(input);
				},
			},
		});

		expect(componentLookups).toContain("AppBar");
		expect(componentLookups).toContain("CardSummary");
		expect(componentLayoutLookups).toContain("AppBar");
		expect(regionLayoutLookups).toContain("Screen.Header");
		expect(regionLayoutLookups).toContain("Screen.Contents");
		expect(regionLayoutLookups.length).toBeGreaterThan(0);
	});
});
