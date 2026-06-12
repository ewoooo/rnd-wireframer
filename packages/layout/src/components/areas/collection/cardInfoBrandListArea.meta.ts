import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.cardInfoBrandListArea",
	target: "area",
	name: "브랜드 카드정보 리스트 영역",
	description:
		"혜택브랜드 상세의 CardContentsLine 이후 CardInfo 브랜드 혜택 리스트를 표현하는 subtype",
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
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
