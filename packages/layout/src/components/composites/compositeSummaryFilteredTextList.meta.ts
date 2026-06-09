import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeSummaryFilteredTextList",
	target: "composite",
	name: "요약 필터 텍스트 리스트",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"CardSummary, TitleSection, Chip filter, TextListGroup을 순서대로 결합하는 리스트-텍스트 summary/filter/list composite.",
	status: "stable",
};
