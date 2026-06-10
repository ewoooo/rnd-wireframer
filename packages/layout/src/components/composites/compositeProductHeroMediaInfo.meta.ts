import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeProductHeroMediaInfo",
	target: "composite",
	name: "상품 히어로 미디어 정보 조합",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"ThumbnailLarge와 ProductInfo를 순서대로 결합하는 상품 상세 hero composite. Figma layer가 하나의 block처럼 보이지만 실제 렌더 단위는 두 component다.",
	status: "stable",
};
