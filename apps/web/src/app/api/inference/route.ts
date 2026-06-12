import { NextResponse } from "next/server";
import { readErrorMessage } from "@/lib/api-error";
import { createInferenceJob } from "@/server/inference-runtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => ({}));
		const job = await createInferenceJob(body);
		return NextResponse.json({ jobId: job.jobId }, { status: 202 });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to create inference job.") },
			{ status: 400 },
		);
	}
}
