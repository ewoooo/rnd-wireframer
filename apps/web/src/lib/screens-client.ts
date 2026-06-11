import type { PuckCatalogItem } from "@cx/adapters/puck";
import type { ScreenSummary } from "@/lib/screen-sources";

type ScreensApiResponse = {
	error?: string;
	screens?: ScreenSummary[];
};

export type PuckCatalogScope = "area" | "screen-region";

type PuckCatalogApiResponse = {
	catalogItems?: PuckCatalogItem[];
	error?: string;
};

export async function fetchScreensFromApi(): Promise<ScreenSummary[]> {
	// 목록 + 전 화면 트리를 bulk 엔드포인트 1회로 받는다.
	// (기존: /api/screens 1회 + 화면 수만큼 /tree 직렬 호출 → 워터폴 폭발)
	const response = await fetch("/api/screens/trees");
	if (!response.ok) {
		throw new Error(`화면 목록 요청 실패 ${response.status}`);
	}
	const body = (await response.json()) as ScreensApiResponse;
	if (body.error) throw new Error(body.error);
	return body.screens ?? [];
}

export async function fetchPuckCatalogItemsFromApi(
	scope: PuckCatalogScope,
): Promise<PuckCatalogItem[]> {
	const response = await fetch(`/api/screens/puck-catalog?scope=${encodeURIComponent(scope)}`);
	if (!response.ok) {
		throw new Error(`Puck catalog 요청 실패 ${scope}: ${response.status}`);
	}
	const body = (await response.json()) as PuckCatalogApiResponse;
	if (body.error) throw new Error(body.error);
	return body.catalogItems ?? [];
}
