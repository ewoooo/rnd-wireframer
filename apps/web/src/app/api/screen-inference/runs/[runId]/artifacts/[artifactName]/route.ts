import { SCHEMA_VERSION } from "@cx/schema";
import { NextResponse } from "next/server";
import { readErrorMessage } from "@/lib/api-error";
import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";

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

		return NextResponse.json(await readScreenInferenceArtifact(runId, artifactName));
	} catch (error) {
		if (isNodeError(error) && error.code === "ENOENT") {
			return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
		}
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to read screen inference artifact.") },
			{ status: 500 },
		);
	}
}

async function readScreenInferenceArtifact(runId: string, artifactName: string): Promise<unknown> {
	if (artifactName === "final-result.json") {
		return inferenceRuntime.artifactStore.readJson(runId, "steps/04-render-tree/output.json");
	}
	if (artifactName === "quality-review.json") {
		return inferenceRuntime.artifactStore.readJson(runId, "steps/05-quality/output.json");
	}
	if (artifactName === "validation-report.json") {
		const job = await inferenceRuntime.jobStore.getJob(runId);
		return {
			issues: job.error
				? [{ code: job.error.code, message: job.error.message, severity: "error" }]
				: [],
			ok: !job.error,
			schemaVersion: SCHEMA_VERSION.validationReport,
			summary: {
				errorCount: job.error ? 1 : 0,
				warningCount: 0,
			},
			target: "steps/04-render-tree/output.json",
		};
	}
	if (artifactName === "pipeline-result.json") {
		return inferenceRuntime.jobStore.getJob(runId);
	}
	if (artifactName === "agent-result.json") {
		return inferenceRuntime.artifactStore.readJson(runId, "steps/04-render-tree/raw-response.json");
	}
	throw Object.assign(new Error("Artifact not found."), { code: "ENOENT" });
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}
