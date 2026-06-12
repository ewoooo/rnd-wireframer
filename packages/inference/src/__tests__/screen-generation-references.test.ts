import { describe, expect, it } from "vitest";
import { screenGenerationPipelineV1 } from "../pipelines/screen-generation-v1";

function stepById(id: string) {
	const step = screenGenerationPipelineV1.steps.find((s) => s.id === id);
	if (!step) throw new Error(`step ${id} not found`);
	return step;
}

describe("screen-generation-v1 reference refs", () => {
	it("02-intent-composition이 screen/area reference catalog를 참조한다", () => {
		expect(stepById("02-intent-composition").references?.referenceCatalog).toEqual({
			source: "reference-screen-catalog",
			id: undefined,
			version: undefined,
		});
		expect(stepById("02-intent-composition").references?.referenceAreaCatalog).toEqual({
			source: "reference-area-catalog",
			id: undefined,
			version: undefined,
		});
	});
});
