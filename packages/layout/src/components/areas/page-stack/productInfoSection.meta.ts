import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.productInfoSection",
	target: "area",
	name: "상품 정보 섹션",
	description:
		"가격/혜택 요약, 상품 정보, 사용 방법, 유의사항처럼 title과 본문 블록을 세로로 배치하는 상세 정보 영역",
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
