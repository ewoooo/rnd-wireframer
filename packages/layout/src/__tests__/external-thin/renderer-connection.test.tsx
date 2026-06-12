import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
// 축6: renderer 연결 — layoutId → canonicalize → registry → 실제 DOM 렌더.
// renderer가 component를 해석할 때 쓰는 경로(registry + canonicalize)를 그대로 검증한다.
// (T7~T9 전까지 RED)
import { canonicalizeLayout } from "../../canonicalize-catalog";
import * as registry from "../../registry.generated";

describe("external-thin: renderer 연결 (layoutId → 실제 component)", () => {
	it("canonicalize+registry로 area 컴포넌트가 children을 실제 렌더한다", () => {
		const key = canonicalizeLayout("layout.area.bottomActionArea");
		expect(key, "bottomActionArea must canonicalize").toBeTruthy();
		const Component = (registry as Record<string, unknown>)[key as string] as (
			props: Record<string, unknown>,
		) => unknown;
		expect(typeof Component).toBe("function");

		const { container } = render(
			createElement(Component as never, {
				children: createElement("button", null, "인증 확인"),
			}),
		);
		expect(container.querySelector("button")?.textContent).toBe("인증 확인");
	});

	it("composite layoutId도 canonical component로 해석돼 렌더된다", () => {
		const key = canonicalizeLayout("layout.composite.componentAppBar");
		expect(key).toBeTruthy();
		const Component = (registry as Record<string, unknown>)[key as string] as (
			props: Record<string, unknown>,
		) => unknown;
		expect(typeof Component).toBe("function");
		const { container } = render(
			createElement(Component as never, { children: createElement("span", null, "타이틀") }),
		);
		expect(container.querySelector("span")?.textContent).toBe("타이틀");
	});
});
