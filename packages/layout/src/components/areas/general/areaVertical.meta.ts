import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.areaVertical",
	target: "area",
	name: "수직 스택",
	description:
		"Area children을 명시 순서대로 세로 배치하는 generic 레이아웃 프리셋. 다른 area pattern이 매칭 안 됐을 때 fallback.",
	props: {
		componentGap: {
			type: "number",
		},
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
