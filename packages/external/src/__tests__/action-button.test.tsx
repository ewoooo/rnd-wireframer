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
