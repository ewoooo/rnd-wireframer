import { NextResponse } from "next/server";
import { ClientImportError } from "@/server/agent/client-imports";
import {
	DraftTablesGenerateError,
	generateDraftTablesForImport,
} from "@/server/agent/generate-draft-tables";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = (await request.json().catch(() => ({}))) as {
			importId?: unknown;
		};
		const importId = typeof body.importId === "string" ? body.importId : "";

		return NextResponse.json(await generateDraftTablesForImport({ importId }));
	} catch (error) {
		console.error("[draft-tables-generate] failed", error);
		if (error instanceof DraftTablesGenerateError || error instanceof ClientImportError) {
			return NextResponse.json({ error: error.message }, { status: error.status });
		}
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate draft tables.",
			},
			{ status: 500 },
		);
	}
}
