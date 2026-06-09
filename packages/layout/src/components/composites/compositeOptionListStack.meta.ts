import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeOptionListStack",
	target: "composite",
	name: "옵션 리스트 스택",
	props: {
		componentGaps: {
			type: "array",
		},
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "OptionList Figma grouping 아래 실제 OptionCard가 반복되는 상품 옵션 선택 composite",
	status: "stable",
};
