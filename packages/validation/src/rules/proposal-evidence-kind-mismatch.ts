import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";

/**
 * 제안의 근거는 kind와 일치해야 한다.
 * - source-gap: SourceSpec 요구의 격하 → sourceEvidence(소스 ref)가 있어야 한다.
 * - ux-improvement: 채택한 정답지 패턴의 카탈로그 부재 → referenceEvidence(reference id)가
 *   있어야 한다. 근거 없는 "그냥 더 나아 보임" 발명을 구조적으로 막는다.
 */
export const proposalEvidenceKindMismatchRule = defineRule({
	code: "proposal-evidence-kind-mismatch",
	target: "component-proposal",
	check(ctx) {
		const proposals = Array.isArray(ctx.tree.proposals) ? ctx.tree.proposals : [];
		proposals.forEach((proposal, index) => {
			if (!isRecord(proposal)) return;
			const sourceEvidence = Array.isArray(proposal.sourceEvidence) ? proposal.sourceEvidence : [];
			const referenceEvidence = Array.isArray(proposal.referenceEvidence)
				? proposal.referenceEvidence
				: [];

			if (proposal.kind === "ux-improvement" && referenceEvidence.length === 0) {
				ctx.report({
					message:
						"ux-improvement proposal must cite referenceEvidence (the adopted reference id). Without it the proposal is an ungrounded invention.",
					path: ["proposals", index, "referenceEvidence"],
				});
			}
			// source-gap(또는 kind 누락 시 기본 의미)은 소스 근거가 필요하다.
			if (proposal.kind !== "ux-improvement" && sourceEvidence.length === 0) {
				ctx.report({
					message: "source-gap proposal must cite sourceEvidence (a SourceSpec ref).",
					path: ["proposals", index, "sourceEvidence"],
				});
			}
		});
	},
});
