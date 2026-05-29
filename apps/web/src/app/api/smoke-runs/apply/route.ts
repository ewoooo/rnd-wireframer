import { NextResponse } from "next/server";

import { applySmokeRunToTables } from "@/lib/smoke-apply";

type ApplyRequestBody = {
	allowInvalid?: unknown;
	runId?: unknown;
	write?: unknown;
};

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as ApplyRequestBody;
		if (typeof body.runId !== "string") {
			return NextResponse.json({ error: "runId is required." }, { status: 400 });
		}

		const result = await applySmokeRunToTables({
			allowInvalid: body.allowInvalid === true,
			runId: body.runId,
			write: body.write === true,
		});

		return NextResponse.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to apply smoke run.";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
