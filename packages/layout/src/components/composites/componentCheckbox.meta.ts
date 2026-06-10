import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentCheckbox",
	target: "composite",
	name: "체크박스",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "단일 Checkbox render component를 selectable item으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
