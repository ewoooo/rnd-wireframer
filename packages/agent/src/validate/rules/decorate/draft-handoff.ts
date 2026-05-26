import type {
	CompositionDecision,
	CompositionOutput,
	DesignDeck,
	DecoratedOutput,
	LayoutPatternDraft,
	LayoutPatternVerification,
	ValidationIssue,
} from "@cx/types";

import { indexDesignDeck } from "../shared/deck-lookup";
import { makeIssue } from "../shared/issue";

/**
 * Rule: draft 변경 시 사유 필수 (SPEC §7.2)
 *
 * 변경 자체는 허용. 변경했는데 3종 세트(원 draft 보존 + reasons + designRefs) 누락만 위반.
 *
 * 추가로:
 * - decorated.areas[areaId] 는 Compose의 area와 1:1 (key 일치)
 * - decorated.decisions[decisionId] 는 Compose의 decision 중 layoutPatternDraft를 가진 것만
 * - "accepted" verdict인데 finalLayoutPattern이 Compose draft와 다르면 verdict 모순
 */
export function checkDraftHandoff(
	decorated: DecoratedOutput,
	composition: CompositionOutput,
	designDeck: DesignDeck,
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const designIndex = indexDesignDeck(designDeck);

	// screen
	verifyChange(
		decorated.screen,
		composition.screen.layoutPatternDraft,
		{ path: ["screen"], nodeId: composition.screen.screenId, nodeKind: "screen" },
		designIndex.documents,
		issues,
	);

	// area: key 일치 + draft 매칭
	const areaById = new Map(composition.areas.map((a) => [a.areaId, a]));
	for (const [areaId, verification] of Object.entries(decorated.areas)) {
		const area = areaById.get(areaId);
		if (!area) {
			issues.push(
				makeIssue(
					"layout-pattern.verification.change-unjustified",
					"reference",
					`decorated.areas의 areaId "${areaId}" 가 composed.areas에 없음`,
					{ path: ["areas", areaId], nodeId: areaId, data: { areaId } },
				),
			);
			continue;
		}
		verifyChange(
			verification,
			area.layoutPatternDraft,
			{ path: ["areas", areaId], nodeId: areaId, nodeKind: "area" },
			designIndex.documents,
			issues,
		);
	}
	for (const area of composition.areas) {
		if (!(area.areaId in decorated.areas)) {
			issues.push(
				makeIssue(
					"layout-pattern.draft.missing",
					"contract",
					`composed.area "${area.areaId}" 에 대응하는 decorated verification 누락`,
					{ path: ["areas", area.areaId], nodeId: area.areaId, data: { areaId: area.areaId } },
				),
			);
		}
	}

	// decision: Compose가 decision-level draft를 만든 것만 매칭 가능
	const decisionsWithDraft = new Map<string, CompositionDecision>();
	for (const decision of composition.decisions) {
		if (decision.layoutPatternDraft) decisionsWithDraft.set(decision.id, decision);
	}
	for (const [decisionId, verification] of Object.entries(decorated.decisions)) {
		const decision = decisionsWithDraft.get(decisionId);
		if (!decision) {
			issues.push(
				makeIssue(
					"layout-pattern.verification.change-unjustified",
					"reference",
					`decorated.decisions의 decisionId "${decisionId}" 가 composed의 decision-level draft를 가진 decision이 아님`,
					{ path: ["decisions", decisionId], nodeId: decisionId, data: { decisionId } },
				),
			);
			continue;
		}
		verifyChange(
			verification,
			decision.layoutPatternDraft,
			{ path: ["decisions", decisionId], nodeId: decisionId, nodeKind: "group" },
			designIndex.documents,
			issues,
		);
	}

	return issues;
}

function verifyChange(
	verification: LayoutPatternVerification,
	originalDraft: LayoutPatternDraft | undefined,
	extras: { path: ReadonlyArray<string | number>; nodeId: string; nodeKind: string },
	designDocuments: ReadonlyMap<string, unknown>,
	issues: ValidationIssue[],
): void {
	if (!originalDraft) return; // Compose가 draft를 안 만든 자리는 검사 대상 아님

	const final = verification.finalLayoutPattern;
	const idChanged = final.layoutPatternId !== originalDraft.layoutPatternId;
	const variantChanged = (final.variant ?? "") !== (originalDraft.variant ?? "");
	const changed = idChanged || variantChanged;

	// verdict ↔ 실제 변경 여부 일관성
	if (verification.verdict === "accepted" && changed) {
		issues.push(
			makeIssue(
				"layout-pattern.verification.change-unjustified",
				"contract",
				`${extras.nodeKind} "${extras.nodeId}" verdict는 "accepted" 인데 finalLayoutPattern이 원 draft와 다름`,
				{ path: extras.path, nodeId: extras.nodeId, data: { originalDraft, final } },
			),
		);
	}
	if (verification.verdict === "variant-adjusted" && idChanged) {
		issues.push(
			makeIssue(
				"layout-pattern.verification.change-unjustified",
				"contract",
				`${extras.nodeKind} "${extras.nodeId}" verdict는 "variant-adjusted" 인데 layoutPatternId가 변경됨`,
				{ path: extras.path, nodeId: extras.nodeId, data: { originalDraft, final } },
			),
		);
	}

	if (!changed) return;

	// 변경 시 3종 세트 필수: originalDraft 보존 + reasons + designRefs
	const missing: string[] = [];
	if (!verification.originalDraft) missing.push("originalDraft");
	if (
		verification.originalDraft &&
		!sameLayoutPatternDraft(verification.originalDraft, originalDraft)
	) {
		missing.push("originalDraft-match");
	}
	if (!verification.reasons || verification.reasons.length === 0) missing.push("reasons");
	if (!verification.designRefs || verification.designRefs.length === 0) missing.push("designRefs");

	if (missing.length > 0) {
		issues.push(
			makeIssue(
				"layout-pattern.verification.change-unjustified",
				"contract",
				`${extras.nodeKind} "${extras.nodeId}" verification에서 draft 변경 시 필수 3종 세트 누락: ${missing.join(", ")}`,
				{
					path: extras.path,
					nodeId: extras.nodeId,
					data: { nodeKind: extras.nodeKind, missing, originalDraft, final },
				},
			),
		);
	}

	verification.designRefs?.forEach((ref, index) => {
		if (!designDocuments.has(ref.document)) {
			issues.push(
				makeIssue(
					"composition.design-refs.missing",
					"reference",
					`layoutPattern verification designRef.document "${ref.document}" 가 designDeck에 등록되지 않음`,
					{
						path: [...extras.path, "designRefs", index, "document"],
						nodeId: extras.nodeId,
						data: { document: ref.document },
					},
				),
			);
		}
	});
}

function sameLayoutPatternDraft(a: LayoutPatternDraft, b: LayoutPatternDraft): boolean {
	return (
		a.layoutPatternId === b.layoutPatternId &&
		(a.variant ?? "") === (b.variant ?? "") &&
		a.confidence === b.confidence &&
		a.reasons.length === b.reasons.length &&
		a.reasons.every((reason, index) => reason === b.reasons[index])
	);
}
