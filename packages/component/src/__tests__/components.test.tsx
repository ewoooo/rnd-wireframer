import { readFile } from "node:fs/promises";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "../Button";

describe("@cx/components", () => {
	it("renders imported cx-components source", () => {
		render(<Button>확인</Button>);

		expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
	});

	it("maps SKT spacing tokens through generated Tailwind v4 theme variables", async () => {
		const themeCss = await readFile("packages/token/src/generated/tailwind-theme.css", "utf8");
		const componentShimCss = await readFile("packages/component/src/tailwind/theme.css", "utf8");

		expect(themeCss).toContain("@theme");
		expect(themeCss).toContain("--spacing-cx-12: var(--skt-spacing-12);");
		expect(themeCss).toContain("--spacing-cx-none: var(--skt-spacing-none);");
		expect(componentShimCss.trim()).toBe('@import "@cx/tokens/tailwind.css";');
	});
});
