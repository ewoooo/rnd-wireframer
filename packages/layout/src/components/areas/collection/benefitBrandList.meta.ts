import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.benefitBrandList",
	target: "area",
	name: "혜택 브랜드 리스트",
	description: "제휴/혜택 브랜드 card를 세로 list로 배치하는 영역",
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
