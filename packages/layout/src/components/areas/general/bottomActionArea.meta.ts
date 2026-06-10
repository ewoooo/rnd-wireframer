import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.bottomActionArea",
	target: "area",
	name: "하단 액션 영역",
	description: "Screen Bottom region에 고정되는 주요 ActionButton CTA를 배치하는 레이아웃 프리셋",
	props: {
		componentGap: {
			type: "number",
		},
		gap: {
			type: "number",
		},
		paddingY: {
			type: "number",
		},
		titleGap: {
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
		safeArea: {
			type: "boolean",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
