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
			owner: "@cx/components",
		});
		expect(layoutCatalog).toMatchObject({
			kind: "layout-catalog",
			owner: "@cx/layout",
		});
	});

	it("resolves skill, prompt, and token refs through owner inference resolvers", async () => {
		const knowledgeBase = createInferenceKnowledgeBase();

		const skill = await knowledgeBase.resolve({ source: "skill", id: "screen-generation" });
		const skillset = await knowledgeBase.resolve({
			source: "stage-skillset",
			id: "understand.screen-intent",
		});
		const prompt = await knowledgeBase.resolve({
			source: "prompt-catalog",
			id: "screen-generation",
		});
		const tokens = await knowledgeBase.resolve({ source: "token-catalog" });

		expect(skill).toMatchObject({
			kind: "skill",
			owner: "@cx/agent",
			data: {
				format: "json",
			},
		});
		expect(skillset).toMatchObject({
			kind: "stage-skillset",
			id: "understand.screen-intent",
			owner: "@cx/agent",
			data: {
				stage: "understand",
				task: "screen-intent",
			},
		});
		expect(prompt).toMatchObject({
			kind: "prompt-catalog",
			owner: "@cx/agent",
		});
		expect(tokens).toMatchObject({
			kind: "token-catalog",
			owner: "@cx/tokens",
		});
	});
});
