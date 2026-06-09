import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentLegalText",
	target: "composite",
	name: "법적 고지 텍스트",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"단일 LegalText render component를 약관/유의사항 fine print 목록으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
