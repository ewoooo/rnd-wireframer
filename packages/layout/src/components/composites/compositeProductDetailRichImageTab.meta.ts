import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeProductDetailRichImageTab",
	target: "composite",
	name: "상품 상세 이미지 탭 콘텐츠",
	props: {
		componentGaps: {
			type: "array",
		},
		figmaOnlyTypes: {
			type: "array",
		},
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"ThumbnailLarge/Thumbnail hero, ProductInfo, UnderlineTab alias, rich detail body가 이어지는 상품 상세 상단 composite",
	status: "stable",
};
