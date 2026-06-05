import { NextResponse } from "next/server";

import { readErrorMessage } from "@/lib/api-error";
import { loadScreenTree } from "@/lib/screen-db-loader";
import { saveScreenTreeOrder } from "@/lib/screen-db-save";

type RouteContext = {
	params: Promise<{
		screenId: string;
	}>;
};

export async function GET(_request: Request, context: RouteContext) {
	try {
		const { screenId } = await context.params;
		const result = await loadScreenTree(screenId);
		const status = result.diagnostics.some((diagnostic) => diagnostic.severity === "error")
			? 422
			: 200;
		return NextResponse.json(result, { status });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to load screen tree.") },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request, context: RouteContext) {
	try {
		const { screenId } = await context.params;
		const body = (await request.json()) as { node?: unknown };
		if (!body.node || typeof body.node !== "object") {
			return NextResponse.json({ error: "Missing RenderTree node." }, { status: 400 });
		}

		const result = await saveScreenTreeOrder({
			node: body.node as Parameters<typeof saveScreenTreeOrder>[0]["node"],
			screenId,
		});
		const status = result.diagnostics.some((diagnostic) => diagnostic.severity === "error")
			? 422
			: 200;
		return NextResponse.json(result, { status });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to load screen tree.") },
			{ status: 500 },
		);
	}
}
