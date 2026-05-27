import path from "node:path";
import { fileURLToPath } from "node:url";

const CLIENT_IMPORT_ROOT = "data/client-imports";
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

export function normalizeSmokeTargetPath(target: string): string {
	if (path.isAbsolute(target)) return target;
	const repoRelativePath = target.startsWith(CLIENT_IMPORT_ROOT)
		? target
		: path.join(CLIENT_IMPORT_ROOT, target);
	return path.resolve(resolveInvocationRoot(), repoRelativePath);
}

export function normalizeSmokeOutDir(outDir: string): string {
	return path.isAbsolute(outDir) ? outDir : path.resolve(resolveInvocationRoot(), outDir);
}

export function resolveSmokeSourceKind(
	targetPath: string,
): "area" | "component" | "screen" | "unknown" {
	if (targetPath.includes("/screen/")) return "screen";
	if (targetPath.includes("/area/")) return "area";
	if (targetPath.includes("/component/")) return "component";
	return "unknown";
}

export function createSmokeRunId(targetPath: string): string {
	return `${path.basename(targetPath).replace(/\.[^.]+$/, "")}-${createTimestamp()}`;
}

export function createSmokeOutDir(runId: string): string {
	return path.resolve(resolveInvocationRoot(), "tmp", "generation-runs", runId);
}

function createTimestamp(): string {
	return new Date().toISOString().replace(/\D/g, "").slice(0, 14);
}

function resolveInvocationRoot(): string {
	return process.env.INIT_CWD ?? REPO_ROOT;
}
