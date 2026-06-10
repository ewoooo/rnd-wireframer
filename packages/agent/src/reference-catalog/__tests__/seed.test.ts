import { describe, expect, it } from "vitest";
import { readAgentMarkdownDocument } from "../../docs/package-markdown";

describe("정답지 시드 frontmatter", () => {
	it("ref-detail-confirmation는 id/situation/tags를 가진다", () => {
		const doc = readAgentMarkdownDocument(
			"../docs/skills/references/screens/ref-detail-confirmation.md",
		);
		expect(doc.frontmatter.id).toBe("ref-detail-confirmation");
		expect(typeof doc.frontmatter.situation).toBe("string");
		expect(Array.isArray(doc.frontmatter.tags)).toBe(true);
		expect(doc.body.length).toBeGreaterThan(0);
	});
});
