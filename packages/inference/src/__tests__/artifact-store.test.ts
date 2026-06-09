import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ArtifactStore } from "../contracts";
import { FileArtifactStore } from "../stores/file-artifact-store";
import { MemoryArtifactStore } from "../testing/memory-artifact-store";

function artifactStoreContract(name: string, make: () => ArtifactStore) {
	describe(`ArtifactStore contract: ${name}`, () => {
		it("writeText/readText roundtrip", async () => {
			const s = make();
			await s.writeText("job1", "a.txt", "hello");
			expect(await s.readText("job1", "a.txt")).toBe("hello");
		});

		it("writeJson/readJson roundtrip", async () => {
			const s = make();
			await s.writeJson("job1", "a.json", { x: 1 });
			expect(await s.readJson<{ x: number }>("job1", "a.json")).toEqual({ x: 1 });
		});

		it("appendLine appends newline-terminated lines in order", async () => {
			const s = make();
			await s.appendLine("job1", "e.ndjson", '{"a":1}');
			await s.appendLine("job1", "e.ndjson", '{"a":2}');
			expect(await s.readText("job1", "e.ndjson")).toBe('{"a":1}\n{"a":2}\n');
		});

		it("readText throws on missing; exists reflects writes", async () => {
			const s = make();
			expect(await s.exists("job1", "none.txt")).toBe(false);
			await expect(s.readText("job1", "none.txt")).rejects.toThrow();
			await s.writeText("job1", "x.txt", "y");
			expect(await s.exists("job1", "x.txt")).toBe(true);
		});

		it("lists job ids that have artifacts", async () => {
			const s = make();
			await s.writeJson("job-b", "job.json", { jobId: "job-b" });
			await s.writeJson("job-a", "job.json", { jobId: "job-a" });

			expect(await s.listJobIds()).toEqual(["job-a", "job-b"]);
		});

		it("rejects ../ path escape", async () => {
			const s = make();
			await expect(s.writeText("job1", "../evil.txt", "x")).rejects.toThrow();
		});
	});
}

artifactStoreContract("memory", () => new MemoryArtifactStore());
artifactStoreContract(
	"file",
	() => new FileArtifactStore(mkdtempSync(path.join(tmpdir(), "cx-art-"))),
);
