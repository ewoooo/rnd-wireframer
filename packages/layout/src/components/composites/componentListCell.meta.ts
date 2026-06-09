import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentListCell",
	target: "composite",
	name: "리스트 셀",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "단일 ListCell render component를 list item으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
