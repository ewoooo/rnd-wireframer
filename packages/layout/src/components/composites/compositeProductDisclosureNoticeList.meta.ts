import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeProductDisclosureNoticeList",
	target: "composite",
	name: "상품 고지 아코디언 리스트",
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
		repeatSeparator: {
			type: "string",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"AccordionProductInfo와 AccordionNoticeInfo 계열 Figma disclosure를 실제 AccordionInfo variants와 Divider 반복으로 정리한 상품 고지 composite",
	status: "stable",
};
