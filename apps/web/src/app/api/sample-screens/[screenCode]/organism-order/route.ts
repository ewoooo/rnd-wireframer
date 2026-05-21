import { NextResponse } from "next/server";
import { updateSampleScreenOrganismOrder } from "@/features/wireframe-renderer/screen-source-crud";

interface RouteContext {
	params: Promise<{
		screenCode: string;
	}>;
}

export async function PUT(request: Request, context: RouteContext) {
	const { screenCode } = await context.params;
	const body = (await request.json()) as { organismCodes?: unknown };

	if (
		!Array.isArray(body.organismCodes) ||
		body.organismCodes.some((code) => typeof code !== "string")
	) {
		return NextResponse.json({ error: "organismCodes must be a string array" }, { status: 400 });
	}

	const result = await updateSampleScreenOrganismOrder({
		organismCodes: body.organismCodes,
		screenCode,
	});

	if (!result.ok) {
		return NextResponse.json({ error: result.error }, { status: result.status });
	}

	return NextResponse.json({
		screenCode,
		organismCodes: body.organismCodes,
	});
}
