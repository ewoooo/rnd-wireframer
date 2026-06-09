import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.nearbyStoreList",
	target: "area",
	name: "근처 매장 리스트",
	description: "지도와 근처 매장 row를 함께 표시하는 매장 안내 영역",
	props: {
		componentGap: {
			type: "number",
		},
		flow: {
			type: "enum",
			values: ["grid", "horizontal", "stack"],
		},
		gap: {
			type: "number",
		},
		mapHeight: {
			type: "number",
		},
		titleGap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
