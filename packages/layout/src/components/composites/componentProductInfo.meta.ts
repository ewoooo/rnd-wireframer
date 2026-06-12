import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentProductInfo",
	target: "composite",
	name: "상품 정보 요약",
	props: {
		gap: {
			type: "number",
		},
		paddingX: {
			type: "number",
		},
		priceGap: {
			type: "number",
		},
		titleGap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"브랜드명, 상품명, 정상가/할인가, badge, CTA chip surface를 가진 단일 ProductInfo render component 패턴",
	status: "stable",
};
