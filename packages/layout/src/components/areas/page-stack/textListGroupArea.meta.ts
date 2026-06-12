import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.textListGroupArea",
	target: "area",
	name: "텍스트 리스트 그룹 영역",
	description:
		"TextListGroup 내부에서 TitleSection과 Local_ListInfo의 InfoTextList 5개 row를 Divider로 나눠 배치하는 하위 리스트 영역",
	props: {
		componentGap: {
			type: "number",
		},
		gap: {
			type: "number",
		},
		titleGap: {
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
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
