import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeListProductHorizontalCardSet",
	target: "composite",
	name: "가로형 상품 카드 세트",
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
		"혜택, 부가서비스, 인터넷 variant에서 실제 ListProductHorizontal card가 반복되는 product card set composite.",
	status: "stable",
};
