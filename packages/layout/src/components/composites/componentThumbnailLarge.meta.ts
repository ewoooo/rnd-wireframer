import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentThumbnailLarge",
	target: "composite",
	name: "대형 썸네일",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"단일 ThumbnailLarge render component를 상품/혜택 상세의 hero media로 배치하는 컴포넌트 패턴",
	status: "stable",
};
