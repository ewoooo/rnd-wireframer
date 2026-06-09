import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeSummarySectionedInfoList",
	target: "composite",
	name: "요약 섹션형 정보 리스트",
	props: {
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"CardSummary 다음 Pagestack 단위 TitleSection + InfoTextList[] section을 Divider로 반복하는 이용내역 composite.",
	status: "stable",
};
