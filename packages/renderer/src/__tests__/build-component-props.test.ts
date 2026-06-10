import { describe, expect, it } from "vitest";
import { buildComponentProps } from "../adapters/build-component-props";

describe("buildComponentProps — bare type 캐논화(kiki. 접두사)", () => {
	it("bare type 'ActionButton'도 kiki.ActionButton 계약을 찾아 비계약 props를 떨군다", () => {
		const out = buildComponentProps("ActionButton", {
			label: "계속하기",
			variant: "primary",
			size: "xlarge",
			fullWidth: true,
		});

		// kiki.ActionButton 계약에는 label/variant/size/fullWidth가 없다 → 모두 제거.
		expect(out).toEqual({});
	});

	it("bare type 'TextButton'은 계약 텍스트 prop(label)은 유지하고 비계약 prop은 떨군다", () => {
		const out = buildComponentProps("TextButton", {
			label: "나중에 다시 보기",
			underline: true,
		});

		expect(out.label).toBe("나중에 다시 보기");
		expect(out).not.toHaveProperty("underline");
	});

	it("canonical 키('kiki.TextButton')와 bare 키('TextButton')는 같은 결과를 낸다", () => {
		const props = { label: "보기", underline: true };
		expect(buildComponentProps("TextButton", props)).toEqual(
			buildComponentProps("kiki.TextButton", props),
		);
	});

	it("미등록 type은 기존대로 passthrough", () => {
		const out = buildComponentProps("TotallyUnknown", { anything: 1 });
		expect(out).toEqual({ anything: 1 });
	});
});
