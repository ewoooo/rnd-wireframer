import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositePagestackProductCardList",
	target: "composite",
	name: "페이지스택 상품 카드 리스트",
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
		"AppBar 아래 Contents에서 optional Chip, FilterSorting, ProductListGroup 또는 product card set이 PageStack rail 안에 배치되는 Page (리스트-카드) 최상위 composite.",
	status: "stable",
};
