import { NextResponse } from "next/server";
import { ClientImportError } from "@/server/agent/client-imports";
import { AgentGenerateError, generateAgentRegister } from "@/server/agent/generate-register";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = (await request.json().catch(() => ({}))) as {
			importId?: unknown;
		};
		const importId = typeof body.importId === "string" ? body.importId : "";

		return NextResponse.json(await generateAgentRegister({ importId }));
	} catch (error) {
		console.error("[agent-generate] failed", error);
		if (error instanceof AgentGenerateError || error instanceof ClientImportError) {
			return NextResponse.json({ error: error.message }, { status: error.status });
		}
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate register JSON.",
			},
			{ status: 500 },
		);
	}
}
