import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.listSummaryCardArea",
	target: "area",
	name: "리스트 요약 카드 영역",
	description: "리스트-텍스트 화면 상단 Local_Summary에 CardSummary 단일 요약 카드를 배치하는 영역",
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
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
