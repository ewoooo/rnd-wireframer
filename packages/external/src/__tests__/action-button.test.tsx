import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionButton } from "../components/ActionButton/ActionButton";

describe("ActionButton", () => {
	it("renders catalog Default/1 props as a single primary CTA", () => {
		render(<ActionButton type="Default" button="1" primaryText="계속하기" />);

		expect(screen.getByRole("button", { name: "계속하기" })).toBeInTheDocument();
		expect(screen.queryByText("텍스트")).not.toBeInTheDocument();
	});

	it("renders catalog Ai/2 props as the AI double action variant", () => {
		render(<ActionButton type="Ai" button="2" leftText="추천" rightText="적용" topText="맞춤" />);

		expect(screen.getByText("맞춤")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "추천" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "적용" })).toBeInTheDocument();
	});

	it("Default/2는 가격 props가 명시되지 않으면 가격 row를 숨긴다", () => {
		render(
			<ActionButton type="Default" button="2" primaryText="홈으로" secondaryText="내 정보로" />,
		);

		expect(screen.getByRole("button", { name: "홈으로" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "내 정보로" })).toBeInTheDocument();
		expect(screen.queryByText("이용 금액")).not.toBeInTheDocument();
		expect(screen.queryByText("7,900원")).not.toBeInTheDocument();
	});

	it("type을 생략한 TwoButton CTA는 Default/2로 렌더한다", () => {
		render(<ActionButton button="2" primaryText="홈으로" secondaryText="내 정보로" />);

		expect(screen.getByRole("button", { name: "홈으로" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "내 정보로" })).toBeInTheDocument();
		expect(screen.queryByText("텍스트")).not.toBeInTheDocument();
	});

	it("Default/2는 showText와 가격 props가 명시되면 가격 row를 렌더한다", () => {
		render(
			<ActionButton
				type="Default"
				button="2"
				showText
				priceLabel="월 이용금액"
				period="1개월/"
				price="9,900원"
				primaryText="확인"
				secondaryText="취소"
			/>,
		);

		expect(screen.getByText("월 이용금액")).toBeInTheDocument();
		expect(screen.getByText("1개월/")).toBeInTheDocument();
		expect(screen.getByText("9,900원")).toBeInTheDocument();
	});

	it("disabled=false(기본)면 primary 클릭 핸들러를 호출한다", () => {
		let clicked = 0;
		render(
			<ActionButton
				type="Default"
				button="1"
				primaryText="다음"
				onPrimaryClick={() => clicked++}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "다음" }));
		expect(clicked).toBe(1);
	});

	it("disabled면 primary 클릭 핸들러를 호출하지 않는다", () => {
		let clicked = 0;
		render(
			<ActionButton
				type="Default"
				button="1"
				primaryText="다음"
				disabled
				onPrimaryClick={() => clicked++}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "다음" }));
		expect(clicked).toBe(0);
	});

	it("disabled면 aria-disabled를 노출한다", () => {
		render(<ActionButton type="Default" button="1" primaryText="다음" disabled />);

		expect(
			screen.getByRole("button", { name: "다음" }).closest("[aria-disabled='true']"),
		).not.toBeNull();
	});
});
