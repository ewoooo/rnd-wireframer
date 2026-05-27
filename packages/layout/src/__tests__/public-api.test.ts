import { AppScreen, Flex, Grid, isScreenNode } from "@cx/layout";
import { ScreenRegion } from "@cx/layout/chrome";
import { Flex as PrimitiveFlex, Grid as PrimitiveGrid } from "@cx/layout/primitives";
import { cx, spacingFallbackStyleValue, spacingUtilityClass } from "@cx/layout/style";
import { LAYOUT_NODE_TYPES } from "@cx/layout/types";
import { describe, expect, it } from "vitest";

describe("@cx/layout public API", () => {
	it("exports public components, contracts, style helpers, and types", () => {
		expect(AppScreen).toBeTypeOf("function");
		expect(ScreenRegion).toBeTypeOf("function");
		expect(Flex).toBe(PrimitiveFlex);
		expect(Grid).toBe(PrimitiveGrid);
		expect(isScreenNode).toBeTypeOf("function");
		expect(LAYOUT_NODE_TYPES.screenRoot).toEqual(["Screen"]);
	});

	it("keeps style helpers on the explicit style public surface", () => {
		expect(cx("a", undefined, false, "b")).toBe("a b");
		expect(spacingUtilityClass("gap", 8)).toBe("gap-cx-8");
		expect(spacingUtilityClass("gap", 7)).toBeUndefined();
		expect(spacingFallbackStyleValue(7)).toBe(7);
	});
});
