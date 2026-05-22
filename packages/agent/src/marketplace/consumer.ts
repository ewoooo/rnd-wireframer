import type {
	Consumer,
	MarketplaceDecision,
	MarketplaceProposal,
	MarketplaceRequest,
} from "./types";

export interface ConsumerOptions {
	minConfidence?: "high" | "medium" | "low";
}

export function createConsumer(options: ConsumerOptions = {}): Consumer {
	const minConfidence = options.minConfidence ?? "medium";
	const allowed = confidenceRank(minConfidence);

	return {
		evaluate(proposal: MarketplaceProposal, _request: MarketplaceRequest): MarketplaceDecision {
			if (confidenceRank(proposal.confidence) < allowed) {
				return {
					kind: "reject",
					reason: `confidence ${proposal.confidence} below threshold ${minConfidence}`,
				};
			}
			return { kind: "accept", reasons: proposal.reasons };
		},
	};
}

function confidenceRank(level: "high" | "medium" | "low"): number {
	if (level === "high") return 2;
	if (level === "medium") return 1;
	return 0;
}
