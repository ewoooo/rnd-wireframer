import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListText } from "./ListText";

describe("ListText — variant 추론과 subText 노출", () => {
	it("table 미지정 + subText 있으면 'on'으로 추론해 subText를 노출한다", () => {
		const { container } = render(<ListText title="위임 범위" subText="통합" />);
		expect(screen.getByText("위임 범위")).toBeTruthy();
		expect(screen.getByText("통합")).toBeTruthy();
		// 셰브론(svg)은 기본 노출되지 않는다.
		expect(container.querySelector("svg")).toBeNull();
	});

	it("table 미지정 + subText 없으면 'off'로 추론하고, 셰브론은 기본 비활성이다", () => {
		const { container } = render(<ListText title="010-0000-0000 개별 수단 설정" />);
		expect(screen.getByText("010-0000-0000 개별 수단 설정")).toBeTruthy();
		expect(container.querySelector("svg")).toBeNull();
	});

	it("내비게이션 행은 showRightItem=true로 셰브론을 켠다", () => {
		const { container } = render(<ListText title="개별 수단 설정" showRightItem />);
		expect(container.querySelector("svg")).not.toBeNull();
	});

	it("'on'의 subText는 showRightItem=false여도 항상 노출된다", () => {
		render(
			<ListText table="on" title="결제 변경 권한" subText="결제 변경 가능" showRightItem={false} />,
		);
		expect(screen.getByText("결제 변경 가능")).toBeTruthy();
	});

	it("'firstTitle'은 price가 없으면 subText 값으로 폴백해 노출한다", () => {
		render(<ListText table="firstTitle" title="010-0000-0000" subText="55,000원 · 자동납부 5일" />);
		expect(screen.getByText("55,000원 · 자동납부 5일")).toBeTruthy();
	});

	it("'firstTitle'은 price가 있으면 price를 우선한다", () => {
		render(<ListText table="firstTitle" title="요금" price="55,000원" subText="무시됨" />);
		expect(screen.getByText("55,000원")).toBeTruthy();
		expect(screen.queryByText("무시됨")).toBeNull();
	});
});
