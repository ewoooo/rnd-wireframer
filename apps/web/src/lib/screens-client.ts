import type { PuckCatalogItem } from "@cx/adapters/puck";
import type { RenderTreeScreenNode } from "@cx/renderer";
import type { ScreenSummary } from "@/lib/screen-sources";

type ScreensApiResponse = {
	error?: string;
	screens?: ScreenSummary[];
};

type ScreenTreeApiResponse = {
	error?: string;
	node?: RenderTreeScreenNode;
};

export type PuckCatalogScope = "area" | "screen-region";

type PuckCatalogApiResponse = {
	catalogItems?: PuckCatalogItem[];
	error?: string;
};

export async function fetchScreensFromApi(): Promise<ScreenSummary[]> {
	const summariesResponse = await fetch("/api/screens");
	if (!summariesResponse.ok) {
		throw new Error(`화면 목록 요청 실패 ${summariesResponse.status}`);
	}
	const summariesBody = (await summariesResponse.json()) as ScreensApiResponse;
	if (summariesBody.error) throw new Error(summariesBody.error);
	const summaries = summariesBody.screens ?? [];

	return Promise.all(
		summaries.map(async (summary) => {
			const treeResponse = await fetch(`/api/screens/${encodeURIComponent(summary.id)}/tree`);
			if (!treeResponse.ok) {
				throw new Error(`화면 트리 요청 실패 ${summary.id}: ${treeResponse.status}`);
			}
			const treeBody = (await treeResponse.json()) as ScreenTreeApiResponse;
			if (treeBody.error) throw new Error(treeBody.error);
			return {
				...summary,
				renderTree: treeBody.node,
			};
		}),
	);
}

export async function fetchPuckCatalogItemsFromApi(scope: PuckCatalogScope): Promise<PuckCatalogItem[]> {
	const response = await fetch(`/api/screens/puck-catalog?scope=${encodeURIComponent(scope)}`);
	if (!response.ok) {
		throw new Error(`Puck catalog 요청 실패 ${scope}: ${response.status}`);
	}
	const body = (await response.json()) as PuckCatalogApiResponse;
	if (body.error) throw new Error(body.error);
	return body.catalogItems ?? [];
}
