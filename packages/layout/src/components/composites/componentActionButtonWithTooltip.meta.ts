import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentActionButtonWithTooltip",
	target: "composite",
	name: "툴팁 포함 하단 액션 버튼",
	props: {
		buttonHeight: {
			type: "number",
		},
		gap: {
			type: "number",
		},
		paddingBottom: {
			type: "number",
		},
		paddingTop: {
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
		"단일 ActionButton render component에 optional tooltip affordance metadata를 얹어 쓰는 상품 상세 하단 CTA 패턴",
	status: "stable",
};
