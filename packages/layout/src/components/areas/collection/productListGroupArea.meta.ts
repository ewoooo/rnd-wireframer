import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.productListGroupArea",
	target: "area",
	name: "상품 리스트 그룹 영역",
	description:
		"Page (리스트-카드)의 ProductListGroup 단위 섹션을 표현하는 area 패턴. ProductListGroup은 실제 단일 컴포넌트가 아니라 title, optional control, card rows를 묶는 composite/area 구조로 취급한다.",
	props: {
		componentGap: {
			type: "number",
		},
		componentGaps: {
			type: "array",
		},
		flow: {
			type: "enum",
			values: ["grid", "horizontal", "stack"],
		},
		gap: {
			type: "number",
		},
		titleGap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
