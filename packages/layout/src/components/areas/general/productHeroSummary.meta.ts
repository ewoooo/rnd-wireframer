import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.productHeroSummary",
	target: "area",
	name: "상품 히어로 요약",
	description:
		"대표 이미지/요약 카드 다음 핵심 상품 정보와 primary facts가 이어지는 상품 상세 상단 요약 영역",
	props: {
		componentGap: {
			type: "number",
		},
		gap: {
			type: "number",
		},
		surface: {
			type: "string",
		},
		thumbnailHeight: {
			type: "number",
		},
		infoPaddingX: {
			type: "number",
		},
		infoPaddingTop: {
			type: "number",
		},
		infoPaddingBottom: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
