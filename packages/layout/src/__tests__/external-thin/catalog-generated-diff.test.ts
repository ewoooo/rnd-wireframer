import { describe, expect, it } from "vitest";
import areaPatterns from "../../catalog/area-patterns.json";
import compositePatterns from "../../catalog/composite-patterns.json";
import regionPatterns from "../../catalog/region-patterns.json";
import screenPatterns from "../../catalog/screen-patterns.json";
// Diff guard: the GENERATED catalog (from *.meta.ts SOT) must carry the same
// {id, target, sorted prop-key list} set as the legacy reconciled JSON catalog.
// Proves no entry/prop was dropped in the meta migration.
// NOT compared: status (legacy="draft" by design vs generated="stable"),
// prop value contracts beyond keys (both came from the same reconciled source).
import { layoutCatalog } from "../../catalog.generated";

type LegacyPattern = {
	id: string;
	target: string;
	props?: Record<string, unknown>;
};

type Signature = { id: string; target: string; propKeys: string };

function sigOf(id: string, target: string, props?: Record<string, unknown>): Signature {
	return {
		id,
		target,
		propKeys: Object.keys(props ?? {})
			.slice()
			.sort()
			.join(","),
	};
}

function sortSigs(sigs: Signature[]): Signature[] {
	return sigs.slice().sort((a, b) => a.id.localeCompare(b.id));
}

const legacyPatterns: LegacyPattern[] = [
	...(screenPatterns as { patterns: LegacyPattern[] }).patterns,
	...(regionPatterns as { patterns: LegacyPattern[] }).patterns,
	...(areaPatterns as { patterns: LegacyPattern[] }).patterns,
	...(compositePatterns as { patterns: LegacyPattern[] }).patterns,
];

describe("external-thin: catalog.generated == legacy JSON (id/target/prop-keys)", () => {
	const generatedSigs = sortSigs(
		Object.values(layoutCatalog).map((e) => sigOf(e.id, e.target, e.props)),
	);
	const legacySigs = sortSigs(legacyPatterns.map((p) => sigOf(p.id, p.target, p.props)));

	it("entry counts match", () => {
		expect(generatedSigs.length).toBe(legacySigs.length);
	});

	it("the {id, target, prop-key} signature set is identical", () => {
		expect(generatedSigs).toEqual(legacySigs);
	});
});
