import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.accordionList",
	target: "area",
	name: "아코디언 리스트",
	description:
		"Area children을 헤더 + 펼침 본문 구조로 묶어, 펼쳐진 헤더 아래에 본문 슬롯을 인라인으로 배치하는 레이아웃 프리셋",
	props: {
		componentGap: {
			type: "number",
		},
		gap: {
			type: "number",
		},
		paddingX: {
			type: "number",
		},
		sectionGap: {
			type: "number",
		},
		slotInsetX: {
			type: "number",
		},
		itemPaddingX: {
			type: "number",
		},
		itemTemplate: {
			type: "enum",
			values: ["card-0", "default-20", "plain"],
		},
		paddingY: {
			type: "number",
		},
		sectionPaddingX: {
			type: "number",
		},
		titleGap: {
			type: "number",
		},
		divider: {
			type: "enum",
			values: ["contents", "none", "section"],
			description:
				'Divider policy: "contents" renders 1px row dividers between children, "section" renders a trailing 4px area break, "none" disables dividers.',
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
