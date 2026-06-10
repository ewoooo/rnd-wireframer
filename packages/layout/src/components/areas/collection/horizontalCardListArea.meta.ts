import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.horizontalCardListArea",
	target: "area",
	name: "가로형 상품 카드 리스트 영역",
	description:
		"ListProductHorizontal 카드가 반복되는 요금제/혜택/부가서비스/인터넷형 리스트-카드 area 패턴",
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
