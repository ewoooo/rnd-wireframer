import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentTab",
	target: "composite",
	name: "탭 내비게이션",
	props: {
		flow: {
			type: "enum",
			values: ["horizontal", "vertical"],
		},
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
		"단일 Tab render component를 list category 전환용 상단 tab strip으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
