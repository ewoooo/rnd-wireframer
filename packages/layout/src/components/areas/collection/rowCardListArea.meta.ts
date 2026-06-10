import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.rowCardListArea",
	target: "area",
	name: "행형 상품 카드 리스트 영역",
	description: "ListProductRow가 반복되는 단말기/구독상품형 리스트-카드 area 패턴",
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
