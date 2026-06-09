import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeListProductRowCardSet",
	target: "composite",
	name: "행형 상품 카드 세트",
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
		"단말기, 구독상품 variant에서 실제 ListProductRow card가 반복되는 product row card set composite.",
	status: "stable",
};
