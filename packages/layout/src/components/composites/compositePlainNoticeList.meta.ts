import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositePlainNoticeList",
	target: "composite",
	name: "기본 공지 텍스트 리스트",
	props: {
		gap: {
			type: "number",
		},
		paddingX: {
			type: "number",
		},
		repeatSeparator: {
			type: "string",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"InfoTextList[]와 Divider[]만 반복하는 공지사항 list composite. 요약/필터/타이틀 없이 Local_ListInfo를 content rail에 직접 배치한다.",
	status: "stable",
};
