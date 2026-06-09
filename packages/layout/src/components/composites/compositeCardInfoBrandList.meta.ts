import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeCardInfoBrandList",
	target: "composite",
	name: "브랜드 카드 정보 리스트",
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
		"CardInfo/CardContentsLine 계열 Figma row를 실제 StoreCard, CardContentsFilled, ListText 후보로 정리한 브랜드 정보 리스트 composite",
	status: "stable",
};
