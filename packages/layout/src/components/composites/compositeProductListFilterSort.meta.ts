import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeProductListFilterSort",
	target: "composite",
	name: "상품 리스트 필터 정렬 조합",
	props: {
		componentGaps: {
			type: "array",
		},
		figmaOnlyTypes: {
			type: "array",
		},
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"Page (리스트-카드) 상단에서 optional Chip filter 다음 실제 FilterSorting control row가 이어지는 상품 리스트 제어 composite.",
	status: "stable",
};
