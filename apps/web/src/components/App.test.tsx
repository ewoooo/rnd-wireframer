import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "@/components/App";
import type { ScreenSummary } from "@/lib/screen-sources";

afterEach(cleanup);

describe("App workbench navigation", () => {
	it("switches tabs and keeps safe placeholders for disconnected views", () => {
		render(<App screens={createScreens()} />);

		expect(screen.getByRole("heading", { level: 1, name: "Preview Default" })).toBeInTheDocument();
		expect(screen.getByText("Selected screen")).toBeInTheDocument();
		expectStat("Areas", "0");
		expectStat("Components", "0");

		fireEvent.click(screen.getByRole("button", { name: "CMP" }));

		expect(screen.getByRole("heading", { level: 3, name: "Components" })).toBeInTheDocument();
		expect(
			screen.getByText(
				"이 탭은 예전 사이드바 UI만 복구된 상태입니다. 데이터 연결은 Screen 탭부터 사용합니다.",
			),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "ARE" }));

		expect(screen.getByRole("heading", { level: 3, name: "Areas" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "AGT" }));

		expect(screen.getByRole("heading", { name: "Agent" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "SMK" })).toHaveAttribute("href", "/smoke");
	});

	it("selects the first screen when a route is selected and switches variant chips", () => {
		render(<App screens={createScreens()} />);

		fireEvent.click(screen.getByRole("button", { name: /Member Route/ }));

		expect(screen.getByRole("heading", { level: 1, name: "Member Base" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "E1" }));

		expect(screen.getByRole("heading", { level: 1, name: "Member Base-E1" })).toBeInTheDocument();
		expect(screen.getByText("member-edge")).toBeInTheDocument();
	});
});

function createScreens(): ScreenSummary[] {
	return [
		{
			id: "preview-default",
			moduleId: "preview",
			route: "Preview Route",
			screenRouteId: "preview-route",
			screenVariantId: "preview-variant",
			screenVariantName: "Preview Default",
			screenVariantOrder: 1,
			sourcePath: "test",
			status: "table",
			title: "Preview Default",
			type: "PG",
		},
		{
			id: "member-base",
			moduleId: "mbr",
			order: 1,
			route: "Member Route",
			screenRouteId: "member-route",
			screenVariantId: "member-variant",
			screenVariantName: "Member Base",
			screenVariantOrder: 1,
			sourcePath: "test",
			status: "table",
			title: "Member Base",
			type: "FP",
		},
		{
			id: "member-edge",
			moduleId: "mbr",
			order: 2,
			route: "Member Route",
			screenRouteId: "member-route",
			screenVariantId: "member-variant",
			screenVariantName: "Member Base",
			screenVariantOrder: 1,
			sourcePath: "test",
			status: "table",
			title: "Member Base-E1",
			type: "FP",
		},
	];
}

function expectStat(label: string, value: string) {
	const statLabel = screen
		.getAllByText(label)
		.find((candidate) => candidate.parentElement?.textContent === `${label}${value}`);
	expect(statLabel).toBeDefined();
	if (!statLabel) throw new Error(`Missing ${label} stat`);
	expect(statLabel.parentElement).toHaveTextContent(value);
}
