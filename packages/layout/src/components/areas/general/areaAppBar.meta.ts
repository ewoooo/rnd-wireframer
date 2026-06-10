import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.areaAppBar",
	target: "area",
	name: "앱바 헤더",
	description:
		"화면 상단 navigation AppBar 를 담는 area 레이아웃. AppBar 컴포넌트가 단일 자식으로 들어간다.",
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
