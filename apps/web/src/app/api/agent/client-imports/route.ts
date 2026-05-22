import { NextResponse } from "next/server";
import { listClientImports } from "@/server/agent/client-imports";

export async function GET() {
	const imports = await listClientImports();
	return NextResponse.json({ imports });
}
