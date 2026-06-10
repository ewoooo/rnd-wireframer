import { describe, expect, it } from "vitest";
import type { EngineRequest } from "../contracts";
import { runDeterministicValidation } from "../functions/deterministic-validation";

function requestWithRenderTree(renderTree: unknown): EngineRequest {
	return {
		inputs: { renderTree },
		references: {},
		outputContract: {} as EngineRequest["outputContract"],
	};
}

const calloutWith = (title: unknown) => ({
	children: [
		{
			type: "Callout",
			metadata: { id: "comp.callout", title: "Callout" },
			props: { title },
		},
	],
});

describe("runDeterministicValidation — unresolved placeholder tokens", () => {
	it("flags a bound prop default left as a bare {token}", () => {
		const report = runDeterministicValidation(
			requestWithRenderTree(calloutWith({ bind: "api.failAxis", default: "{실패축}" })),
		);
		const placeholder = report.issues.filter((i) => i.code === "unresolved-placeholder-token");
		expect(placeholder).toHaveLength(1);
		expect(placeholder[0]?.severity).toBe("error");
		expect(placeholder[0]?.message).toContain("{실패축}");
		expect(placeholder[0]?.path).toContain("default");
	});

	it("does not flag a resolved default or a template/bind string", () => {
		const report = runDeterministicValidation(
			requestWithRenderTree(
				calloutWith({ bind: "api.failAxis", default: "가입 조건 문제로 담지 못했어요" }),
			),
		);
		expect(report.issues.some((i) => i.code === "unresolved-placeholder-token")).toBe(false);
	});

	it("does not flag a template string that merely contains a {token}", () => {
		const report = runDeterministicValidation(
			requestWithRenderTree(calloutWith("{실패축} 문제로 담지 못했어요")),
		);
		expect(report.issues.some((i) => i.code === "unresolved-placeholder-token")).toBe(false);
	});
});
