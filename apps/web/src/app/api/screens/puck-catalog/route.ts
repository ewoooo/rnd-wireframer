import { NextResponse } from "next/server";

import { listPuckCatalogItems, type PuckCatalogScope } from "@/lib/screen-db-loader";

const PUCK_CATALOG_SCOPES = new Set<PuckCatalogScope>(["area", "screen-region"]);

export async function GET(request: Request) {
	try {
		const scope = new URL(request.url).searchParams.get("scope");
		if (!isPuckCatalogScope(scope)) {
			return NextResponse.json({ error: "Invalid Puck catalog scope." }, { status: 400 });
		}

		return NextResponse.json({ catalogItems: await listPuckCatalogItems(scope) });
	} catch (error) {
		return NextResponse.json({ error: readErrorMessage(error) }, { status: 500 });
	}
}

function isPuckCatalogScope(scope: string | null): scope is PuckCatalogScope {
	return !!scope && PUCK_CATALOG_SCOPES.has(scope as PuckCatalogScope);
}

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Failed to list Puck catalog items.";
}
