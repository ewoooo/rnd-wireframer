export type ProposalKind = "source-gap" | "ux-improvement";

export type ProposalEntry = {
	proposedComponentType: string;
	kind?: ProposalKind;
	sourceEvidence?: string[];
	referenceEvidence?: string[];
	nearestCatalogMatch?: string;
	rationale?: string;
};

/** A component-proposal.json document (with or without an agent `payload` wrapper). */
export type ProposalDocument =
	| { proposals?: ProposalEntry[] }
	| { payload?: { proposals?: ProposalEntry[] } };

export type ProposalBacklogEntry = {
	proposedComponentType: string;
	count: number;
	/** 집계된 제안들의 kind 집합. source-gap만, ux-improvement만, 혼합일 수 있다. */
	kinds: ProposalKind[];
	evidence: string[];
	referenceEvidence: string[];
	nearestCatalogMatches: string[];
	rationales: string[];
};

function readProposals(doc: ProposalDocument): ProposalEntry[] {
	if ("proposals" in doc && Array.isArray(doc.proposals)) return doc.proposals;
	if ("payload" in doc && doc.payload && Array.isArray(doc.payload.proposals)) {
		return doc.payload.proposals;
	}
	return [];
}

/**
 * Dedup proposals across runs by proposedComponentType.
 * Ranks by frequency (count desc), then type name (asc) for stable ordering.
 */
export function aggregateProposals(docs: ProposalDocument[]): ProposalBacklogEntry[] {
	const byType = new Map<string, ProposalBacklogEntry>();

	for (const doc of docs) {
		for (const proposal of readProposals(doc)) {
			const type = proposal.proposedComponentType;
			if (!type) continue;
			const existing = byType.get(type) ?? {
				proposedComponentType: type,
				count: 0,
				kinds: [],
				evidence: [],
				referenceEvidence: [],
				nearestCatalogMatches: [],
				rationales: [],
			};
			existing.count += 1;
			if (proposal.kind && !existing.kinds.includes(proposal.kind)) {
				existing.kinds.push(proposal.kind);
			}
			for (const ref of proposal.sourceEvidence ?? []) {
				if (!existing.evidence.includes(ref)) existing.evidence.push(ref);
			}
			for (const ref of proposal.referenceEvidence ?? []) {
				if (!existing.referenceEvidence.includes(ref)) existing.referenceEvidence.push(ref);
			}
			if (
				proposal.nearestCatalogMatch &&
				!existing.nearestCatalogMatches.includes(proposal.nearestCatalogMatch)
			) {
				existing.nearestCatalogMatches.push(proposal.nearestCatalogMatch);
			}
			if (proposal.rationale) existing.rationales.push(proposal.rationale);
			byType.set(type, existing);
		}
	}

	return [...byType.values()].sort(
		(left, right) =>
			right.count - left.count ||
			left.proposedComponentType.localeCompare(right.proposedComponentType),
	);
}
