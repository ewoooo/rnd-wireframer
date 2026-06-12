import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeFooterLegalLinks",
	target: "composite",
	name: "푸터 법적 고지 조합",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"LegalText와 Footer를 결합해 약관, 판매자 정보, copyright를 표시하는 하단 legal composite.",
	status: "stable",
};
