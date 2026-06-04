import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	createBatchId,
	createScreenSourceTarget,
	isMarkdownSourceFileName,
	listUploadedScreenSources,
	readScreenIdFromFileName,
	sanitizePathPart,
} from "./screen-inference-source";

describe("screen inference source helpers", () => {
	it("sanitizes upload path parts without changing safe screen ids", () => {
		expect(sanitizePathPart("NOVA-MBR-PG-001-0")).toBe("NOVA-MBR-PG-001-0");
		expect(sanitizePathPart("../bad path/화면")).toBe("___bad_path___");
	});

	it("creates yyyyMMdd batch ids", () => {
		expect(createBatchId(new Date("2026-06-04T12:00:00.000Z"))).toBe("20260604");
	});

	it("recognizes markdown source files", () => {
		expect(isMarkdownSourceFileName("NOVA-MBR-PG-001-0.md")).toBe(true);
		expect(isMarkdownSourceFileName("NOVA-MBR-PG-001-0.txt")).toBe(false);
	});

	it("reads screen ids from markdown file names", () => {
		expect(readScreenIdFromFileName("NOVA-MBR-PG-001-0.md")).toBe("NOVA-MBR-PG-001-0");
	});

	it("builds a data/client-imports target", () => {
		const repoRoot = "/repo";
		const target = createScreenSourceTarget({
			batchId: "20260604_new_screen",
			clientImportRoot: path.join(repoRoot, "data/client-imports"),
			fileName: "NOVA-MBR-PG-001-0.md",
			importId: "web-upload",
			repoRoot,
		});

		expect(target).toMatchObject({
			batchId: "20260604_new_screen",
			importId: "web-upload",
			path: "data/client-imports/web-upload/20260604_new_screen/NOVA-MBR-PG-001-0.md",
			screenId: "NOVA-MBR-PG-001-0",
			type: "file",
		});
		expect(target.absolutePath).toBe(
			path.join(
				repoRoot,
				"data/client-imports/web-upload/20260604_new_screen/NOVA-MBR-PG-001-0.md",
			),
		);
	});

	it("filters listed sources by import id", async () => {
		const repoRoot = await mkdtemp(path.join(os.tmpdir(), "screen-source-"));
		const clientImportRoot = path.join(repoRoot, "data/client-imports");
		const runRoot = path.join(repoRoot, "data/runs/screen-generation");
		await mkdir(path.join(clientImportRoot, "web-upload", "20260604"), { recursive: true });
		await mkdir(path.join(clientImportRoot, "{id}", "260528_mbr"), { recursive: true });
		await writeFile(
			path.join(clientImportRoot, "web-upload", "20260604", "NOVA-UPLOAD-PG-001-0.md"),
			"# upload",
			"utf8",
		);
		await writeFile(
			path.join(clientImportRoot, "{id}", "260528_mbr", "NOVA-MBR-PG-001-0.md"),
			"# fixture",
			"utf8",
		);

		const sources = await listUploadedScreenSources({
			clientImportRoot,
			importIds: ["web-upload"],
			repoRoot,
			runRoot,
		});

		expect(sources).toEqual([
			expect.objectContaining({
				importId: "web-upload",
				screenId: "NOVA-UPLOAD-PG-001-0",
			}),
		]);
	});
});
