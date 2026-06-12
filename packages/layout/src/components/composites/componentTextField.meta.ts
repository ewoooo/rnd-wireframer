import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentTextField",
	target: "composite",
	name: "텍스트 필드",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "단일 TextField render component를 field item으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
