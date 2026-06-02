import { NextResponse } from "next/server";

import { listScreenRoutes } from "@/lib/screen-db-loader";

export async function GET() {
	try {
		return NextResponse.json({ routes: await listScreenRoutes() });
	} catch (error) {
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Failed to list screen routes.";
}
