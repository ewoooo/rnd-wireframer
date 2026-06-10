import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentAccordionNoticeInfo",
	target: "composite",
	name: "공지 아코디언 항목",
	props: {
		collapsedHeight: {
			type: "number",
		},
		expandedHeight: {
			type: "number",
		},
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"단일 AccordionNoticeInfo render component를 FAQ/이용안내 expandable row로 배치하는 컴포넌트 패턴",
	status: "stable",
};
