import { describe, expect, it } from "vitest";
import { VALIDATION_CODE_REGISTRY } from "../public/registry";

const LAYERS = ["input-guard", "system", "quality"] as const;
const SEVERITIES = ["error", "warning"] as const;
const OWNERS = ["engine", "rule"] as const;

describe("VALIDATION_CODE_REGISTRY", () => {
	it("declares layer, severity, owners, and a description for every code", () => {
		for (const [code, meta] of Object.entries(VALIDATION_CODE_REGISTRY)) {
			expect(LAYERS, `${code}.layer`).toContain(meta.layer);
			expect(SEVERITIES, `${code}.severity`).toContain(meta.severity);
			expect(meta.owners.length, `${code}.owners`).toBeGreaterThan(0);
			for (const owner of meta.owners) {
				expect(OWNERS, `${code}.owners`).toContain(owner);
			}
			expect(meta.description.length, `${code}.description`).toBeGreaterThan(0);
		}
	});

	it("keeps severity decisions in the registry, matching the legacy call-site values", () => {
		const warningCodes = Object.entries(VALIDATION_CODE_REGISTRY)
			.filter(([, meta]) => meta.severity === "warning")
			.map(([code]) => code)
			.sort();
		expect(warningCodes).toEqual([
			"internal-visible-title",
			"layout-ref-outside-candidates",
			"proposal-nearest-match-unknown",
			"source-ref-not-materialized",
			"state-coverage-missing",
			"unknown-prop",
			"unknown-source-ref",
			"uses-candidate-component",
		]);
	});
});
