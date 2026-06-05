import { NextResponse } from "next/server";

import { readErrorMessage } from "@/lib/api-error";
import { listScreenRoutes } from "@/lib/screen-db-loader";

export async function GET() {
	try {
		return NextResponse.json({ routes: await listScreenRoutes() });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to list screen routes.") },
			{ status: 500 },
		);
	}
}
