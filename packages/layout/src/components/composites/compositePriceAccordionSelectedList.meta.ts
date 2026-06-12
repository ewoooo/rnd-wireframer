import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositePriceAccordionSelectedList",
	target: "composite",
	name: "가격 아코디언 선택 리스트",
	props: {
		gap: {
			type: "number",
		},
		repeatSeparator: {
			type: "string",
		},
		rowGap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"Page (상세-상품)의 AccordionPriceInfo 아래 선택형 가격 row와 divider가 반복되는 가격 상세 composite",
	status: "stable",
};
