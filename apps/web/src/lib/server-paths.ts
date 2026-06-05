import { existsSync } from "node:fs";
import path from "node:path";

// dev 서버 cwd 가 apps/web 일 수도, 레포 루트일 수도 있어 data/ 위치를 안정적으로
// 찾기 위해 pnpm-workspace.yaml 를 기준으로 모노레포 루트를 거슬러 올라가 탐색한다.
function findRepoRoot(): string {
	let dir = process.cwd();
	for (let depth = 0; depth < 6; depth += 1) {
		if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return process.cwd();
}

/** Monorepo root (holds data/, pnpm-workspace.yaml). */
export const REPO_ROOT = findRepoRoot();

/** Root directory holding uploaded client import sources. */
export const CLIENT_IMPORT_ROOT = path.join(REPO_ROOT, "data/client-imports");

/** Root directory holding screen-generation run artifacts. */
export const RUN_ROOT = path.join(REPO_ROOT, "data/runs/screen-generation");
