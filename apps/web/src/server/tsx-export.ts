import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { emitScreenTsx } from "@cx/export-tsx";
import type { ArtifactStore, JobStore } from "@cx/inference/contracts";
import type { RenderTreeNode } from "@cx/renderer";
import { RENDER_TREE_NODE_TYPE } from "@cx/schema";
import { strToU8, zipSync } from "fflate";

export type ExportFileMap = Map<string, string | Uint8Array>;

const RENDER_TREE_ARTIFACT_PATH = "context/render-tree.json";

/** zip에 동봉하는 워크스페이스 패키지. 생성 코드(@cx/external, @cx/layout/*)와
 * 그 vendored 소스의 @cx/* import 그래프(external→schema, layout→external/schema)를 닫는 최소 집합. */
const VENDOR_PACKAGE_DIRS = ["external", "layout", "schema"] as const;

/** zip 안에서 텍스트로 다루는 확장자. 그 외(png 등)는 바이너리(Uint8Array) 그대로. */
const TEXT_FILE_EXTENSIONS = new Set([".css", ".json", ".md", ".svg", ".ts", ".tsx"]);

const EXCLUDED_DIR_NAMES = new Set(["__tests__", "__snapshots__"]);
const EXCLUDED_FILE_NAMES = new Set([".DS_Store"]);

/** 정적 export 패키지의 npm 의존성. 루트/vendored package.json과 버전을 맞춘다. */
const EXPORT_DEPENDENCIES = {
	react: "^19.2.6",
	"react-dom": "^19.2.6",
	zod: "^4.4.3",
} as const;

const EXPORT_DEV_DEPENDENCIES = {
	"@types/node": "^25.9.0",
	"@types/react": "^19.2.14",
	"@types/react-dom": "^19.2.3",
	"@vitejs/plugin-react": "^5.1.0",
	typescript: "^6.0.3",
	vite: "^7.3.0",
} as const;

export function resolveRepoRoot(cwd = process.cwd()): string {
	return cwd.endsWith(`${path.sep}apps${path.sep}web`) ? path.resolve(cwd, "../..") : cwd;
}

/**
 * inference RenderTree(루트 Screen 노드) → standalone TSX 패키지 파일맵.
 * key는 zip 내부 경로(`{jobId}/...`), value는 텍스트 또는 바이너리.
 */
export function buildExportFileMap(input: {
	data?: Record<string, unknown>;
	jobId: string;
	repoRoot?: string;
	tree: RenderTreeNode;
}): ExportFileMap {
	const repoRoot = input.repoRoot ?? resolveRepoRoot();
	const { code, warnings } = emitScreenTsx({ data: input.data ?? {}, tree: input.tree });
	const files: ExportFileMap = new Map();
	const put = (relativePath: string, content: string | Uint8Array) => {
		files.set(`${input.jobId}/${relativePath}`, content);
	};

	const aliasEntries = collectVendorFiles(repoRoot, put);

	put("main.tsx", code);
	put("package.json", renderPackageJson(input.jobId));
	put("tsconfig.json", renderTsconfigJson(aliasEntries));
	put("vite.config.ts", renderViteConfig(aliasEntries));
	put("index.html", renderIndexHtml(input.jobId));
	put("src/entry.tsx", renderEntryTsx());
	put(
		"src/styles/reset.css",
		readFileSync(path.join(repoRoot, "packages/external/src/styles/reset.css"), "utf8"),
	);
	put(
		"src/styles/variables.css",
		readFileSync(path.join(repoRoot, "packages/external/src/tokens/variables.css"), "utf8"),
	);
	if (warnings.length > 0) put("EXPORT_WARNINGS.txt", `${warnings.join("\n")}\n`);

	return files;
}

/** 파일맵 → zip 바이트. 디렉터리 엔트리 없이 경로 키 그대로 압축한다. */
export function zipExportFiles(files: ExportFileMap): Uint8Array {
	const zippable: Record<string, Uint8Array> = {};
	for (const [filePath, content] of files) {
		zippable[filePath] = typeof content === "string" ? strToU8(content) : content;
	}
	return zipSync(zippable);
}

/**
 * 라우트 본체. jobId 검증 → job/render-tree artifact 확인(부재 시 404 JSON) →
 * 파일맵 → zip 응답(200, application/zip, attachment).
 */
export async function buildExportResponse(input: {
	artifactStore: ArtifactStore;
	jobId: string;
	jobStore: JobStore;
	repoRoot?: string;
}): Promise<Response> {
	const { artifactStore, jobId, jobStore } = input;
	if (!/^[A-Za-z0-9._-]+$/.test(jobId)) {
		return Response.json({ error: "job not found" }, { status: 404 });
	}
	try {
		await jobStore.getJob(jobId);
	} catch {
		return Response.json({ error: "job not found" }, { status: 404 });
	}
	if (!(await artifactStore.exists(jobId, RENDER_TREE_ARTIFACT_PATH))) {
		return Response.json({ error: "render-tree artifact not found" }, { status: 404 });
	}

	const document = await artifactStore.readJson<unknown>(jobId, RENDER_TREE_ARTIFACT_PATH);
	const tree = findScreenNode(document);
	if (!tree) {
		return Response.json(
			{ error: "render-tree artifact has no Screen root node" },
			{ status: 404 },
		);
	}

	const files = buildExportFileMap({ jobId, repoRoot: input.repoRoot, tree });
	const zipped = zipExportFiles(files);
	return new Response(new Uint8Array(zipped), {
		headers: {
			"Content-Disposition": `attachment; filename="${jobId}-tsx-export.zip"`,
			"Content-Type": "application/zip",
		},
		status: 200,
	});
}

/** render-tree.json 문서(루트 래퍼 또는 Screen 노드 자체)에서 Screen 노드를 찾는다. */
function findScreenNode(document: unknown): RenderTreeNode | undefined {
	if (!document || typeof document !== "object") return undefined;
	const candidate = document as { children?: unknown[]; type?: unknown };
	if (candidate.type === RENDER_TREE_NODE_TYPE.screen) return candidate as RenderTreeNode;
	const screenChild = (candidate.children ?? []).find(
		(child) =>
			!!child &&
			typeof child === "object" &&
			(child as { type?: unknown }).type === RENDER_TREE_NODE_TYPE.screen,
	);
	return screenChild as RenderTreeNode | undefined;
}

type AliasEntry = {
	/** import specifier — 예: "@cx/layout/primitives" */
	specifier: string;
	/** zip 루트 기준 상대 경로 — 예: "./packages/layout/src/components/primitives/index.ts" */
	target: string;
};

/**
 * vendored 패키지(package.json + src/, 테스트 제외)를 파일맵에 싣고,
 * 각 package.json의 exports 맵에서 specifier→파일 alias 목록을 만든다.
 */
function collectVendorFiles(
	repoRoot: string,
	put: (relativePath: string, content: string | Uint8Array) => void,
): AliasEntry[] {
	const aliasEntries: AliasEntry[] = [];
	for (const dirName of VENDOR_PACKAGE_DIRS) {
		const packageDir = path.join(repoRoot, "packages", dirName);
		const packageJsonText = readFileSync(path.join(packageDir, "package.json"), "utf8");
		put(`packages/${dirName}/package.json`, packageJsonText);
		aliasEntries.push(...readAliasEntries(dirName, packageJsonText));
		walkSourceDir(path.join(packageDir, "src"), `packages/${dirName}/src`, put);
	}
	return aliasEntries.sort((a, b) => b.specifier.length - a.specifier.length);
}

/** package.json exports 맵(없으면 main)을 specifier→target alias로 환원한다. */
function readAliasEntries(dirName: string, packageJsonText: string): AliasEntry[] {
	const parsed = JSON.parse(packageJsonText) as {
		exports?: Record<string, string>;
		main?: string;
		name: string;
	};
	const exportsMap = parsed.exports ?? { ".": parsed.main ?? "./src/index.ts" };
	return Object.entries(exportsMap).map(([exportKey, exportTarget]) => ({
		specifier: exportKey === "." ? parsed.name : `${parsed.name}/${exportKey.slice(2)}`,
		target: `./packages/${dirName}/${exportTarget.slice(2)}`,
	}));
}

function walkSourceDir(
	absoluteDir: string,
	relativeDir: string,
	put: (relativePath: string, content: string | Uint8Array) => void,
): void {
	for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;
			walkSourceDir(path.join(absoluteDir, entry.name), `${relativeDir}/${entry.name}`, put);
			continue;
		}
		if (!entry.isFile() || EXCLUDED_FILE_NAMES.has(entry.name)) continue;
		const absolutePath = path.join(absoluteDir, entry.name);
		const relativePath = `${relativeDir}/${entry.name}`;
		if (TEXT_FILE_EXTENSIONS.has(path.extname(entry.name))) {
			put(relativePath, readFileSync(absolutePath, "utf8"));
		} else {
			put(relativePath, new Uint8Array(readFileSync(absolutePath)));
		}
	}
}

function renderPackageJson(jobId: string): string {
	const name = `${jobId.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}-tsx-export`;
	const manifest = {
		name,
		private: true,
		type: "module",
		scripts: { build: "vite build", dev: "vite" },
		dependencies: EXPORT_DEPENDENCIES,
		devDependencies: EXPORT_DEV_DEPENDENCIES,
	};
	return `${JSON.stringify(manifest, null, "\t")}\n`;
}

function renderTsconfigJson(aliasEntries: AliasEntry[]): string {
	const paths = Object.fromEntries(aliasEntries.map((entry) => [entry.specifier, [entry.target]]));
	const tsconfig = {
		compilerOptions: {
			isolatedModules: true,
			jsx: "react-jsx",
			lib: ["ES2022", "DOM", "DOM.Iterable"],
			module: "ESNext",
			moduleResolution: "bundler",
			noEmit: true,
			paths,
			skipLibCheck: true,
			strict: true,
			target: "ES2022",
			types: ["node", "vite/client"],
		},
		include: ["main.tsx", "vite.config.ts", "src", "packages"],
	};
	return `${JSON.stringify(tsconfig, null, "\t")}\n`;
}

function renderViteConfig(aliasEntries: AliasEntry[]): string {
	const aliasLines = aliasEntries
		.map(
			(entry) =>
				`\t\t\t{ find: ${JSON.stringify(entry.specifier)}, replacement: local(${JSON.stringify(entry.target)}) },`,
		)
		.join("\n");
	return [
		'import { fileURLToPath } from "node:url";',
		'import react from "@vitejs/plugin-react";',
		'import { defineConfig } from "vite";',
		"",
		"const local = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url));",
		"",
		"export default defineConfig({",
		"\tplugins: [react()],",
		"\tresolve: {",
		"\t\talias: [",
		aliasLines,
		"\t\t],",
		"\t},",
		"});",
		"",
	].join("\n");
}

function renderIndexHtml(jobId: string): string {
	return [
		"<!doctype html>",
		'<html lang="ko">',
		"\t<head>",
		'\t\t<meta charset="UTF-8" />',
		'\t\t<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
		`\t\t<title>${jobId} TSX export</title>`,
		"\t</head>",
		"\t<body>",
		'\t\t<div id="root"></div>',
		'\t\t<script type="module" src="/src/entry.tsx"></script>',
		"\t</body>",
		"</html>",
		"",
	].join("\n");
}

function renderEntryTsx(): string {
	return [
		'import { createRoot } from "react-dom/client";',
		'import Screen from "../main";',
		'import "./styles/reset.css";',
		'import "./styles/variables.css";',
		"",
		'const container = document.getElementById("root");',
		'if (!container) throw new Error("#root container not found");',
		"createRoot(container).render(<Screen />);",
		"",
	].join("\n");
}
