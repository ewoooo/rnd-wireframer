import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";

export const proposalNearestMatchUnknownRule = defineRule({
	code: "proposal-nearest-match-unknown",
	target: "component-proposal",
	check(ctx) {
		const catalogComponentTypes = ctx.proposalOptions?.catalogComponentTypes;
		if (!catalogComponentTypes) return;
		const catalogTypes = new Set(catalogComponentTypes);
		const proposals = Array.isArray(ctx.tree.proposals) ? ctx.tree.proposals : [];

		proposals.forEach((proposal, proposalIndex) => {
			if (!isRecord(proposal)) return;
			if (
				typeof proposal.nearestCatalogMatch !== "string" ||
				catalogTypes.has(proposal.nearestCatalogMatch)
			) {
				return;
			}
			ctx.report({
				message: `Component proposal nearestCatalogMatch is not a catalog component type: ${proposal.nearestCatalogMatch}.`,
				path: ["proposals", proposalIndex, "nearestCatalogMatch"],
			});
		});
	},
});
