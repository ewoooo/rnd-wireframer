import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.mapCardInfoListArea",
	target: "area",
	name: "지도 카드정보 리스트 영역",
	description:
		"혜택브랜드 상세에서 Map 다음 CardInfo 3개 매장 정보를 이어 배치하는 subtype. CardInfo는 gap으로 남긴다.",
	props: {
		componentGap: {
			type: "number",
		},
		componentGaps: {
			type: "array",
		},
		flow: {
			type: "enum",
			values: ["grid", "horizontal", "stack"],
		},
		gap: {
			type: "number",
		},
		mapHeight: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
