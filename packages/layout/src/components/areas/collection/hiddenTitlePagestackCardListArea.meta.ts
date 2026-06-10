import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.hiddenTitlePagestackCardListArea",
	target: "area",
	name: "숨김 제목 페이지스택 카드 리스트 영역",
	description:
		"부가서비스/인터넷 variant처럼 title은 hidden이고 Card 0 pagestack item을 포함한 뒤 ListProductHorizontal 카드가 반복되는 area 패턴",
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
		itemTemplate: {
			type: "enum",
			values: ["card-0", "default-20", "plain"],
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
