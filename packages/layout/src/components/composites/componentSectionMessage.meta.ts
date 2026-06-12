import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentSectionMessage",
	target: "composite",
	name: "섹션 메시지",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "단일 SectionMessage render component를 message item으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
