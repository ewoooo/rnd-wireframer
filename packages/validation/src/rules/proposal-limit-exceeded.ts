import { defineRule } from "./define-rule";

export const proposalLimitExceededRule = defineRule({
	code: "proposal-limit-exceeded",
	target: "component-proposal",
	check(ctx) {
		const proposals = Array.isArray(ctx.tree.proposals) ? ctx.tree.proposals : [];
		const maxProposals = ctx.proposalOptions?.maxProposals ?? 5;
		if (proposals.length <= maxProposals) return;
		ctx.report({
			message: `component-proposal returned ${proposals.length} proposals but at most ${maxProposals} are allowed.`,
			path: ["proposals"],
		});
	},
});
