import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { runGenerationBatch } from "./run-batch";

const PRDD_DIR = "data/client-imports/{id}/260527_prdd";
const tempRoots: string[] = [];

afterAll(async () => {
	await Promise.all(tempRoots.map((dir) => rm(dir, { force: true, recursive: true })));
});

async function tempRoot(): Promise<string> {
	const dir = await mkdtemp(path.join(tmpdir(), "cx-runbatch-"));
	tempRoots.push(dir);
	return dir;
}

async function tempSourceDir(screens: string[]): Promise<string> {
	const dir = await mkdtemp(path.join(tmpdir(), "cx-runbatch-src-"));
	tempRoots.push(dir);
	await Promise.all(
		screens.map((name) => copyFile(path.join(PRDD_DIR, name), path.join(dir, name))),
	);
	return dir;
}

describe("runGenerationBatch", () => {
	it("runs every matched screen through the fake pipeline and aggregates results", async () => {
		const artifactRoot = await tempRoot();
		const targetDir = await tempSourceDir(["NOVA-PRDD-PG-001-0.md", "NOVA-PRDD-PG-002-0.md"]);
		const result = await runGenerationBatch({
			artifactRoot,
			batchId: "test-batch",
			glob: "*-0.md",
			targetDir,
		});

		expect(result.batchId).toBe("test-batch");
		expect(result.results).toHaveLength(2);
		expect(result.results.map((entry) => entry.screen).sort()).toEqual([
			"NOVA-PRDD-PG-001-0",
			"NOVA-PRDD-PG-002-0",
		]);
		expect(result.okCount).toBe(2);
		expect(result.failCount).toBe(0);
		for (const entry of result.results) {
			expect(entry.ok).toBe(true);
			expect(entry.runId).toBe(`test-batch-${entry.screen}`);
		}
	});

	it("tags each run with the batch id in the manifest", async () => {
		const artifactRoot = await tempRoot();
		const result = await runGenerationBatch({
			artifactRoot,
			batchId: "tag-batch",
			glob: "NOVA-PRDD-PG-001-0.md",
			targetDir: PRDD_DIR,
		});

		const runDir = result.results[0]?.runDir;
		expect(runDir).toBeTruthy();
		const manifest = JSON.parse(
			await readFile(path.join(runDir as string, "manifest.json"), "utf8"),
		) as { tags: string[] };
		expect(manifest.tags).toEqual(["tag-batch"]);
	});

	it("derives a batch id when none is provided", async () => {
		const artifactRoot = await tempRoot();
		const result = await runGenerationBatch({
			artifactRoot,
			glob: "NOVA-PRDD-PG-001-0.md",
			targetDir: PRDD_DIR,
		});
		expect(result.batchId).toMatch(/^batch-/);
	});
});
