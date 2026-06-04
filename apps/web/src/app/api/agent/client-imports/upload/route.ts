import { NextResponse } from "next/server";
import { ClientImportError, saveUploadedClientImport } from "@/server/agent/client-imports";

export async function POST(request: Request) {
	try {
		const result = await saveUploadedClientImport(await request.formData());
		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof ClientImportError) {
			return NextResponse.json({ error: error.message }, { status: error.status });
		}
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to upload client import." },
			{ status: 500 },
		);
	}
}
