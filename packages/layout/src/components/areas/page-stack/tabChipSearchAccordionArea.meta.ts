import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.tabChipSearchAccordionArea",
	target: "area",
	name: "탭 칩 검색 아코디언 영역",
	description:
		"이용안내 Contents에서 Tab, Chip, Figma SearchBar affordance, AccordionList가 순서대로 이어지는 검색/필터 포함 안내 영역",
	props: {
		componentGap: {
			type: "number",
		},
		gap: {
			type: "number",
		},
		filterGap: {
			type: "number",
		},
		divider: {
			type: "enum",
			values: ["contents", "none", "section"],
		},
		itemPaddingX: {
			type: "number",
		},
		itemTemplate: {
			type: "enum",
			values: ["card-0", "default-20", "plain"],
		},
		paddingX: {
			type: "number",
		},
		paddingY: {
			type: "number",
		},
		sectionGap: {
			type: "number",
		},
		sectionPaddingX: {
			type: "number",
		},
		slotInsetX: {
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
