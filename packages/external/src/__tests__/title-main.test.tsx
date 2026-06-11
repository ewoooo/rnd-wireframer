import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TitleMain } from "../components/TitleMain/TitleMain";

describe("TitleMain", () => {
	it("Complete는 deviceName이 명시되지 않으면 기기 row를 숨긴다", () => {
		render(<TitleMain type="Complete" title="회원 가입이 완료되었습니다" subText="환영합니다" />);

		expect(screen.getByText("회원 가입이 완료되었습니다")).toBeInTheDocument();
		expect(screen.queryByText("Device Name")).not.toBeInTheDocument();
	});

	it("Complete는 deviceName이 명시되면 기기명을 렌더한다", () => {
		render(
			<TitleMain
				type="Complete"
				deviceName="갤럭시 S29"
				title="개통이 완료되었습니다"
				subText="바로 이용할 수 있습니다"
			/>,
		);

		expect(screen.getByText("갤럭시 S29")).toBeInTheDocument();
	});
});
