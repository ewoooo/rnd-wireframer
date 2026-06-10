import { getJsonSchema, SCHEMA_VERSION } from "@cx/schema";
import { validateSchemaArtifact } from "@cx/validation";
import { describe, expect, it } from "vitest";

const valid = {
	schemaVersion: SCHEMA_VERSION.screenIntent,
	coreJudgment: "사용자는 두 요금제 중 하나를 선택해야 한다",
	firstUnderstanding: "현재 요금제와 변경 후 요금제의 차액",
	ctaPromise: "선택한 요금제로 즉시 변경됨을 약속한다",
	contentPriority: ["area.summary", "area.options"],
	sourceInterpretation: { preserve: ["price"], summarize: [], defer: [] },
};

describe("screen-intent.v0.2 JSON Schema", () => {
	it("$id가 v0.2다", () => {
		expect(getJsonSchema("screen-intent").$id).toBe("screen-intent.v0.2");
	});
	it("신규 required 필드를 포함한 객체는 통과한다", () => {
		expect(validateSchemaArtifact("screen-intent", valid).ok).toBe(true);
	});
	it("coreJudgment 누락 시 거부한다", () => {
		const { coreJudgment, ...rest } = valid;
		expect(validateSchemaArtifact("screen-intent", rest).ok).toBe(false);
	});
	it("optional referenceMatch 형태를 허용한다", () => {
		expect(
			validateSchemaArtifact("screen-intent", {
				...valid,
				referenceMatch: { referenceIds: ["ref-x"], matchedPattern: "choice" },
			}).ok,
		).toBe(true);
	});
	it("제거된 screenPurpose는 additionalProperties:false로 거부한다", () => {
		expect(validateSchemaArtifact("screen-intent", { ...valid, screenPurpose: "x" }).ok).toBe(false);
	});
});
