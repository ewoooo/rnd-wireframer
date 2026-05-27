import type { ArchetypeBlockId, ScreenArchetype, ScreenStrategy } from "@cx/types/composition-output";
import type { PrddScreenRecord } from "@cx/types/prdd-screen-record";
export interface ArchetypeScaffold {
	archetype: ScreenArchetype;
	strategy: ScreenStrategy;
	requiredBlocks: ArchetypeBlockId[];
	optionalBlocks: ArchetypeBlockId[];
	allowedSyntheticBlocks: ArchetypeBlockId[];
	rationale: string[];
}

const ARCHETYPE_SCAFFOLDS: Record<ScreenArchetype, Omit<ArchetypeScaffold, "rationale">> = {
	"agreement-flow": {
		archetype: "agreement-flow",
		strategy: "task-flow",
		requiredBlocks: ["navigation", "terms-list", "agreement-control", "primary-action"],
		optionalBlocks: ["supporting-info", "disclosure"],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	"commerce-detail": {
		archetype: "commerce-detail",
		strategy: "detail-reading",
		requiredBlocks: ["navigation", "hero-media", "hero-summary", "primary-facts", "primary-action"],
		optionalBlocks: [
			"price-summary",
			"price-accordion",
			"benefit-list",
			"option-selection",
			"option-list",
			"option-grid",
			"delivery-info",
			"rich-image-tab",
			"product-more-link",
			"coupon-benefit",
			"map-store-list",
			"brand-benefit-list",
			"product-disclosure",
			"supporting-info",
			"disclosure",
			"disclosure-list",
			"footer-legal",
			"sticky-cta",
			"bottom-cta",
		],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	confirmation: {
		archetype: "confirmation",
		strategy: "confirmation",
		requiredBlocks: ["navigation", "result-state", "next-action"],
		optionalBlocks: ["primary-facts", "support-action"],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	"form-entry": {
		archetype: "form-entry",
		strategy: "form-entry",
		requiredBlocks: ["navigation", "form-fields", "validation-feedback", "primary-action"],
		optionalBlocks: ["supporting-info", "disclosure"],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	"generic-detail": {
		archetype: "generic-detail",
		strategy: "detail-reading",
		requiredBlocks: ["navigation", "hero-summary", "primary-facts"],
		optionalBlocks: [
			"summary-card",
			"text-list",
			"info-text-list",
			"notice-list",
			"accordion-list",
			"supporting-info",
			"disclosure",
			"primary-action",
		],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	"list-browse": {
		archetype: "list-browse",
		strategy: "comparison",
		requiredBlocks: ["navigation", "list-results"],
		optionalBlocks: [
			"summary-card",
			"search-filter",
			"tab-filter",
			"filter-chip",
			"filter-sort",
			"card-list",
			"product-list",
			"product-list-group",
			"product-list-horizontal",
			"product-list-row",
			"text-list",
			"info-text-list",
			"notice-list",
			"accordion-list",
			"supporting-info",
			"primary-action",
		],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	support: {
		archetype: "support",
		strategy: "support",
		requiredBlocks: ["navigation", "supporting-info", "support-action"],
		optionalBlocks: [
			"primary-facts",
			"summary-card",
			"info-text-list",
			"notice-list",
			"accordion-list",
			"disclosure",
		],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
};

const ARCHETYPE_KEYWORDS: Array<{
	archetype: ScreenArchetype;
	keywords: Array<{ keyword: string; weight: number }>;
}> = [
	{
		archetype: "list-browse",
		keywords: [
			{ keyword: "공지사항", weight: 5 },
			{ keyword: "이용안내", weight: 5 },
			{ keyword: "사용안내", weight: 5 },
			{ keyword: "포인트내역", weight: 6 },
			{ keyword: "포인트 내역", weight: 6 },
			{ keyword: "할인내역", weight: 6 },
			{ keyword: "할인 내역", weight: 6 },
			{ keyword: "이용내역", weight: 6 },
			{ keyword: "이용 내역", weight: 6 },
			{ keyword: "혜택내역", weight: 6 },
			{ keyword: "혜택 내역", weight: 6 },
			{ keyword: "카드 리스트", weight: 7 },
			{ keyword: "카드 목록", weight: 7 },
			{ keyword: "상품 리스트", weight: 7 },
			{ keyword: "상품 목록", weight: 7 },
			{ keyword: "상품 조회", weight: 5 },
			{ keyword: "상품 탐색", weight: 5 },
			{ keyword: "요금제 리스트", weight: 7 },
			{ keyword: "요금제 목록", weight: 7 },
			{ keyword: "요금제 조회", weight: 5 },
			{ keyword: "단말기 리스트", weight: 7 },
			{ keyword: "단말기 목록", weight: 7 },
			{ keyword: "단말기 조회", weight: 5 },
			{ keyword: "구독상품", weight: 7 },
			{ keyword: "구독상품 목록", weight: 9 },
			{ keyword: "구독상품 리스트", weight: 9 },
			{ keyword: "혜택 리스트", weight: 7 },
			{ keyword: "혜택 목록", weight: 7 },
			{ keyword: "부가서비스", weight: 6 },
			{ keyword: "부가서비스 목록", weight: 8 },
			{ keyword: "부가서비스 리스트", weight: 8 },
			{ keyword: "인터넷 리스트", weight: 7 },
			{ keyword: "인터넷 목록", weight: 7 },
			{ keyword: "리스트-카드", weight: 8 },
			{ keyword: "page (리스트-카드)", weight: 10 },
			{ keyword: "productlistgroup", weight: 8 },
			{ keyword: "listproducthorizontal", weight: 8 },
			{ keyword: "listproductrow", weight: 8 },
			{ keyword: "filtersorting", weight: 5 },
			{ keyword: "내역", weight: 4 },
			{ keyword: "요금제", weight: 4 },
			{ keyword: "단말기", weight: 4 },
			{ keyword: "인터넷", weight: 4 },
			{ keyword: "혜택", weight: 3 },
			{ keyword: "목록", weight: 3 },
			{ keyword: "리스트", weight: 3 },
			{ keyword: "검색", weight: 2 },
			{ keyword: "조회", weight: 2 },
			{ keyword: "필터", weight: 2 },
			{ keyword: "선택", weight: 1 },
		],
	},
	{
		archetype: "commerce-detail",
		keywords: [
			{ keyword: "상세_구독상품", weight: 12 },
			{ keyword: "상세_기프티콘", weight: 12 },
			{ keyword: "상세_혜택브랜드", weight: 12 },
			{ keyword: "상세_단말기", weight: 12 },
			{ keyword: "상품 상세", weight: 5 },
			{ keyword: "상품상세", weight: 5 },
			{ keyword: "단말기 상세", weight: 10 },
			{ keyword: "단말기상세", weight: 10 },
			{ keyword: "구독상품 상세", weight: 10 },
			{ keyword: "구독상품상세", weight: 10 },
			{ keyword: "기프티콘 상세", weight: 10 },
			{ keyword: "기프티콘상세", weight: 10 },
			{ keyword: "혜택브랜드 상세", weight: 10 },
			{ keyword: "혜택브랜드상세", weight: 10 },
			{ keyword: "상품 정보", weight: 4 },
			{ keyword: "상품정보", weight: 4 },
			{ keyword: "장바구니", weight: 4 },
			{ keyword: "주문", weight: 4 },
			{ keyword: "상품", weight: 3 },
			{ keyword: "구매", weight: 3 },
			{ keyword: "구독", weight: 3 },
			{ keyword: "결제", weight: 3 },
			{ keyword: "옵션", weight: 3 },
			{ keyword: "요금제", weight: 3 },
			{ keyword: "선물가", weight: 3 },
			{ keyword: "가격", weight: 2 },
			{ keyword: "판매", weight: 2 },
			{ keyword: "가입 가능", weight: 2 },
			{ keyword: "배송", weight: 2 },
			{ keyword: "혜택", weight: 1 },
			{ keyword: "할인", weight: 1 },
			{ keyword: "쿠폰", weight: 1 },
		],
	},
	{
		archetype: "agreement-flow",
		keywords: [
			{ keyword: "선택 동의", weight: 4 },
			{ keyword: "약관", weight: 3 },
			{ keyword: "동의", weight: 3 },
			{ keyword: "필수", weight: 1 },
		],
	},
	{
		archetype: "form-entry",
		keywords: [
			{ keyword: "정보 입력", weight: 4 },
			{ keyword: "입력", weight: 3 },
			{ keyword: "인증", weight: 3 },
			{ keyword: "신청서", weight: 3 },
			{ keyword: "폼", weight: 2 },
		],
	},
	{
		archetype: "confirmation",
		keywords: [
			{ keyword: "완료", weight: 3 },
			{ keyword: "결과", weight: 3 },
			{ keyword: "성공", weight: 3 },
			{ keyword: "실패", weight: 3 },
			{ keyword: "확인", weight: 1 },
		],
	},
	{
		archetype: "support",
		keywords: [
			{ keyword: "고객센터", weight: 4 },
			{ keyword: "문의", weight: 3 },
			{ keyword: "도움", weight: 3 },
			{ keyword: "오류", weight: 3 },
			{ keyword: "안내", weight: 1 },
		],
	},
];

export function buildArchetypeScaffold(record: PrddScreenRecord): ArchetypeScaffold {
	const corpus = collectRecordText(record);
	const candidates = ARCHETYPE_KEYWORDS.map((candidate, index) => {
		const hits = candidate.keywords.filter(({ keyword }) => corpus.includes(keyword));
		const score = hits.reduce((sum, hit) => sum + hit.weight, 0);
		return { ...candidate, index, hits, score };
	})
		.filter((candidate) => candidate.score > 0)
		.sort((left, right) => right.score - left.score || left.index - right.index);

	const matched = candidates[0];
	if (matched) {
		return {
			...ARCHETYPE_SCAFFOLDS[matched.archetype],
			rationale: [
				`matched keywords: ${matched.hits.map(({ keyword }) => keyword).join(", ")} (score ${matched.score})`,
			],
		};
	}

	return {
		...ARCHETYPE_SCAFFOLDS["generic-detail"],
		rationale: ["no specific archetype keyword matched"],
	};
}

function collectRecordText(record: PrddScreenRecord): string {
	const values: string[] = [
		record.id,
		record.name,
		record.description ?? "",
		...record.useCases,
		...record.features,
	];
	for (const area of record.areas) {
		values.push(area.areaId, area.area.name, area.area.description ?? "", area.area.layout);
		for (const child of area.area.children) {
			values.push(
				child.primitiveId ?? "",
				child.semanticName,
				child.rawComponentId,
				child.displayTextTemplate ?? "",
				...child.notes,
				...child.policyIds,
			);
		}
	}
	return values.join(" ").toLowerCase();
}
