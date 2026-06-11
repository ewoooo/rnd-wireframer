import { describe, expect, it } from "vitest";
import { screenGenerationPipelineV1 } from "../pipelines/screen-generation-v1";

function stepById(id: string) {
	const step = screenGenerationPipelineV1.steps.find((s) => s.id === id);
	if (!step) throw new Error(`step ${id} not found`);
	return step;
}

describe("screen-generation-v1 reference refs", () => {
	it("02-screen-intent가 screen/area reference index를 참조한다", () => {
		expect(stepById("02-screen-intent").references?.referenceIndex).toEqual({
			source: "reference-screen-index",
			id: undefined,
			version: undefined,
		});
		expect(stepById("02-screen-intent").references?.referenceAreaIndex).toEqual({
			source: "reference-area-index",
			id: undefined,
			version: undefined,
		});
	});

	it("03-composition이 screen/area reference catalog를 참조한다", () => {
		expect(stepById("03-composition").references?.referenceCatalog).toEqual({
			source: "reference-screen-catalog",
			id: undefined,
			version: undefined,
		});
		expect(stepById("03-composition").references?.referenceAreaCatalog).toEqual({
			source: "reference-area-catalog",
			id: undefined,
			version: undefined,
		});
	});
});
