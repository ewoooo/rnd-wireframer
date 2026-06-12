import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentFooter",
	target: "composite",
	name: "푸터",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "단일 Footer render component를 하단 안내/링크 묶음으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
