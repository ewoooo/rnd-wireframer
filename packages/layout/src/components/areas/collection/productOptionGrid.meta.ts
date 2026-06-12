import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.productOptionGrid",
	target: "area",
	name: "상품 옵션 그리드",
	description: "색상, 용량, 배송, 요금제처럼 선택 옵션 card를 제목 아래 2열 grid로 배치하는 영역",
	props: {
		columns: {
			type: "number",
		},
		componentGap: {
			type: "number",
			description: "Legacy layoutProps.componentGap preserved from the pre-component catalog.",
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
			description: "Legacy layoutProps.titleGap preserved from the pre-component catalog.",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
