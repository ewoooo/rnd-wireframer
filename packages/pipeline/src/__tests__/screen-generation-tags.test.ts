import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { runPipeline } from "@cx/pipeline";
import { afterAll, describe, expect, it } from "vitest";

const SOURCE = "data/client-imports/{id}/260527_prdd/NOVA-PRDD-PG-001-0.md";
const tempRoots: string[] = [];

afterAll(async () => {
	await Promise.all(tempRoots.map((dir) => rm(dir, { force: true, recursive: true })));
});

async function runFake(runId: string, tags?: string[]) {
	const rootDir = await mkdtemp(path.join(tmpdir(), "cx-tags-"));
	tempRoots.push(rootDir);
	await runPipeline("screen-generation", {
		agentMode: "fake",
		artifactStore: { rootDir },
		runId,
		source: { path: SOURCE, type: "file" },
		tags,
	});
	const manifest = JSON.parse(
		await readFile(path.join(rootDir, runId, "manifest.json"), "utf8"),
	) as { stageLayers: Array<{ layer: string; traceKeys: string[] }>; tags: string[] };
	return manifest;
}

describe("screen-generation manifest tags", () => {
	it("writes provided tags into the run manifest", async () => {
		const manifest = await runFake("tags-on", ["batch-xyz"]);
		expect(manifest.tags).toEqual(["batch-xyz"]);
	});

	it("defaults to an empty tag list when none are provided", async () => {
		const manifest = await runFake("tags-off");
		expect(manifest.tags).toEqual([]);
	});

	it("writes logical inference layer metadata into the run manifest", async () => {
		const manifest = await runFake("layered");

		expect(manifest.stageLayers.map((layer) => layer.layer)).toEqual([
			"understand",
			"compose",
			"revise",
		]);
		expect(manifest.stageLayers.find((layer) => layer.layer === "compose")?.traceKeys).toContain(
			"generation",
		);
	});
});
