import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.optionListSectionArea",
	target: "area",
	name: "옵션 리스트 섹션 영역",
	description:
		"단말기 상세의 색상/용량/배송/요금제 OptionList 섹션을 실제 OptionList surface로 배치하는 subtype.",
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
