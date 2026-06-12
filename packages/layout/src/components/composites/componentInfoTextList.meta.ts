import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentInfoTextList",
	target: "composite",
	name: "정보 텍스트 리스트 항목",
	props: {
		gap: {
			type: "number",
		},
		height: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"단일 InfoTextList render component를 title/category/date/badge/rightText 기반 list row로 배치하는 컴포넌트 패턴",
	status: "stable",
};
