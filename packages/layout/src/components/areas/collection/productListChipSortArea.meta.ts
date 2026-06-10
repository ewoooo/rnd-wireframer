import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.productListChipSortArea",
	target: "area",
	name: "상품 리스트 칩 정렬 영역",
	description:
		"optional Chip 필터 다음 FilterSorting이 이어지고 ProductListGroup으로 연결되는 리스트-카드 상단 제어 area 패턴",
	props: {
		componentGap: {
			type: "number",
		},
		componentGaps: {
			type: "array",
		},
		controlGap: {
			type: "number",
		},
		flow: {
			type: "enum",
			values: ["grid", "horizontal", "stack"],
		},
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
