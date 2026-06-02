import { NextResponse } from "next/server";

import { listScreens } from "@/lib/screen-db-loader";

export async function GET(request: Request) {
	try {
		const routeId = new URL(request.url).searchParams.get("routeId") ?? undefined;
		return NextResponse.json({ screens: await listScreens(routeId) });
	} catch (error) {
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Failed to list screens.";
}
