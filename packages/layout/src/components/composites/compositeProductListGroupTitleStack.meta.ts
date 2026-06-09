import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeProductListGroupTitleStack",
	target: "composite",
	name: "상품 리스트 그룹 타이틀 스택",
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
		"요금제 variant처럼 ProductListGroup section이 두 번 반복되고 각 group 안에 title row와 상품 card set이 쌓이는 composite. ProductListGroup은 Figma grouping layer이며 실제 component가 아니다.",
	status: "stable",
};
