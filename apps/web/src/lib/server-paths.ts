import { existsSync } from "node:fs";
import path from "node:path";

// The dev server can be started from the monorepo root or from apps/web.
// Resolve data paths from the workspace root so uploaded sources and run artifacts
// do not drift into apps/web/data.
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

/** Monorepo root directory. */
export const REPO_ROOT = findRepoRoot();

/** Root directory holding uploaded client import sources. */
export const CLIENT_IMPORT_ROOT = path.join(REPO_ROOT, "data/client-imports");

/** Root directory holding screen-generation run artifacts. */
export const RUN_ROOT = path.join(REPO_ROOT, "data/runs/screen-generation");
