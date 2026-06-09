import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeButtonMoreProductLink",
	target: "composite",
	name: "상품 더보기 링크",
	props: {
		componentGaps: {
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
		"Page (상세-상품)의 ButtonMore/ButtonMoreProduct layer를 TextButton alias surface로 수용하는 더보기 링크 composite",
	status: "stable",
};
