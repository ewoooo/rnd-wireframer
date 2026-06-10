import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeTitleInfoTextList",
	target: "composite",
	name: "타이틀 포함 정보 텍스트 리스트",
	props: {
		gap: {
			type: "number",
		},
		repeatSeparator: {
			type: "string",
		},
		rowGap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"TitleSection 다음 InfoTextList[]와 Divider[]를 반복 배치하는 text list section composite. Pagestack 안팎의 Local_ListInfo layer를 같은 구조로 해석한다.",
	status: "stable",
};
