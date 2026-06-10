import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentStoreCard",
	target: "composite",
	name: "매장 카드",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "단일 StoreCard render component를 근처 매장 row로 배치하는 컴포넌트 패턴",
	status: "stable",
};
