import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentActionButton",
	target: "composite",
	name: "하단 액션 버튼",
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
	description: "Screen.Bottom의 단일 주요 CTA를 ActionButton render component로 배치하는 기본 패턴",
	status: "stable",
};
