import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeStoreMapList",
	target: "composite",
	name: "지도 매장 리스트 조합",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"MapBlock 다음 StoreCard 목록을 배치하는 근처 매장 안내 composite. 지도와 매장 row는 각각 실제 component surface로 유지한다.",
	status: "stable",
};
