import { NextResponse } from "next/server";
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
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Failed to read screen inference run.";
}
