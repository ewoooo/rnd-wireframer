import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentButton",
	target: "composite",
	name: "버튼",
	props: {
		fullWidth: {
			type: "boolean",
		},
		gap: {
			type: "number",
		},
		size: {
			type: "string",
		},
	},
	children: {
		accepts: "component",
	},
	description: "단일 Button render component를 action item으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
