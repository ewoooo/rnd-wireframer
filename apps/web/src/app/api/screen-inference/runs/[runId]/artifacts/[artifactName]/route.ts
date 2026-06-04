import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RUN_ROOT = path.join(process.cwd(), "data/runs/screen-generation");
const ALLOWED_ARTIFACTS = new Set([
	"agent-result.json",
	"final-result.json",
	"pipeline-result.json",
	"quality-review.json",
	"validation-report.json",
]);

type ScreenInferenceArtifactRouteContext = {
	params: Promise<{
		artifactName: string;
		runId: string;
	}>;
};

export async function GET(_request: Request, context: ScreenInferenceArtifactRouteContext) {
	try {
		const { artifactName, runId } = await context.params;
		if (!ALLOWED_ARTIFACTS.has(artifactName)) {
			return NextResponse.json({ error: "Artifact is not allowed." }, { status: 403 });
		}

		const artifactPath = path.join(readRunDir(runId), "artifacts", artifactName);
		return NextResponse.json(JSON.parse(await readFile(artifactPath, "utf8")));
	} catch (error) {
		if (isNodeError(error) && error.code === "ENOENT") {
			return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
		}
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}

function readRunDir(runId: string): string {
	const safeRunId = runId.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 120);
	if (!safeRunId) throw new Error("runId is required.");
	return path.join(RUN_ROOT, safeRunId);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Failed to read screen inference artifact.";
}
