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

	it("reference-area-index/catalog를 reference-catalog object로 resolve한다", async () => {
		const indexRef = await kb.resolve({ source: "reference-area-index" });
		const catalogRef = await kb.resolve({ source: "reference-area-catalog" });
		const index = Array.isArray(indexRef) ? indexRef[0] : indexRef;
		const catalog = Array.isArray(catalogRef) ? catalogRef[0] : catalogRef;
		expect(index.kind).toBe("reference-catalog");
		expect(catalog.kind).toBe("reference-catalog");
		if (index.kind === "reference-catalog" && catalog.kind === "reference-catalog") {
			expect(index.data.category).toBe("area");
			expect(index.data.mode).toBe("index");
			expect(catalog.data.category).toBe("area");
			expect(catalog.data.mode).toBe("catalog");
		}
	});
});
