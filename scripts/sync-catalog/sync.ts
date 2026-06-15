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
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import type { ComponentPropContract } from "../../packages/schema/src/component-catalog";
import { catalogSource } from "../../packages/external/src/catalog.source";
import { CATALOG_SOURCE, EXTERNAL_PKG_DIR } from "./config.ts";
import { buildCatalogSourceModule, type CatalogSourceEntry } from "./lib.ts";
import { parseProps } from "./parse-props.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const CHECK_ONLY = process.argv.includes("--check");
const VENDOR_ONLY = process.argv.includes("--vendor-only");
const LOCAL_IDX = process.argv.indexOf("--local");
const LOCAL_PATH = LOCAL_IDX !== -1 ? process.argv[LOCAL_IDX + 1] : undefined;

/**
 * kiki가 정본인 디렉터리 — vendor 시 이것들만 통째로 교체한다.
 * resolver.ts·catalog.*.ts·index.ts 등 우리가 kiki 위에 얹은 wrapper 파일은
 * src 안에 그대로 남아야 하므로, 전체 src wipe(과거 동작)는 금지.
 */
const VENDOR_DIRS = ["components", "assets", "styles", "tokens"] as const;

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

/** kiki 정본 디렉터리(VENDOR_DIRS)만 통째로 교체한다. wrapper 파일은 보존(전체 wipe 금지).
 *  스토리북 하네스(.stories.*)는 제외. 복사한 파일 수를 돌려준다. */
function vendorSource(srcDir: string, destSrc: string): number {
	mkdirSync(destSrc, { recursive: true });
	let copied = 0;
	for (const dir of VENDOR_DIRS) {
		const from = join(srcDir, dir);
		if (!existsSync(from)) continue;
		const to = join(destSrc, dir);
		rmSync(to, { recursive: true, force: true });
		cpSync(from, to, {
			recursive: true,
			filter: (src) => {
				// storybook 하네스 파일 제외
				if (src.endsWith(".stories.tsx") || src.endsWith(".stories.ts")) return false;
				if (statSync(src).isFile()) copied += 1;
				return true;
			},
		});
	}
	return copied;
}

interface LockFile {
	source: { id: string; repo: string; ref: string };
	sha: string;
	syncedAt: string;
	barrelExports: string[];
	fileCount: number;
}

/** vendored .tsx 에서 새 컴포넌트의 catalog.source 엔트리를 기계적으로 만든다.
 *  description/role 등 큐레이션은 비워 둔다(사람이 나중에 채움). */
function buildSourceEntry(name: string, tsxPath: string, isBarrel: boolean): CatalogSourceEntry {
	const props: Record<string, ComponentPropContract> = {};
	try {
		// 중복 prop 이름은 마지막 선언 우선 (gen-catalog와 동일 규칙)
		for (const p of parseProps(tsxPath)) {
			const contract: ComponentPropContract = { type: p.type };
			if (p.values && p.values.length > 0) contract.values = p.values;
			contract.required = p.required;
			props[p.name] = contract;
		}
	} catch {
		// 파싱 실패 시 빈 props
	}
	return { type: `kiki.${name}`, source: isBarrel ? "kiki-barrel" : "kiki-draft", version: "0.0.0", props };
}

/**
 * catalog.source.ts(추론이 읽는 catalog.generated.ts의 SSOT)를 vendored components/ 에
 * 맞춘다 — 완전 미러: 사라진 컴포넌트의 엔트리는 prune, 새 컴포넌트는 엔트리 추가.
 * 기존 엔트리(큐레이션 포함)는 그대로 보존한다. 변경 시에만 파일을 다시 쓴다.
 */
function reconcileCatalogSource(destSrc: string, barrelExports: string[]): {
	pruned: string[];
	added: string[];
} {
	const componentsDir = join(destSrc, "components");
	const dirs = readdirSync(componentsDir, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);
	const dirSet = new Set(dirs);
	const barrelSet = new Set(barrelExports);

	const next: Record<string, CatalogSourceEntry> = {};
	const pruned: string[] = [];
	for (const [key, entry] of Object.entries(catalogSource)) {
		const name = key.replace(/^kiki\./, "");
		if (dirSet.has(name)) next[key] = entry;
		else pruned.push(key);
	}

	const added: string[] = [];
	for (const name of dirs) {
		const key = `kiki.${name}`;
		if (next[key]) continue;
		const tsxPath = join(componentsDir, name, `${name}.tsx`);
		if (!existsSync(tsxPath)) continue; // .tsx 없는 디렉터리는 컴포넌트 아님
		next[key] = buildSourceEntry(name, tsxPath, barrelSet.has(name));
		added.push(key);
	}

	if (pruned.length > 0 || added.length > 0) {
		const sorted = Object.fromEntries(Object.keys(next).sort().map((k) => [k, next[k]]));
		const sourcePath = join(REPO_ROOT, EXTERNAL_PKG_DIR, "src", "catalog.source.ts");
		writeFileSync(sourcePath, buildCatalogSourceModule(sorted));
		execFileSync("pnpm", ["exec", "biome", "check", "--write", sourcePath], {
			cwd: REPO_ROOT,
			stdio: "ignore",
		});
	}
	return { pruned, added };
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

		log(`· vendored     ${fileCount} files → ${EXTERNAL_PKG_DIR}/src (${VENDOR_DIRS.join(", ")})`);

		if (VENDOR_ONLY) {
			log("✓ vendor-only — catalog 재생성 생략 (pnpm sync:catalog 로 별도 갱신)");
			return;
		}

		// catalog.source.ts를 vendored components/ 에 맞춰 정리 (완전 미러)
		const { pruned, added } = reconcileCatalogSource(destSrc, exports);
		if (pruned.length > 0) log(`· prune        ${pruned.length}개 엔트리 제거 — ${pruned.join(", ")}`);
		if (added.length > 0) log(`· add          ${added.length}개 엔트리 추가(큐레이션 비움) — ${added.join(", ")}`);
		if (pruned.length === 0 && added.length === 0) log("· catalog.source  변경 없음");

		// catalog.generated.ts / registry.generated.ts 재생성은 기존 파이프라인(index.ts)에 위임.
		// 추론·렌더가 읽는 catalog가 vendored 결과와 일치하게 된다.
		log("· regen        pnpm sync:catalog (catalog.generated.ts + registry.generated.ts)");
		execFileSync("pnpm", ["sync:catalog"], { cwd: REPO_ROOT, stdio: "inherit" });

		log(`✓ sync 완료 — @cx/external (source: ${CATALOG_SOURCE.id}@${sha.slice(0, 12)})`);
	} finally {
		cleanup();
	}
}

main();
