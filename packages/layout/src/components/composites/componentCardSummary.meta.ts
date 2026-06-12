import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentCardSummary",
	target: "composite",
	name: "요약 카드",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "상품명, 가격, 대표 설명을 담는 CardSummary 단일 컴포넌트 패턴",
	status: "stable",
};
