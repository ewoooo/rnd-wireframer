import { NextResponse } from "next/server";

import { readErrorMessage } from "@/lib/api-error";
import { listScreens } from "@/lib/screen-db-loader";

export async function GET(request: Request) {
	try {
		const routeId = new URL(request.url).searchParams.get("routeId") ?? undefined;
		return NextResponse.json({ screens: await listScreens(routeId) });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to list screens.") },
			{ status: 500 },
		);
	}
}
