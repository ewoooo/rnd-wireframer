import { NextResponse } from "next/server";
import { createScreenInferenceRun } from "@/lib/screen-inference-run-store";

export const runtime = "nodejs";

type ScreenInferenceRunRequest = {
	previousRunId?: string;
	runId?: string;
	screenId?: string;
	source?: {
		path?: string;
	};
	tags?: string[];
	useAI?: boolean;
};

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as ScreenInferenceRunRequest;
		if (!body.source?.path) {
			return NextResponse.json({ error: "source.path is required." }, { status: 400 });
		}

		const run = await createScreenInferenceRun({
			previousRunId: body.previousRunId,
			runId: body.runId,
			screenId: body.screenId,
			sourcePath: body.source.path,
			tags: body.tags,
			useAI: body.useAI,
		});

		return NextResponse.json(run, { status: 202 });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error) },
			{ status: readErrorStatus(error) },
		);
	}
}

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Failed to create screen inference run.";
}

function readErrorStatus(error: unknown): number {
	if (error instanceof Error && error.message.startsWith("source.path")) return 400;
	return 500;
}
