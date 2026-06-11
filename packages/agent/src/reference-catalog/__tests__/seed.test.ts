import { describe, expect, it } from "vitest";
import { readAgentMarkdownDocument } from "../../docs/package-markdown";

describe("정답지 시드 frontmatter", () => {
	it("detail-confirmation는 id/situation/tags를 가진다", () => {
		const doc = readAgentMarkdownDocument(
			"../docs/references/screens/detail-confirmation/README.md",
		);
		expect(doc.frontmatter.id).toBe("detail-confirmation");
		expect(typeof doc.frontmatter.situation).toBe("string");
		expect(Array.isArray(doc.frontmatter.tags)).toBe(true);
		expect(doc.body.length).toBeGreaterThan(0);
	});

	it("area-form-address는 id/situation/tags를 가진다", () => {
		const doc = readAgentMarkdownDocument(
			"../docs/references/areas/area-form-address/README.md",
		);
		expect(doc.frontmatter.id).toBe("area-form-address");
		expect(typeof doc.frontmatter.situation).toBe("string");
		expect(Array.isArray(doc.frontmatter.tags)).toBe(true);
		expect(doc.body.length).toBeGreaterThan(0);
	});
});
