import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentMapBlock",
	target: "composite",
	name: "지도 블록",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "단일 MapBlock render component를 매장 안내 지도 영역으로 배치하는 컴포넌트 패턴",
	status: "stable",
};
