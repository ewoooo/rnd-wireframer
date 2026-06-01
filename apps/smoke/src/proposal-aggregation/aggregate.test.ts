import { describe, expect, it } from "vitest";
import { aggregateProposals } from "./aggregate";

describe("aggregateProposals", () => {
	it("dedups by proposedComponentType and counts frequency", () => {
		const backlog = aggregateProposals([
			{ proposals: [{ proposedComponentType: "RadioGroup", sourceEvidence: ["A"], nearestCatalogMatch: "Radio" }] },
			{ proposals: [{ proposedComponentType: "RadioGroup", sourceEvidence: ["B"], nearestCatalogMatch: "Radio" }] },
			{ proposals: [{ proposedComponentType: "TitleSection", sourceEvidence: ["C"], nearestCatalogMatch: "AppBar" }] },
		]);

		expect(backlog[0]).toMatchObject({ proposedComponentType: "RadioGroup", count: 2 });
		expect(backlog[0]?.evidence.sort()).toEqual(["A", "B"]);
		expect(backlog[0]?.nearestCatalogMatches).toEqual(["Radio"]);
		expect(backlog[1]).toMatchObject({ proposedComponentType: "TitleSection", count: 1 });
	});

	it("reads proposals from an agent payload wrapper", () => {
		const backlog = aggregateProposals([
			{ payload: { proposals: [{ proposedComponentType: "RadioGroup" }] } },
		]);
		expect(backlog).toEqual([
			{
				proposedComponentType: "RadioGroup",
				count: 1,
				evidence: [],
				nearestCatalogMatches: [],
				rationales: [],
			},
		]);
	});

	it("ranks higher-frequency proposals first", () => {
		const backlog = aggregateProposals([
			{ proposals: [{ proposedComponentType: "Rare" }] },
			{ proposals: [{ proposedComponentType: "Common" }] },
			{ proposals: [{ proposedComponentType: "Common" }] },
		]);
		expect(backlog.map((entry) => entry.proposedComponentType)).toEqual(["Common", "Rare"]);
	});
});
