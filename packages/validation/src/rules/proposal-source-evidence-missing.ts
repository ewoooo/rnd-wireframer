import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";

export const proposalSourceEvidenceMissingRule = defineRule({
	code: "proposal-source-evidence-missing",
	target: "component-proposal",
	check(ctx) {
		const allowedRefs = ctx.proposalOptions?.allowedRefs;
		if (!allowedRefs) return;
		const allowed = new Set(allowedRefs);
		const proposals = Array.isArray(ctx.tree.proposals) ? ctx.tree.proposals : [];

		proposals.forEach((proposal, proposalIndex) => {
			if (!isRecord(proposal)) return;
			const evidence = Array.isArray(proposal.sourceEvidence) ? proposal.sourceEvidence : [];
			evidence.forEach((ref, refIndex) => {
				if (typeof ref !== "string" || allowed.has(ref)) return;
				ctx.report({
					message: `Component proposal sourceEvidence is not in allowedRefs: ${ref}.`,
					path: ["proposals", proposalIndex, "sourceEvidence", refIndex],
				});
			});
		});
	},
});
