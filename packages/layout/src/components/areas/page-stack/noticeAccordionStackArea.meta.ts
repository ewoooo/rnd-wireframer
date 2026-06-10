import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.noticeAccordionStackArea",
	target: "area",
	name: "공지 아코디언 스택 영역",
	description:
		"기프티콘/혜택브랜드/단말기 상세의 AccordionNoticeInfo disclosure 또는 long guide를 반복 배치하는 subtype",
	props: {
		componentGap: {
			type: "number",
		},
		gap: {
			type: "number",
		},
		divider: {
			type: "enum",
			values: ["contents", "none", "section"],
			description:
				'Divider policy: "contents" renders 1px row dividers between children, "section" renders a trailing 4px area break, "none" disables dividers.',
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
