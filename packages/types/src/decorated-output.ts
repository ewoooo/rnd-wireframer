import type { DesignReference, LayoutPatternDraft } from "./composition-output";

/**
 * Schema E — Decorated Output.
 *
 * LLM #2 Decorate의 산출물. **트리 구조는 변경 금지** — composed.json 위에 layoutPattern verification만 얹는다.
 * 의도적으로 트리/props/bindings 필드를 포함하지 않는다 (구조적으로 침범 불가능하게).
 *
 * verification은 screen / area / (optional) decision 단위로 두며,
 * Compose의 layoutPatternDraft 를 (a) 그대로 승인, (b) variant만 조정, (c) 다른 패턴으로 보정 중 하나로 처리한다.
 *
 * 자세한 계약은 database/AI-COMPOSITION-SPEC.md §1.4 / §7.2 참조.
 */

export type LayoutVerificationVerdict =
	| "accepted"
	| "variant-adjusted"
	| "overridden";

export interface LayoutPatternVerification {
	verdict: LayoutVerificationVerdict;
	finalLayoutPattern: {
		layoutPatternId: string;
		variant?: string;
	};
	/**
	 * Compose가 만든 원 draft. verdict가 "accepted"가 아닐 때 (변경됐을 때) 필수.
	 * 추적성 보장 — 원본을 사라지게 하지 않는다.
	 */
	originalDraft?: LayoutPatternDraft;
	/** SPEC §7.2 — 모든 verification에 필수 (비어있지 않음). */
	reasons: string[];
	/** verdict가 "variant-adjusted"/"overridden"일 때 필수. */
	designRefs?: DesignReference[];
}

export interface DecoratedOutput {
	kind: "decorated-output";
	schemaVersion: string;
	source: {
		composedScreenId: string;
		composedSchemaVersion: string;
		decorateModel: string;
	};

	/** screen 단위 verification (필수). */
	screen: LayoutPatternVerification;
	/** key = areaId. Compose 출력의 모든 area에 1:1 대응. */
	areas: Record<string, LayoutPatternVerification>;
	/** key = decisionId. Compose가 decision-level draft를 만든 경우만 존재. */
	decisions: Record<string, LayoutPatternVerification>;
}
