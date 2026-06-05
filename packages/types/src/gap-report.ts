import type { PrddBinding } from "./prdd-screen-record";

/**
 * Schema D — Gap Report.
 * primitive가 부족할 때 AI가 인간에게 넘기는 작업 지시서.
 * suggestedPrimitive는 제안일 뿐 — 인간이 ComponentPropContract를 확정한다.
 * 자세한 계약은 database/AI-COMPOSITION-SPEC.md §5 참조.
 */

export type GapReportStatus = "open" | "in-progress" | "resolved" | "rejected";

export interface GapReportDetectedIn {
	screen: string;
	areaId: string;
	/** PRDD 컴포넌트 상세 표의 row no. */
	componentRow: number;
}

export interface GapReportEvidence {
	/** PRDD 컴포넌트 설명/비고에서 발췌 */
	intent: string;
	/** 표시 텍스트 컬럼 */
	displayText: string;
	bindings: PrddBinding[];
	/** 비고의 정책 인용 */
	policyCitations: string[];
}

export interface GapReportConsideredPrimitive {
	primitiveId: string;
	/** "표시 슬롯 3개, 5개 필요" 같은 구체적 이유 */
	rejectReason: string;
}

export interface GapReportConsideredComponentPattern {
	componentPatternId: string;
	rejectReason: string;
}

export interface GapReportSuggestedPrimitiveProp {
	name: string;
	/** 자연어. ComponentPropContract는 인간이 확정. */
	contractHint: string;
	required: boolean;
}

export interface GapReportSuggestedPrimitive {
	/** 예: "CardProductHero" */
	name: string;
	description: string;
	props: GapReportSuggestedPrimitiveProp[];
	variantsHint: string[];
	tokensUsedHint: string[];
}

export interface GapReportResolution {
	resolvedBy: string;
	/** ISO timestamp */
	resolvedAt: string;
	/** 실제 등록된 primitive id (이름은 다를 수 있음) */
	primitiveId: string;
	notes: string;
}

export interface GapReport {
	id: string;
	kind: "gap-report";
	status: GapReportStatus;

	detectedIn: GapReportDetectedIn;
	prddEvidence: GapReportEvidence;
	consideredPrimitives: GapReportConsideredPrimitive[];
	consideredComponentPatterns: GapReportConsideredComponentPattern[];
	suggestedPrimitive: GapReportSuggestedPrimitive;

	resolution?: GapReportResolution;
}
