import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentAppBar",
	target: "composite",
	name: "앱 바",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "단일 AppBar render component를 screen header chrome으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
