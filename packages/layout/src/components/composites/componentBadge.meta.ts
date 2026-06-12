import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentBadge",
	target: "composite",
	name: "상태 배지",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "판매 상태, 가입 가능 여부 같은 짧은 상태값을 표시하는 Badge 패턴",
	status: "stable",
};
