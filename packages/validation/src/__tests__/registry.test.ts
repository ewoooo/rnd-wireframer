import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { VALIDATION_CODE_REGISTRY } from "../public/registry";
import { QUALITY_RULES } from "../rules/index";

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

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REPO_ROOT = resolve(PACKAGE_ROOT, "../..");
const RULES_DIR = join(PACKAGE_ROOT, "src/rules");
const RULE_INFRA_FILES = new Set(["define-rule.ts", "helpers.ts", "index.ts", "source-spec.ts"]);

function listRuleFiles(): string[] {
	return readdirSync(RULES_DIR)
		.filter((file) => file.endsWith(".ts") && !RULE_INFRA_FILES.has(file))
		.map((file) => file.replace(/\.ts$/, ""));
}

describe("registry ⇔ rules drift guard", () => {
	it("registers exactly the codes whose owners include 'rule'", () => {
		// 같은 코드가 target별 변형 rule을 가질 수 있으므로 코드 단위로 dedup해 비교한다.
		const ruleCodes = [...new Set(QUALITY_RULES.map((rule) => rule.code))].sort();
		const registryRuleCodes = Object.entries(VALIDATION_CODE_REGISTRY)
			.filter(([, meta]) => meta.owners.includes("rule"))
			.map(([code]) => code)
			.sort();
		expect(ruleCodes).toEqual(registryRuleCodes);
	});

	it("keeps a 1:1 mapping between rule files and rule test files", () => {
		const ruleFiles = listRuleFiles();
		const uniqueRuleCodes = new Set(QUALITY_RULES.map((rule) => rule.code));
		expect(ruleFiles.length).toBe(uniqueRuleCodes.size);
		for (const ruleFile of ruleFiles) {
			const testPath = join(RULES_DIR, "__tests__", `${ruleFile}.test.ts`);
			expect(existsSync(testPath), `missing test for rule: ${ruleFile}`).toBe(true);
		}
	});

	it("names rule files after their codes", () => {
		const ruleFiles = new Set(listRuleFiles());
		for (const rule of QUALITY_RULES) {
			expect(ruleFiles.has(rule.code), `rule file for code: ${rule.code}`).toBe(true);
		}
	});

	it("points docRefs at files that exist", () => {
		for (const [code, meta] of Object.entries(VALIDATION_CODE_REGISTRY)) {
			if (!meta.docRef) continue;
			expect(existsSync(join(REPO_ROOT, meta.docRef)), `${code}.docRef: ${meta.docRef}`).toBe(true);
		}
	});
});
