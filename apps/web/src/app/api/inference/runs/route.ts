import { NextResponse } from "next/server";
import { readErrorMessage } from "@/lib/api-error";
import { listScreenInferenceRunRows } from "@/server/inference-runs";
import { inferenceRuntime } from "@/server/inference-runtime";

export const runtime = "nodejs";

export async function GET() {
	try {
		const runs = await listScreenInferenceRunRows({
			artifactStore: inferenceRuntime.artifactStore,
			jobStore: inferenceRuntime.jobStore,
		});
		return NextResponse.json({ runs });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to list inference runs.") },
			{ status: 500 },
		);
	}
}
