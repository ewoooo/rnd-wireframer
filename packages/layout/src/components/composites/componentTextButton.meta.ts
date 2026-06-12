import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentTextButton",
	target: "composite",
	name: "텍스트 버튼",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "자세히 보기, 더보기 같은 inline link action을 표시하는 TextButton 패턴",
	status: "stable",
};
