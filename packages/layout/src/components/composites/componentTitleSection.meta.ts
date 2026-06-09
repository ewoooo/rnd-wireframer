import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentTitleSection",
	target: "composite",
	name: "섹션 타이틀",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"단일 TitleSection render component를 Pagestack 또는 list group의 제목 row로 배치하는 컴포넌트 패턴",
	status: "stable",
};
