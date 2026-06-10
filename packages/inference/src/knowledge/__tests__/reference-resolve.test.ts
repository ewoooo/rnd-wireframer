import { describe, expect, it } from "vitest";
import { createInferenceKnowledgeBase } from "../knowledge-base";

describe("knowledge base — reference-* dispatch", () => {
	const kb = createInferenceKnowledgeBase();

	it("reference-screen-index를 reference-catalog object로 resolve한다", async () => {
		const ref = await kb.resolve({ source: "reference-screen-index" });
		expect(Array.isArray(ref) ? ref[0].kind : ref.kind).toBe("reference-catalog");
	});

	it("reference-screen-catalog는 body를 포함한다", async () => {
		const ref = await kb.resolve({ source: "reference-screen-catalog" });
		const obj = Array.isArray(ref) ? ref[0] : ref;
		expect(obj.kind).toBe("reference-catalog");
		if (obj.kind === "reference-catalog") {
			expect(obj.data.mode).toBe("catalog");
		}
	});
});
