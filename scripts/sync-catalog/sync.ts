/**
 * Catalog sync — 메인 파이프라인.
 *
 *   pnpm sync:catalog          외부 소스를 끌어와 packages/external 를 재생성
 *   pnpm sync:catalog --check  드리프트만 리포트 (쓰기 없음)
 *
 * 단계: fetch(git sparse) → vendor(소스 미러) → barrel/lock 기록.
 * catalog 생성(prop 파싱)·AI/렌더 연결은 후속 단계에서 추가된다.
 */

import { execFileSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { CATALOG_SOURCE, EXTERNAL_PKG_DIR, HARNESS_EXCLUDES } from "./config.ts";
import { genCatalog } from "./gen-catalog.ts";
import { genRegistry } from "./gen-registry.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const CHECK_ONLY = process.argv.includes("--check");
const LOCAL_IDX = process.argv.indexOf("--local");
const LOCAL_PATH = LOCAL_IDX !== -1 ? process.argv[LOCAL_IDX + 1] : undefined;

function git(args: string[], cwd: string): string {
	return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function log(msg: string): void {
	process.stdout.write(`${msg}\n`);
}

/** 소스 리포의 subpath 만 얕게 sparse-checkout 해서 임시 디렉토리에 가져온다.
 *  --local <path> 플래그가 있으면 로컬 경로를 그대로 사용한다. */
function fetchSource(): { dir: string; sha: string; cleanup: () => void } {
	if (LOCAL_PATH) {
		log(`· local  ${LOCAL_PATH}`);
		return { dir: LOCAL_PATH, sha: "local", cleanup: () => {} };
	}
	const tmp = mkdtempSync(join(tmpdir(), "catalog-src-"));
	log(`· fetch  ${CATALOG_SOURCE.repo}@${CATALOG_SOURCE.ref} (${CATALOG_SOURCE.subpath})`);
	git(
		[
			"clone",
			"--depth",
			"1",
			"--filter=blob:none",
			"--sparse",
			"--branch",
			CATALOG_SOURCE.ref,
			CATALOG_SOURCE.repo,
			tmp,
		],
		REPO_ROOT,
	);
	git(["sparse-checkout", "set", CATALOG_SOURCE.subpath], tmp);
	const sha = git(["rev-parse", "HEAD"], tmp).trim();
	return { dir: tmp, sha, cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
}

/** barrel(src/index.ts)에서 export 되는 "유효한 표면" 컴포넌트 이름을 뽑는다. */
function readBarrelExports(srcDir: string): string[] {
	const barrelPath = join(srcDir, "index.ts");
	if (!existsSync(barrelPath)) return [];
	const text = readFileSync(barrelPath, "utf8");
	const names = new Set<string>();
	const re = /export\s+(?:type\s+)?\{([^}]*)\}\s+from\s+["']\.\/components\/([^"']+)["']/g;
	for (const match of text.matchAll(re)) {
		for (const raw of match[1].split(",")) {
			const name = raw.trim().split(/\s+as\s+/)[0].trim();
			if (name) names.add(name);
		}
	}
	return [...names].sort();
}

/** subpath/src 를 packages/external/src 로 미러링한다 (앱/스토리 하네스 제외). */
function vendorSource(srcDir: string, destSrc: string): number {
	rmSync(destSrc, { recursive: true, force: true });
	mkdirSync(destSrc, { recursive: true });
	let copied = 0;
	const excludes = new Set(HARNESS_EXCLUDES);
	cpSync(srcDir, destSrc, {
		recursive: true,
		filter: (src) => {
			const rel = src.slice(srcDir.length + 1);
			if (!rel) return true;
			const top = rel.split("/")[0];
			if (excludes.has(top) || excludes.has(rel)) return false;
			// storybook 하네스 파일 제외
			if (rel.endsWith(".stories.tsx") || rel.endsWith(".stories.ts")) return false;
			copied += 1;
			return true;
		},
	});
	return copied;
}

interface LockFile {
	source: { id: string; repo: string; ref: string };
	sha: string;
	syncedAt: string;
	barrelExports: string[];
	fileCount: number;
}

function main(): void {
	const { dir, sha, cleanup } = fetchSource();
	try {
		const srcDir = join(dir, CATALOG_SOURCE.subpath, "src");
		if (!existsSync(srcDir)) {
			throw new Error(`소스에 ${CATALOG_SOURCE.subpath}/src 가 없습니다: ${srcDir}`);
		}

		const exports = readBarrelExports(srcDir);
		const lockPath = join(REPO_ROOT, EXTERNAL_PKG_DIR, "external.lock.json");
		const prevSha = existsSync(lockPath)
			? (JSON.parse(readFileSync(lockPath, "utf8")) as LockFile).sha
			: null;

		log(`· source HEAD  ${sha.slice(0, 12)}${prevSha ? `  (이전: ${prevSha.slice(0, 12)})` : ""}`);
		log(`· exports      ${exports.length}개 — ${exports.join(", ")}`);

		if (CHECK_ONLY) {
			const drift = prevSha !== sha;
			log(drift ? "⚠ 드리프트 있음 — pnpm sync:catalog 로 갱신 필요" : "✓ 최신 상태");
			process.exitCode = drift ? 1 : 0;
			return;
		}

		const destSrc = join(REPO_ROOT, EXTERNAL_PKG_DIR, "src");
		const fileCount = vendorSource(srcDir, destSrc);

		const lock: LockFile = {
			source: { id: CATALOG_SOURCE.id, repo: CATALOG_SOURCE.repo, ref: CATALOG_SOURCE.ref },
			sha,
			syncedAt: new Date().toISOString(),
			barrelExports: exports,
			fileCount,
		};
		writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);

		log(`· vendored     ${fileCount} files → ${EXTERNAL_PKG_DIR}/src`);

		// 카탈로그 생성
		// kiki는 Vite 기반 — PNG/SVG를 string URL로 취급하도록 선언
		const modulesDtsPath = join(destSrc, "modules.d.ts");
		writeFileSync(
			modulesDtsPath,
			`// [KIKI-SHIM] 임시 — kiki 빌드 제공 시 삭제(빌드물이 .d.ts 제공). 제거 가이드: packages/external/KIKI-SHIM.md
// AUTO-GENERATED — kiki는 Vite 기반이므로 이미지 import를 string으로 선언
declare module "*.png" { const src: string; export default src; }
declare module "*.jpg" { const src: string; export default src; }
declare module "*.jpeg" { const src: string; export default src; }
declare module "*.svg" { const src: string; export default src; }
declare module "*.webp" { const src: string; export default src; }
`,
		);

		const catalogPath = join(REPO_ROOT, EXTERNAL_PKG_DIR, "src", "catalog.ts");
		const compCount = genCatalog({
			externalSrcDir: destSrc,
			barrelExports: exports,
			outputPath: catalogPath,
		});
		log(`· catalog      ${compCount}개 컴포넌트 → ${EXTERNAL_PKG_DIR}/src/catalog.ts`);
		log(`  barrel: [kiki] × ${exports.filter((e) => !e.startsWith("type ")).length}  draft: [kiki/draft] × ${compCount - exports.filter((e) => !e.startsWith("type ")).length}`);

		// 렌더러용 전체 export 표면 — draft 포함 모든 컴포넌트를 렌더 가능하게 한다.
		const registryPath = join(REPO_ROOT, EXTERNAL_PKG_DIR, "src", "registry.generated.ts");
		const registry = genRegistry({ externalSrcDir: destSrc, outputPath: registryPath });
		log(`· registry     ${registry.exported}개 export → ${EXTERNAL_PKG_DIR}/src/registry.generated.ts`);
		if (registry.skipped.length > 0) {
			log(`  ⚠ 렌더 제외(dir명과 다른 export): ${registry.skipped.join(", ")}`);
		}

		log(`✓ sync 완료 — @cx/external (source: ${CATALOG_SOURCE.id}@${sha.slice(0, 12)})`);
		log("  다음 단계: AI/렌더 연결 (build-catalog-deck, component-by-type)");
	} finally {
		cleanup();
	}
}

main();
