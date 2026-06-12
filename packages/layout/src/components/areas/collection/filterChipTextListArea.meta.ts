import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.filterChipTextListArea",
	target: "area",
	name: "필터 칩 텍스트 리스트 영역",
	description:
		"요약 카드 아래 ContentsTitle, Chip filter, TextListGroup이 순서대로 이어지는 포인트/할인 내역 리스트 영역",
	props: {
		componentGap: {
			type: "number",
		},
		filterGap: {
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
