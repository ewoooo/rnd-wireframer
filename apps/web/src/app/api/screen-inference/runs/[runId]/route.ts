import { NextResponse } from "next/server";
import { readErrorMessage } from "@/lib/api-error";
import { readScreenInferenceRun } from "@/lib/screen-inference-run-store";

export const runtime = "nodejs";

type ScreenInferenceRunRouteContext = {
	params: Promise<{
		runId: string;
	}>;
};

export async function GET(_request: Request, context: ScreenInferenceRunRouteContext) {
	try {
		const { runId } = await context.params;
		const run = await readScreenInferenceRun(runId);
		if (!run) {
			return NextResponse.json({ error: "Run not found." }, { status: 404 });
		}
		return NextResponse.json(run);
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to read screen inference run.") },
			{ status: 500 },
		);
	}
}
