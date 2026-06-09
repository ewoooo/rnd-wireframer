import { NextResponse } from "next/server";
import { readErrorMessage } from "@/lib/api-error";
import { rerunInferenceJob } from "@/server/inference-runtime";

export const runtime = "nodejs";

type InferenceRerunRouteContext = {
	params: Promise<{
		jobId: string;
	}>;
};

export async function POST(request: Request, context: InferenceRerunRouteContext) {
	try {
		const { jobId } = await context.params;
		const startFromStepId = await readStartFromStepId(request);
		const job = await rerunInferenceJob(jobId, startFromStepId ? { startFromStepId } : {});
		return NextResponse.json({ job, ok: true, startFromStepId }, { status: 202 });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to rerun inference job.") },
			{ status: readErrorStatus(error) },
		);
	}
}

async function readStartFromStepId(request: Request): Promise<string | undefined> {
	const body = await request.json().catch(() => undefined);
	if (body && typeof body === "object" && "startFromStepId" in body) {
		const value = (body as Record<string, unknown>).startFromStepId;
		if (typeof value === "string" && value.length > 0) return value;
	}
	return undefined;
}

function readErrorStatus(error: unknown): number {
	if (isNodeError(error) && error.code === "ENOENT") return 404;
	return 500;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}
