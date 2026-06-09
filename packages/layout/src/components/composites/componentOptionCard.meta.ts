import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentOptionCard",
	target: "composite",
	name: "옵션 선택 카드",
	props: {
		gap: {
			type: "number",
		},
		minHeight: {
			type: "number",
		},
		radius: {
			type: "number",
		},
		selectedStroke: {
			type: "string",
		},
	},
	children: {
		accepts: "component",
	},
	description: "선택 상태 stroke와 보조 설명을 갖는 단일 OptionCard render component 패턴",
	status: "stable",
};
