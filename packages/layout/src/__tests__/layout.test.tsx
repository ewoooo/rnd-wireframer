import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppScreen, Flex } from "../index";
import type { ScreenNode } from "../types";

const metadata = (id: string, title: string) => ({
	id,
	title,
	author: "test-author",
	createdAt: "2026-05-21T00:00:00Z",
	updatedAt: "2026-05-21T00:00:00Z",
});

const screenNode: ScreenNode = {
	type: "Screen",
	componentVersion: "1.0.0",
	metadata: metadata("screen-root", "테스트 화면"),
	children: [
		{
			type: "Screen.Header",
			componentVersion: "1.0.0",
			metadata: metadata("header", "헤더"),
			props: {
				position: "fixed",
				height: 56,
				layout: {
					direction: "column",
					gap: 0,
				},
			},
		},
		{
			type: "Screen.Contents",
			componentVersion: "1.0.0",
			metadata: metadata("contents", "본문"),
			props: {
				scroll: true,
				layout: {
					direction: "column",
					gap: 12,
					paddingX: 16,
				},
			},
			children: [],
		},
		{
			type: "Screen.Bottom",
			componentVersion: "1.0.0",
			metadata: metadata("bottom", "하단"),
			props: {
				position: "fixed",
				height: 88,
				layout: {
					direction: "column",
					gap: 0,
				},
			},
		},
	],
};

describe("@cx/layout", () => {
	it("renders screen regions from a wireframe Screen node", () => {
		render(
			<AppScreen
				node={screenNode}
				header={<span>상단</span>}
				bottom={<button type="button">다음</button>}
			>
				<main>본문</main>
			</AppScreen>,
		);

		expect(screen.getByText("상단").closest("[data-region='Screen.Header']")).toBeInTheDocument();
		expect(screen.getByText("본문").closest("[data-region='Screen.Contents']")).toBeInTheDocument();
		expect(screen.getByText("다음").closest("[data-region='Screen.Bottom']")).toBeInTheDocument();
	});

	it("renders the system header as fixed app chrome outside wireframe regions", () => {
		const { container } = render(
			<AppScreen node={screenNode} header={<span>상단</span>}>
				<main>본문</main>
			</AppScreen>,
		);

		const systemHeader = container.querySelector("[data-chrome='SystemHeader']");

		expect(systemHeader).toBeInTheDocument();
		if (!systemHeader) throw new Error("SystemHeader chrome was not rendered");
		expect(systemHeader.closest("[data-region='Screen.Header']")).toBeNull();
		expect(systemHeader).toHaveTextContent("9:41");
	});

	it("uses Tailwind utility classes for wireframe flex layout props", () => {
		render(
			<Flex
				layout={{
					direction: "row",
					gap: 8,
					justify: "between",
					align: "center",
				}}
			>
				<span>left</span>
			</Flex>,
		);

		const layout = screen.getByText("left").parentElement;
		expect(layout).toHaveClass("flex", "flex-row", "gap-cx-8", "justify-between", "items-center");
	});
});
