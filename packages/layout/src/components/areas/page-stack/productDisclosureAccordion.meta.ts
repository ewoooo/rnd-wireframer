import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.productDisclosureAccordion",
	target: "area",
	name: "상품 고시 아코디언",
	description:
		"판매자 정보, 교환/환불, 상품 이용 안내 같은 하단 고시 항목을 accordion list로 배치하는 영역",
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
