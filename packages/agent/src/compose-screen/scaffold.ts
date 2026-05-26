import type {
	ArchetypeBlockId,
	PrddScreenRecord,
	ScreenArchetype,
	ScreenStrategy,
} from "@cx/types";

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
		requiredBlocks: [
			"navigation",
			"hero-summary",
			"primary-facts",
			"supporting-info",
			"primary-action",
		],
		optionalBlocks: ["option-selection", "disclosure", "footer-legal"],
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
		optionalBlocks: ["supporting-info", "disclosure", "primary-action"],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	"list-browse": {
		archetype: "list-browse",
		strategy: "comparison",
		requiredBlocks: ["navigation", "list-results"],
		optionalBlocks: ["filter-sort", "supporting-info", "primary-action"],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
	support: {
		archetype: "support",
		strategy: "support",
		requiredBlocks: ["navigation", "supporting-info", "support-action"],
		optionalBlocks: ["primary-facts", "disclosure"],
		allowedSyntheticBlocks: ["section-header", "divider"],
	},
};

const ARCHETYPE_KEYWORDS: Array<{
	archetype: ScreenArchetype;
	keywords: string[];
}> = [
	{
		archetype: "commerce-detail",
		keywords: ["상품", "가격", "판매", "가입 가능", "혜택", "구매", "상세"],
	},
	{
		archetype: "agreement-flow",
		keywords: ["약관", "동의", "필수", "선택 동의"],
	},
	{
		archetype: "form-entry",
		keywords: ["입력", "인증", "정보 입력", "신청서", "폼"],
	},
	{
		archetype: "confirmation",
		keywords: ["완료", "결과", "성공", "실패", "확인"],
	},
	{
		archetype: "list-browse",
		keywords: ["목록", "리스트", "검색", "조회", "선택"],
	},
	{
		archetype: "support",
		keywords: ["안내", "도움", "문의", "고객센터", "오류"],
	},
];

export function buildArchetypeScaffold(record: PrddScreenRecord): ArchetypeScaffold {
	const corpus = collectRecordText(record);
	for (const candidate of ARCHETYPE_KEYWORDS) {
		const hits = candidate.keywords.filter((keyword) => corpus.includes(keyword));
		if (hits.length > 0) {
			return {
				...ARCHETYPE_SCAFFOLDS[candidate.archetype],
				rationale: [`matched keywords: ${hits.join(", ")}`],
			};
		}
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
