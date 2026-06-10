import { describe, expect, it } from "vitest";
import { buildComponentProps } from "../adapters/build-component-props";

describe("buildComponentProps — bare type 캐논화(kiki. 접두사)", () => {
	it("bare type 'ActionButton'은 legacy label을 primaryText 후보로 읽고 비계약 props를 떨군다", () => {
		const out = buildComponentProps("ActionButton", {
			label: "계속하기",
			variant: "primary",
			size: "xlarge",
			fullWidth: true,
		});

		expect(out).toEqual({ primaryText: "계속하기" });
	});

	it("ActionButton canonical props는 catalog 계약대로 유지한다", () => {
		const out = buildComponentProps("ActionButton", {
			button: "1",
			primaryText: "계속하기",
			type: "Default",
		});

		expect(out).toEqual({
			button: "1",
			primaryText: "계속하기",
			type: "Default",
		});
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

	it("TitleSection은 legacy subText를 subtitle로 읽는다", () => {
		const out = buildComponentProps("TitleSection", {
			subText: "아래 사유를 확인해 주세요",
			title: "담기를 완료하지 못했어요",
		});

		expect(out).toEqual({
			subtitle: "아래 사유를 확인해 주세요",
			title: "담기를 완료하지 못했어요",
		});
	});

	it("texts 컨테이너의 legacy subText도 TitleSection subtitle source로 읽는다", () => {
		const out = buildComponentProps("TitleSection", {
			texts: {
				subText: "충돌 항목을 확인해 주세요",
				title: "선택 구성 검증 결과",
			},
		});

		expect(out).toEqual({
			subtitle: "충돌 항목을 확인해 주세요",
			title: "선택 구성 검증 결과",
		});
	});

	it("같은 컴포넌트가 subtitle과 subText를 모두 소유하면 서로 alias하지 않는다", () => {
		const out = buildComponentProps("ProductInfoHorizontal", {
			mainText: "상품명",
			subText: "서브 텍스트",
		});

		expect(out.subtitle).toBeUndefined();
		expect(out.mainText).toBe("상품명");
		expect(out.subText).toBe("서브 텍스트");
	});
});
