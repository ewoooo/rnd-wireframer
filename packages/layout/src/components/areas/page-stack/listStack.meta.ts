import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.listStack",
	target: "area",
	name: "리스트 스택",
	description: "Area children을 리스트형 항목으로 세로 배치하는 레이아웃 프리셋",
	props: {
		componentGap: {
			type: "number",
			description: "Legacy layoutProps.componentGap preserved from the pre-component catalog.",
		},
		gap: {
			type: "number",
			description: "Contents slot child gap.",
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
			description: "Legacy layoutProps.titleGap preserved from the pre-component catalog.",
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
