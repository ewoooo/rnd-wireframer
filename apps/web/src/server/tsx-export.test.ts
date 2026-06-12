import { createJobStore } from "@cx/inference";
import { MemoryArtifactStore } from "@cx/inference/testing";
import type { RenderTreeNode } from "@cx/renderer";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import fixture from "../../../../packages/export-tsx/src/__tests__/fixtures/cart-fail-recovery.render-tree.json";
import {
	buildExportFileMap,
	buildExportResponse,
	resolveRepoRoot,
	zipExportFiles,
} from "./tsx-export";

const repoRoot = resolveRepoRoot();
const screenTree = fixture.children[0] as unknown as RenderTreeNode;
const JOB_ID = "job-test-1";

function cloneTree(): RenderTreeNode {
	return structuredClone(screenTree);
}

function createTestStores() {
	let n = 0;
	const artifactStore = new MemoryArtifactStore();
	const jobStore = createJobStore(artifactStore, {
		newId: () => `job-${++n}`,
		now: () => new Date(0).toISOString(),
	});
	return { artifactStore, jobStore };
}

describe("buildExportFileMap", () => {
	const files = buildExportFileMap({ jobId: JOB_ID, repoRoot, tree: cloneTree() });

	it("prefixes every path with the jobId directory", () => {
		expect(files.size).toBeGreaterThan(0);
		for (const filePath of files.keys()) {
			expect(filePath.startsWith(`${JOB_ID}/`)).toBe(true);
		}
	});

	it("includes the generated main.tsx and the scaffold files", () => {
		const mainTsx = files.get(`${JOB_ID}/main.tsx`);
		expect(typeof mainTsx).toBe("string");
		expect(mainTsx).toContain("export default function Screen()");
		for (const scaffoldPath of [
			"package.json",
			"tsconfig.json",
			"vite.config.ts",
			"index.html",
			"src/entry.tsx",
			"src/styles/reset.css",
			"src/styles/variables.css",
			"packages/external/package.json",
			"packages/external/src/index.ts",
			"packages/layout/package.json",
			"packages/layout/src/index.ts",
			"packages/schema/package.json",
			"packages/schema/src/index.ts",
		]) {
			expect(files.has(`${JOB_ID}/${scaffoldPath}`), scaffoldPath).toBe(true);
		}
	});

	it("excludes vendored test directories", () => {
		for (const filePath of files.keys()) {
			expect(filePath).not.toContain("__tests__");
			expect(filePath).not.toContain("__snapshots__");
		}
	});

	it("keeps binary assets as Uint8Array", () => {
		const heroPng = files.get(`${JOB_ID}/packages/external/src/assets/hero.png`);
		expect(heroPng).toBeInstanceOf(Uint8Array);
	});

	it("omits EXPORT_WARNINGS.txt for the fixture — divider props are expressed, not dropped", () => {
		// divider 계약이 Divider leaf로 emit되면서 fixture는 더 이상 warning을 만들지 않는다.
		expect(files.has(`${JOB_ID}/EXPORT_WARNINGS.txt`)).toBe(false);
	});

	it("includes EXPORT_WARNINGS.txt (one warning per line) when warnings exist", () => {
		const warningTree = cloneTree();
		const headerRegion = (warningTree.children ?? []).find(
			(child) => child.type === "Screen.Header",
		);
		expect(headerRegion).toBeDefined();
		if (headerRegion) headerRegion.layout = "layout.region.__unknown__";

		const warningFiles = buildExportFileMap({ jobId: JOB_ID, repoRoot, tree: warningTree });
		const warningsText = warningFiles.get(`${JOB_ID}/EXPORT_WARNINGS.txt`);
		expect(typeof warningsText).toBe("string");
		const lines = String(warningsText).trimEnd().split("\n");
		expect(lines.length).toBeGreaterThanOrEqual(1);
		expect(String(warningsText)).toContain("layout.region.__unknown__");
	});
});

describe("buildExportFileMap — @cx/* import resolvability guard", () => {
	const files = buildExportFileMap({ jobId: JOB_ID, repoRoot, tree: cloneTree() });
	const tsconfig = JSON.parse(String(files.get(`${JOB_ID}/tsconfig.json`))) as {
		compilerOptions: { paths: Record<string, string[]> };
	};
	const paths = tsconfig.compilerOptions.paths;

	function collectCxSpecifiers(): Map<string, string[]> {
		const bySpecifier = new Map<string, string[]>();
		for (const [filePath, content] of files) {
			if (typeof content !== "string") continue;
			if (!/\.(ts|tsx)$/.test(filePath) || filePath.endsWith(".d.ts")) continue;
			for (const match of content.matchAll(/(?:from|import)\s*["'](@cx\/[^"']+)["']/g)) {
				const specifier = match[1];
				const usages = bySpecifier.get(specifier) ?? [];
				usages.push(filePath);
				bySpecifier.set(specifier, usages);
			}
		}
		return bySpecifier;
	}

	it("resolves every @cx specifier (generated + vendored) to a real file in the zip", () => {
		const bySpecifier = collectCxSpecifiers();
		expect(bySpecifier.size).toBeGreaterThan(0);
		for (const [specifier, usages] of bySpecifier) {
			const mapped = paths[specifier];
			expect(mapped, `tsconfig paths missing "${specifier}" (used by ${usages[0]})`).toBeDefined();
			const target = `${JOB_ID}/${mapped[0].replace(/^\.\//, "")}`;
			expect(files.has(target), `"${specifier}" -> ${target} not in zip`).toBe(true);
		}
	});

	it("covers the generated main.tsx import surface", () => {
		const bySpecifier = collectCxSpecifiers();
		const mainSpecifiers = [...bySpecifier.entries()]
			.filter(([, usages]) => usages.includes(`${JOB_ID}/main.tsx`))
			.map(([specifier]) => specifier);
		expect(mainSpecifiers).toContain("@cx/external");
		expect(mainSpecifiers).toContain("@cx/layout/primitives");
		// region 래퍼(PlainStackRegion)까지 primitive-target으로 unwrap돼 이 fixture의
		// main.tsx에는 registry import가 없다 (named fallback 패밀리가 나오면 다시 생긴다).
		expect(mainSpecifiers).not.toContain("@cx/layout/registry");
	});

	it("mirrors tsconfig paths in the vite config aliases", () => {
		const viteConfig = String(files.get(`${JOB_ID}/vite.config.ts`));
		for (const [specifier, [target]] of Object.entries(paths)) {
			expect(viteConfig).toContain(`find: ${JSON.stringify(specifier)}`);
			expect(viteConfig).toContain(`replacement: local(${JSON.stringify(target)})`);
		}
	});
});

describe("zipExportFiles — round trip", () => {
	it("unzips back to the same main.tsx content", () => {
		const files = buildExportFileMap({ jobId: JOB_ID, repoRoot, tree: cloneTree() });
		const unzipped = unzipSync(zipExportFiles(files));
		expect(strFromU8(unzipped[`${JOB_ID}/main.tsx`])).toBe(files.get(`${JOB_ID}/main.tsx`));
		expect(Object.keys(unzipped).sort()).toEqual([...files.keys()].sort());
	});
});

describe("buildExportResponse", () => {
	it("returns 404 JSON when the job does not exist", async () => {
		const { artifactStore, jobStore } = createTestStores();
		const response = await buildExportResponse({
			artifactStore,
			jobId: "job-missing",
			jobStore,
			repoRoot,
		});
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: "job not found" });
	});

	it("returns 404 JSON when the render-tree artifact is missing", async () => {
		const { artifactStore, jobStore } = createTestStores();
		const job = await jobStore.createJob({
			input: { screenCode: "NO-TREE" },
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
		});
		const response = await buildExportResponse({
			artifactStore,
			jobId: job.jobId,
			jobStore,
			repoRoot,
		});
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: "render-tree artifact not found" });
	});

	it("returns a zip attachment for a job with a render-tree artifact", async () => {
		const { artifactStore, jobStore } = createTestStores();
		const job = await jobStore.createJob({
			input: { screenCode: "OK" },
			pipelineId: "screen-generation",
			pipelineVersion: "v1",
		});
		await artifactStore.writeJson(job.jobId, "context/render-tree.json", fixture);

		const response = await buildExportResponse({
			artifactStore,
			jobId: job.jobId,
			jobStore,
			repoRoot,
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/zip");
		expect(response.headers.get("Content-Disposition")).toBe(
			`attachment; filename="${job.jobId}-tsx-export.zip"`,
		);
		const bytes = new Uint8Array(await response.arrayBuffer());
		expect([bytes[0], bytes[1]]).toEqual([0x50, 0x4b]);
		const unzipped = unzipSync(bytes);
		expect(strFromU8(unzipped[`${job.jobId}/main.tsx`])).toContain(
			"export default function Screen()",
		);
	});
});
