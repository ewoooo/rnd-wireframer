import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentListText",
	target: "composite",
	name: "리스트 텍스트",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "라벨과 값을 한 줄로 표시하는 ListText 패턴",
	status: "stable",
};
