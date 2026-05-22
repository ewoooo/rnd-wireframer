import type {
	Consumer,
	MarketplaceOutcome,
	MarketplaceRequest,
	NegotiationOptions,
	NegotiationRound,
	ProviderTicket,
	Vendor,
} from "./types";

const DEFAULT_MAX_ROUNDS = 3;

export async function negotiate(
	request: MarketplaceRequest,
	vendor: Vendor,
	consumer: Consumer,
	options: NegotiationOptions = {},
): Promise<MarketplaceOutcome> {
	const maxRounds = options.maxRounds ?? DEFAULT_MAX_ROUNDS;
	const rounds: NegotiationRound[] = [];
	const rejected: string[] = [...(request.rejectedPatterns ?? [])];

	for (let round = 1; round <= maxRounds; round++) {
		const currentRequest: MarketplaceRequest = { ...request, rejectedPatterns: [...rejected] };
		const proposal = await vendor.propose(currentRequest);

		if (!proposal) {
			rounds.push({
				round,
				decision: {
					kind: "no-proposal",
					reason: rejected.length > 0 ? "no remaining candidates" : "no matching pattern in store",
				},
			});
			break;
		}

		const decision = await consumer.evaluate(proposal, currentRequest);
		rounds.push({ round, proposal, decision });

		if (decision.kind === "accept") {
			return { kind: "accepted", finalProposal: proposal, rounds };
		}
		rejected.push(proposal.patternId);
	}

	const ticket = buildTicket(request, rounds);
	if (options.ticketSink) {
		await options.ticketSink.append(ticket);
	}
	return { kind: "escalated", ticket, rounds };
}

function buildTicket(request: MarketplaceRequest, rounds: NegotiationRound[]): ProviderTicket {
	const lastRound = rounds.at(-1);
	const reason =
		lastRound?.decision.kind === "no-proposal"
			? rounds.length === 1
				? "no-proposal"
				: "all-rejected"
			: "low-confidence-only";

	return {
		ticketId: createTicketId(request),
		createdAt: new Date().toISOString(),
		target: request.target,
		context: request.context,
		reason,
		history: rounds,
	};
}

function createTicketId(request: MarketplaceRequest): string {
	const safeId = request.context.id.replace(/[^a-zA-Z0-9_-]/g, "_");
	const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
	return `tkt-${request.target}-${safeId}-${stamp}`;
}
