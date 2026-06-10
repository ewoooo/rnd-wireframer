import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.plainInfoTextListArea",
	target: "area",
	name: "기본 정보 텍스트 리스트 영역",
	description:
		"별도 Contents frame 없이 Local_ListInfo에 InfoTextList row만 반복되는 공지사항형 plain list 영역",
	props: {
		componentGap: {
			type: "number",
		},
		gap: {
			type: "number",
		},
		rowCount: {
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
