import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.authMethodList",
	target: "area",
	name: "인증수단 선택 리스트",
	description:
		"휴대폰 본인인증, PASS, 공동인증서처럼 인증수단 선택지를 ListCell row 묶음으로 배치하는 선택형 목록 area 패턴",
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
		itemPaddingX: {
			type: "number",
		},
		itemPaddingY: {
			type: "number",
		},
		divider: {
			type: "enum",
			values: ["contents", "none", "section"],
			description:
				'Divider policy: "contents" renders 1px row dividers between children, "section" renders a trailing 4px area break, "none" disables dividers.',
		},
		listPresentation: {
			type: "string",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
