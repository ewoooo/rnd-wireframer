import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { globToRegExp, resolveBatchTargets } from "./resolve-targets";

const tempDirs: string[] = [];

afterAll(async () => {
	await Promise.all(tempDirs.map((dir) => rm(dir, { force: true, recursive: true })));
});

async function makeFixtureDir(files: string[]): Promise<string> {
	const dir = await mkdtemp(path.join(tmpdir(), "cx-batch-"));
	tempDirs.push(dir);
	await Promise.all(files.map((name) => writeFile(path.join(dir, name), "# fixture\n")));
	return dir;
}

describe("globToRegExp", () => {
	it("matches with * wildcard", () => {
		const re = globToRegExp("*-0.md");
		expect(re.test("NOVA-PRDD-PG-001-0.md")).toBe(true);
		expect(re.test("NOVA-PRDD-PG-001-E1.md")).toBe(false);
	});

	it("matches a single character with ?", () => {
		const re = globToRegExp("file-?.md");
		expect(re.test("file-1.md")).toBe(true);
		expect(re.test("file-12.md")).toBe(false);
	});

	it("escapes regex metacharacters in literals", () => {
		const re = globToRegExp("a.b+c.md");
		expect(re.test("a.b+c.md")).toBe(true);
		expect(re.test("aXbXc.md")).toBe(false);
	});

	it("anchors to the full string", () => {
		const re = globToRegExp("*.md");
		expect(re.test("x.md.bak")).toBe(false);
	});
});

describe("resolveBatchTargets", () => {
	it("collects only .md files sorted by name as absolute paths", async () => {
		const dir = await makeFixtureDir(["b.md", "a.md", "note.txt", "c.md"]);
		const targets = await resolveBatchTargets(dir);
		expect(targets).toEqual([
			path.join(dir, "a.md"),
			path.join(dir, "b.md"),
			path.join(dir, "c.md"),
		]);
	});

	it("applies the glob filter against the basename", async () => {
		const dir = await makeFixtureDir(["X-0.md", "X-E1.md", "Y-0.md"]);
		const targets = await resolveBatchTargets(dir, "*-0.md");
		expect(targets).toEqual([path.join(dir, "X-0.md"), path.join(dir, "Y-0.md")]);
	});

	it("returns an empty list for a missing directory", async () => {
		const targets = await resolveBatchTargets(path.join(tmpdir(), "cx-batch-does-not-exist-xyz"));
		expect(targets).toEqual([]);
	});
});
