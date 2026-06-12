import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta = {
	id: "layout.screen.mobileScreen",
	target: "screen",
	name: "모바일 화면",
	description:
		"단일 컬럼 모바일 화면 shell 패턴. Header, scrollable Contents, optional sticky Bottom action을 분리한다. 상품/구독/단말기 상세(Figma `SKT GenUI Test 0514` 상세-상품), 텍스트 리스트(node `10042:46203` 리스트-텍스트 — 이용내역·T플러스포인트내역·할인내역·공지사항·이용안내), 카드 리스트(node `9896:91122` 리스트-카드 — 상품군별 chip·filter/sort·card list) 등 모바일 화면 전반에 사용한다.",
	props: {
		contentWidth: {
			type: "number",
		},
		gap: {
			type: "number",
		},
		safeArea: {
			type: "string",
		},
		height: {
			type: "number",
		},
		headerHeight: {
			type: "number",
		},
	},
	children: {
		accepts: "region",
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
