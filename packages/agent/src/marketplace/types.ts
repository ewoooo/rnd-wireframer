import type { Pattern, PatternStoreTarget } from "../pattern-store";

export interface MarketplaceContext {
	id: string;
	name?: string;
	description?: string;
	organismPatternIds?: string[];
	compositeTypes?: string[];
}

export interface MarketplaceRequest {
	target: PatternStoreTarget;
	context: MarketplaceContext;
	rejectedPatterns?: string[];
}

export type MarketplaceConfidence = "high" | "medium" | "low";

export interface MarketplaceProposal {
	patternId: string;
	variantId: string;
	reasons: string[];
	alternatives: string[];
	confidence: MarketplaceConfidence;
	score: number;
}

export type MarketplaceDecision =
	| { kind: "accept"; reasons: string[] }
	| { kind: "reject"; reason: string };

export interface NegotiationRound {
	round: number;
	proposal?: MarketplaceProposal;
	decision: MarketplaceDecision | { kind: "no-proposal"; reason: string };
}

export type MarketplaceOutcome =
	| {
			kind: "accepted";
			finalProposal: MarketplaceProposal;
			rounds: NegotiationRound[];
	  }
	| {
			kind: "escalated";
			ticket: ProviderTicket;
			rounds: NegotiationRound[];
	  };

export interface ProviderTicket {
	ticketId: string;
	createdAt: string;
	target: PatternStoreTarget;
	context: MarketplaceContext;
	reason: "no-proposal" | "all-rejected" | "low-confidence-only";
	history: NegotiationRound[];
}

export interface Vendor {
	propose(
		request: MarketplaceRequest,
	): MarketplaceProposal | undefined | Promise<MarketplaceProposal | undefined>;
}

export interface Consumer {
	evaluate(
		proposal: MarketplaceProposal,
		request: MarketplaceRequest,
	): MarketplaceDecision | Promise<MarketplaceDecision>;
}

export interface TicketSink {
	append(ticket: ProviderTicket): Promise<void>;
}

export interface NegotiationOptions {
	maxRounds?: number;
	ticketSink?: TicketSink;
}

export type { Pattern };
