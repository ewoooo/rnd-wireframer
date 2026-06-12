import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.fieldStack",
	target: "area",
	name: "필드 스택",
	description: "Area children을 입력 필드 묶음으로 세로 배치하는 레이아웃 프리셋",
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
