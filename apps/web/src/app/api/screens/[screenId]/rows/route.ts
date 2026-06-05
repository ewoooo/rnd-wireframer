import { NextResponse } from "next/server";

import { readErrorMessage } from "@/lib/api-error";
import { loadScreenRows } from "@/lib/screen-db-loader";

type RouteContext = {
	params: Promise<{
		screenId: string;
	}>;
};

export async function GET(_request: Request, context: RouteContext) {
	try {
		const { screenId } = await context.params;
		return NextResponse.json({ rows: await loadScreenRows(screenId) });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to load screen rows.") },
			{ status: 500 },
		);
	}
}
