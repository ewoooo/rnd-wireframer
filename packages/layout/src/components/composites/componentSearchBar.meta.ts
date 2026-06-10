import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentSearchBar",
	target: "composite",
	name: "검색 바",
	props: {
		defaultProps: {
			type: "object",
		},
		gap: {
			type: "number",
		},
		height: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"단일 SearchBar render component를 검색/LLM 입력 affordance로 배치하는 컴포넌트 패턴",
	status: "stable",
};
