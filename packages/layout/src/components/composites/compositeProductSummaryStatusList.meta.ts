import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeProductSummaryStatusList",
	target: "composite",
	name: "상품 요약 상태 목록 조합",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"CardSummary, Badge, TextButton, ListText가 결합된 상품/요금제 요약 block. ButtonTextUnderline은 TextButton underline alias로만 매핑한다.",
	status: "stable",
};
