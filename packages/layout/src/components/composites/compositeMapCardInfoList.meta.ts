import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeMapCardInfoList",
	target: "composite",
	name: "지도 카드 정보 리스트",
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
	description: "MapBlock 아래 CardInfo Figma row 목록이 이어지는 매장/위치 안내 composite",
	status: "stable",
};
