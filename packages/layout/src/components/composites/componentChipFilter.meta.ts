import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentChipFilter",
	target: "composite",
	name: "칩 필터",
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
		itemHeight: {
			type: "number",
		},
		paddingX: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"단일 Chip render component를 수평 필터 chip row의 반복 item으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
