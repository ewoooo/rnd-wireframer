import { createInferenceKnowledgeBase } from "@cx/inference";
import { describe, expect, it } from "vitest";

describe("Inference KnowledgeBase", () => {
	it("resolves output-contract refs through @cx/schema as SSOT objects", async () => {
		const knowledgeBase = createInferenceKnowledgeBase();

		const contract = await knowledgeBase.resolveOutputContract({
			source: "output-contract",
			id: "source-spec",
		});

		expect(contract).toMatchObject({
			kind: "output-contract",
			id: "source-spec",
			owner: "@cx/schema",
			sourceRef: "json-schema/source-spec",
			data: {
				dtoName: "SourceSpec",
				jsonSchema: {
					$id: "source-spec.v0.1",
				},
			},
		});
	});

	it("resolves component and layout catalog refs through owner inference resolvers", async () => {
		const knowledgeBase = createInferenceKnowledgeBase();

		const componentCatalog = await knowledgeBase.resolve({ source: "component-catalog" });
		const layoutCatalog = await knowledgeBase.resolve({ source: "layout-catalog" });

		expect(componentCatalog).toMatchObject({
			kind: "component-catalog",
			owner: "@cx/external",
		});
		expect(layoutCatalog).toMatchObject({
			kind: "layout-catalog",
			owner: "@cx/layout",
		});
	});

	it("resolves skillset and token refs through owner inference resolvers", async () => {
		const knowledgeBase = createInferenceKnowledgeBase();

		const skillset = await knowledgeBase.resolve({
			source: "skillset",
			id: "screen-intent",
		});
		const tokens = await knowledgeBase.resolve({ source: "token-catalog" });

		expect(skillset).toMatchObject({
			kind: "skillset",
			id: "screen-intent",
			owner: "@cx/agent",
			data: {
				task: "screen-intent",
			},
		});
		expect(tokens).toMatchObject({
			kind: "token-catalog",
			owner: "@cx/tokens",
		});
	});
});
