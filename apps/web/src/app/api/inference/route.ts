import { NextResponse } from "next/server";
import { createInferenceJob } from "@/server/inference-runtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const body = await request.json().catch(() => ({}));
	const job = await createInferenceJob(body);
	return NextResponse.json({ jobId: job.jobId }, { status: 202 });
}
