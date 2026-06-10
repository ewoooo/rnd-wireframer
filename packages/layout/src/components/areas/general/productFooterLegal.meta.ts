import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.productFooterLegal",
	target: "area",
	name: "상품 상세 푸터",
	description: "이용약관, 판매자 정보, copyright를 포함하는 상품 상세 footer 영역",
	props: {
		gap: {
			type: "number",
		},
		paddingX: {
			type: "number",
		},
		paddingY: {
			type: "number",
		},
		bottomPadding: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
