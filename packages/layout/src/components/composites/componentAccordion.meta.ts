import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentAccordion",
	target: "composite",
	name: "아코디언",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "단일 Accordion render component를 expandable item으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
