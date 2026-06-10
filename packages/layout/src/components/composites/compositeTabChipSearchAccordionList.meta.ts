import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeTabChipSearchAccordionList",
	target: "composite",
	name: "탭 칩 검색 아코디언 리스트",
	props: {
		gap: {
			type: "number",
		},
		repeatSeparator: {
			type: "string",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"Tab, Chip filter, SearchBar, AccordionNoticeInfo[]를 순서대로 결합하는 이용안내/FAQ composite.",
	status: "stable",
};
