import { NextResponse } from "next/server";
import { PromoteAiImportError, promoteAiImportCandidate } from "@/server/agent/promote-ai-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = (await request.json().catch(() => ({}))) as {
			candidateFile?: unknown;
			dryRun?: unknown;
		};
		const candidateFile = typeof body.candidateFile === "string" ? body.candidateFile : "";
		const dryRun = body.dryRun !== false;

		return NextResponse.json(await promoteAiImportCandidate({ candidateFile, dryRun }));
	} catch (error) {
		console.error("[agent-promote] failed", error);
		if (error instanceof PromoteAiImportError) {
			return NextResponse.json({ error: error.message }, { status: error.status });
		}
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to promote AI import candidate.",
			},
			{ status: 500 },
		);
	}
}
